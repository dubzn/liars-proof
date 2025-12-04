import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CallData, cairo } from "starknet";
import type { Call } from "starknet";
import { useStarknetKit } from "@/context/starknetkit";
import { useGameWatcher } from "@/hooks/useGameWatcher";
import { useParallax } from "@/hooks/useParallax";
import { useConditionGraphQL } from "@/hooks/useConditionGraphQL";
import { useRoundProofGraphQL } from "@/hooks/useRoundProofGraphQL";
import { retryTransaction, checkTransactionSuccess } from "@/utils/retryTransaction";
import { GameInfo } from "@/components/game/GameInfo";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { PlayerHandCards } from "@/components/game/PlayerHandCards";
import { ProcessingModal } from "@/components/login/ProcessingModal";
import { RoundResultModal } from "@/components/game/RoundResultModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { calculateHandCommitment, type Card } from "@/utils/handCommitment";
import { generateProofAndCalldata, initializeProofSystem } from "@/utils/proofGenerator";
import { savePlayerHand, loadPlayerHand } from "@/utils/playerHandStorage";
import type { ProofInput } from "@/types/proof";
import { toast } from "sonner";
import "./Game.css";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

// Helper to get game state variant
const getGameStateVariant = (state: any): string => {
  if (!state) return "WaitingForHandCommitments";
  if (typeof state === "string") return state;
  if (state.variant) return state.variant;
  if (state.WaitingForPlayers !== undefined) return "WaitingForPlayers";
  if (state.WaitingForHandCommitments !== undefined) return "WaitingForHandCommitments";
  if (state.ConditionPhase !== undefined) return "ConditionPhase";
  if (state.ChallengePhase !== undefined) return "ChallengePhase";
  if (state.ResultPhase !== undefined) return "ResultPhase";
  if (state.GameOver !== undefined) return "GameOver";
  return "WaitingForHandCommitments";
};

// Interface for round result snapshot
interface RoundResultSnapshot {
  // Game state before resolution
  player_1_score: number;
  player_2_score: number;
  player_1_lives: number;
  player_2_lives: number;
  round: number;
  // Choices before resolution
  player_1_condition_choice: boolean | null;
  player_2_condition_choice: boolean | null;
  player_1_challenge_choice: boolean | null;
  player_2_challenge_choice: boolean | null;
  // Proofs validity
  player_1_proof_valid: boolean | null;
  player_2_proof_valid: boolean | null;
}

const generateRandomHand = (): Card[] => {
  const hand: Card[] = [];
  const usedCards = new Set<string>();

  while (hand.length < 3) {
    const value = Math.floor(Math.random() * 13) + 1;
    const suit = Math.floor(Math.random() * 4) + 1;
    const cardKey = `${suit}-${value}`;

    if (!usedCards.has(cardKey)) {
      usedCards.add(cardKey);
      hand.push({ suit, value });
    }
  }
  return hand;
};

export const Game = () => {
  const { game_id } = useParams<{ game_id: string }>();
  const { account } = useStarknetKit();
  const gameId = game_id ? parseInt(game_id) : 0;

  const parallaxOffset = useParallax(20);
  const backgroundOffset = useParallax(10);

  const [isHoveringCards, setIsHoveringCards] = useState(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [isSubmittingCommitment, setIsSubmittingCommitment] = useState(false);
  const [hasSubmittedCommitment, setHasSubmittedCommitment] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    title: string;
    message: string;
    explanation?: string;
  } | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  
  // Round result modal state
  const [showRoundResultModal, setShowRoundResultModal] = useState(false);
  const [roundResultData, setRoundResultData] = useState<{
    player1Lied: boolean;
    player2Lied: boolean;
    player1Believed: boolean;
    player2Believed: boolean;
    player1ScoreChange: number;
    player2ScoreChange: number;
    player1LivesChange: number;
    player2LivesChange: number;
    player1NewScore: number;
    player2NewScore: number;
    player1NewLives: number;
    player2NewLives: number;
  } | null>(null);

  // Refs to prevent duplicate operations
  const hasSubmittedProofRef = useRef(false);
  const handGeneratedRef = useRef(false);
  
  // Snapshot of game state BEFORE round resolution (captured before submitting proof)
  const roundSnapshotRef = useRef<RoundResultSnapshot | null>(null);
  
  // Track if we've already shown the result modal for this round
  const roundResultShownRef = useRef<number | null>(null);

  // Watch game state with GraphQL polling
  const { game } = useGameWatcher(gameId);

  // Fetch condition data for proof generation
  const conditionId = game ? Number(game.condition_id) : 0;
  const { condition } = useConditionGraphQL(conditionId);

  // Get current game state
  const currentGameState = game ? getGameStateVariant(game.state) : "WaitingForHandCommitments";
  const currentRound = game ? Number(game.round) : 0;
  const isResultPhase = currentGameState === "ResultPhase";

  // Fetch round proofs
  const player1Address = game?.player_1;
  const player2Address = game?.player_2;
  const {
    player1ProofSubmitted,
    player1ProofValid,
    player2ProofSubmitted,
    player2ProofValid,
  } = useRoundProofGraphQL(
    gameId,
    currentRound,
    player1Address,
    player2Address,
    isResultPhase
  );

  // Determine if current player is player_1 or player_2
  const isPlayer1 = game && account?.address === game.player_1 ? true : false;

  // Initialize proof system
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeProofSystem();
      } catch (error) {
        console.error("[Game] ❌ Failed to initialize proof system:", error);
        toast.error("Failed to initialize proof system");
      }
    };
    initialize();
  }, []);

  // Load or generate player hand
  useEffect(() => {
    if (!gameId || !account?.address || !game || handGeneratedRef.current) {
      return;
    }

    const userAddress = account.address;
    const gameState = getGameStateVariant(game.state);
    const isPlayer1 = userAddress === game.player_1;
    const isPlayer2 = userAddress === game.player_2;

    const savedHand = loadPlayerHand(gameId, userAddress);
    if (savedHand && savedHand.length === 3) {
      setPlayerHand(savedHand);
      handGeneratedRef.current = true;
      return;
    }

    const shouldGenerateHand =
      (isPlayer1 && gameState === "WaitingForPlayers") ||
      (isPlayer2 && gameState === "WaitingForHandCommitments" && game.player_2);

    if (shouldGenerateHand) {
      const newHand = generateRandomHand();
      setPlayerHand(newHand);
      savePlayerHand(gameId, userAddress, newHand);
      handGeneratedRef.current = true;
    }
  }, [gameId, account?.address, game]);

  // Reset hand generation ref when game/player changes
  useEffect(() => {
    handGeneratedRef.current = false;
  }, [gameId, account?.address]);

  // Check commitment status
  const player1CommitmentSubmitted = game ? Boolean(game.player_1_hand_commitment && game.player_1_hand_commitment !== "0x0" && game.player_1_hand_commitment !== "0") : false;
  const player2CommitmentSubmitted = game ? Boolean(game.player_2_hand_commitment && game.player_2_hand_commitment !== "0x0" && game.player_2_hand_commitment !== "0") : false;

  // Handle hand commitment submission (manual trigger via button)
  const handleSubmitCommitment = useCallback(async () => {
    if (!account || !game || hasSubmittedCommitment || isSubmittingCommitment || playerHand.length !== 3) {
      return;
    }

    const currentPlayerCommitmentSubmitted = isPlayer1 ? player1CommitmentSubmitted : player2CommitmentSubmitted;
    if (currentPlayerCommitmentSubmitted) {
      setHasSubmittedCommitment(true);
      return;
    }

    const gameState = getGameStateVariant(game.state);
    if (gameState !== "WaitingForHandCommitments") {
      return;
    }

    setIsSubmittingCommitment(true);
    try {
      setProcessingStatus({
        title: "SUBMITTING HAND COMMITMENT",
        explanation: "Committing your hand cards to start the game. Your cards will remain hidden until the end.",
        message: "Preparing transaction...",
      });

      const commitment = await calculateHandCommitment(playerHand);

      const submitHandCommitmentCall: Call = {
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "submit_hand_commitment",
        calldata: CallData.compile([gameId, cairo.uint256(commitment)]),
      };

      setProcessingStatus({
        title: "SUBMITTING HAND COMMITMENT",
        explanation: "Committing your hand cards to start the game. Your cards will remain hidden until the end.",
        message: "Transaction sent, waiting for confirmation (with automatic retry)...",
      });

      // Execute with automatic retry logic
      await retryTransaction(
        async () => {
          const result = await account.execute(submitHandCommitmentCall);
          console.log("[Game] Hand commitment tx hash:", result.transaction_hash);

          const receipt = await account.waitForTransaction(result.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          });

          // Verify transaction actually succeeded
          checkTransactionSuccess(receipt);
        },
        {
          maxAttempts: 20,
        }
      );

      setProcessingStatus(null);
      toast.success("Hand commitment submitted!");
      setHasSubmittedCommitment(true);
    } catch (error) {
      console.error("[Game] ❌ Error submitting hand commitment:", error);
      setProcessingStatus(null);
      toast.error(`Failed to submit hand commitment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmittingCommitment(false);
    }
  }, [
    account,
    game,
    gameId,
    playerHand,
    hasSubmittedCommitment,
    isSubmittingCommitment,
    isPlayer1,
    player1CommitmentSubmitted,
    player2CommitmentSubmitted,
  ]);

  // Capture snapshot when submitting proof (BEFORE the transaction)
  // This will be used later to compare with the state after round resolution

  // Helper to capture game state snapshot
  const captureGameSnapshot = useCallback((game: any): RoundResultSnapshot | null => {
    if (!game) return null;

    const player1ConditionChoice = game.player_1_condition_submitted
      ? (game.player_1_condition_choice === true || String(game.player_1_condition_choice) === "true" || Number(game.player_1_condition_choice) === 1 || String(game.player_1_condition_choice) === "1")
      : null;
    const player2ConditionChoice = game.player_2_condition_submitted
      ? (game.player_2_condition_choice === true || String(game.player_2_condition_choice) === "true" || Number(game.player_2_condition_choice) === 1 || String(game.player_2_condition_choice) === "1")
      : null;
    const player1ChallengeChoice = game.player_1_challenge_submitted
      ? (game.player_1_challenge_choice === true || String(game.player_1_challenge_choice) === "true" || Number(game.player_1_challenge_choice) === 1 || String(game.player_1_challenge_choice) === "1")
      : null;
    const player2ChallengeChoice = game.player_2_challenge_submitted
      ? (game.player_2_challenge_choice === true || String(game.player_2_challenge_choice) === "true" || Number(game.player_2_challenge_choice) === 1 || String(game.player_2_challenge_choice) === "1")
      : null;

    return {
      player_1_score: Number(game.player_1_score),
      player_2_score: Number(game.player_2_score),
      player_1_lives: Number(game.player_1_lives),
      player_2_lives: Number(game.player_2_lives),
      round: Number(game.round),
      player_1_condition_choice: player1ConditionChoice,
      player_2_condition_choice: player2ConditionChoice,
      player_1_challenge_choice: player1ChallengeChoice,
      player_2_challenge_choice: player2ChallengeChoice,
      player_1_proof_valid: null, // Will be updated when we know the proof validity
      player_2_proof_valid: null,
    };
  }, []);

  // Handle proof submission (manual trigger via button)
  const handleSubmitProof = useCallback(async () => {
    if (!account || !game || isSubmittingProof || hasSubmittedProofRef.current || playerHand.length !== 3) {
      return;
    }

    if (currentGameState !== "ResultPhase") {
      return;
    }

    const isPlayer1Local = account.address === game.player_1;
    const handCommitment = isPlayer1Local ? game.player_1_hand_commitment : game.player_2_hand_commitment;

    if (!handCommitment) {
      console.error("[Game] No hand commitment found");
      return;
    }

    setIsSubmittingProof(true);
    hasSubmittedProofRef.current = true;

    try {
      // CAPTURE SNAPSHOT BEFORE SUBMITTING PROOF
      // This ensures we have the state before round resolution
      if (game && !roundSnapshotRef.current) {
        const snapshot = captureGameSnapshot(game);
        if (snapshot) {
          roundSnapshotRef.current = snapshot;
          console.log("[Game] 📸 Snapshot captured before submitting proof:", {
            round: snapshot.round,
            player1_score: snapshot.player_1_score,
            player2_score: snapshot.player_2_score,
            player1_lives: snapshot.player_1_lives,
            player2_lives: snapshot.player_2_lives,
            player1_condition_choice: snapshot.player_1_condition_choice,
            player2_condition_choice: snapshot.player_2_condition_choice,
            player1_challenge_choice: snapshot.player_1_challenge_choice,
            player2_challenge_choice: snapshot.player_2_challenge_choice,
          });
        }
      }

      setProcessingStatus({
        title: "SUBMITTING PROOF",
        explanation: "Generating a zero-knowledge proof to verify that your hand meets the condition you claimed. This proof proves your claim without revealing your actual cards.",
        message: "Generating proof...",
      });

      if (!condition) {
        console.error("[Game] ❌ Condition data not loaded yet");
        toast.error("Waiting for condition data...");
        setProcessingStatus(null);
        hasSubmittedProofRef.current = false;
        setIsSubmittingProof(false);
        return;
      }

      const proofInput: ProofInput = {
        _game_id: gameId.toString(),
        hand_commitment: `0x${BigInt(handCommitment).toString(16)}`,
        condition_id: condition.condition?.toString() || "1",
        comparator: condition.comparator?.toString() || "0",
        value: condition.value?.toString() || "0",
        suit: condition.suit?.toString() || "0",
        hand: {
          card1_suit: playerHand[0].suit.toString(),
          card1_value: playerHand[0].value.toString(),
          card2_suit: playerHand[1].suit.toString(),
          card2_value: playerHand[1].value.toString(),
          card3_suit: playerHand[2].suit.toString(),
          card3_value: playerHand[2].value.toString(),
        },
      };

      const result = await generateProofAndCalldata(proofInput);

      const proofCalldata = result.calldata.length === 0
        ? [gameId.toString(), 0]
        : [gameId.toString(), ...result.calldata.map(item => typeof item === 'bigint' ? item.toString() : String(item))];

      setProcessingStatus({
        title: "SUBMITTING PROOF",
        explanation: "Generating a zero-knowledge proof to verify that your hand meets the condition you claimed. This proof proves your claim without revealing your actual cards.",
        message: "Transaction sent, waiting for confirmation (with automatic retry)...",
      });

      // Execute with automatic retry logic
      await retryTransaction(
        async () => {
          const txResult = await account.execute({
            contractAddress: GAME_CONTRACT_ADDRESS,
            entrypoint: "submit_round_proof",
            calldata: proofCalldata,
          });

          console.log("[Game] Proof tx hash:", txResult.transaction_hash);

          const receipt = await account.waitForTransaction(txResult.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          });

          // Verify transaction actually succeeded
          checkTransactionSuccess(receipt);
        },
        {
          maxAttempts: 20,
        }
      );

      setProcessingStatus(null);
      toast.success("Proof submitted successfully!");
    } catch (error) {
      console.error("[Game] ❌ Error generating/submitting proof:", error);
      setProcessingStatus(null);
      toast.error(`Failed to submit proof: ${error instanceof Error ? error.message : String(error)}`);
      hasSubmittedProofRef.current = false;
    } finally {
      setIsSubmittingProof(false);
    }
  }, [account, game, gameId, playerHand, isSubmittingProof, condition, currentGameState, captureGameSnapshot]);

  // Update snapshot with proof validities when proofs are submitted
  useEffect(() => {
    if (!roundSnapshotRef.current) return;

    let updated = false;
    // Update proof validities as they become available
    if (player1ProofSubmitted && roundSnapshotRef.current.player_1_proof_valid === null) {
      roundSnapshotRef.current.player_1_proof_valid = player1ProofValid === true;
      updated = true;
    }
    if (player2ProofSubmitted && roundSnapshotRef.current.player_2_proof_valid === null) {
      roundSnapshotRef.current.player_2_proof_valid = player2ProofValid === true;
      updated = true;
    }
    
    if (updated) {
      console.log("[Game] 🔄 Snapshot updated with proof validities:", {
        player1_proof_valid: roundSnapshotRef.current.player_1_proof_valid,
        player2_proof_valid: roundSnapshotRef.current.player_2_proof_valid,
        player1ProofSubmitted,
        player2ProofSubmitted,
      });
    }
  }, [player1ProofSubmitted, player1ProofValid, player2ProofSubmitted, player2ProofValid]);

  // Detect when round is resolved: state changes from ResultPhase to ConditionPhase/GameOver
  // This happens when BOTH proofs are submitted and the round is resolved
  useEffect(() => {
    console.log("[Game] 🔍 Checking round resolution:", {
      hasGame: !!game,
      showRoundResultModal,
      hasSnapshot: !!roundSnapshotRef.current,
      currentGameState,
      currentRound,
      roundResultShownRef: roundResultShownRef.current,
      player1ProofSubmitted,
      player2ProofSubmitted,
      player1ProofValid,
      player2ProofValid,
    });

    if (!game || showRoundResultModal) {
      return;
    }

    // Need snapshot to compare
    if (!roundSnapshotRef.current) {
      console.log("[Game] ⚠️ No snapshot available");
      return;
    }

    const snapshot = roundSnapshotRef.current;
    const snapshotRound = snapshot.round;

    console.log("[Game] 📊 Snapshot data:", {
      snapshotRound,
      currentRound,
      snapshot_player1_score: snapshot.player_1_score,
      snapshot_player2_score: snapshot.player_2_score,
      current_player1_score: game.player_1_score,
      current_player2_score: game.player_2_score,
      player1_proof_valid: snapshot.player_1_proof_valid,
      player2_proof_valid: snapshot.player_2_proof_valid,
    });

    // Check if we've already shown the result for this snapshot round
    if (roundResultShownRef.current === snapshotRound) {
      console.log("[Game] ✅ Already shown result for round", snapshotRound);
      return;
    }

    // KEY: When state changes from ResultPhase to ConditionPhase or GameOver,
    // it means both proofs were submitted and the round was resolved
    const roundWasResolved = 
      (currentGameState === "ConditionPhase" || currentGameState === "GameOver") &&
      snapshotRound < currentRound;

    // Also check if scores/lives changed (in case we're still in ResultPhase but round was resolved)
    const scoresChanged = 
      Number(game.player_1_score) !== snapshot.player_1_score ||
      Number(game.player_2_score) !== snapshot.player_2_score;
    const livesChanged =
      Number(game.player_1_lives) !== snapshot.player_1_lives ||
      Number(game.player_2_lives) !== snapshot.player_2_lives;

    console.log("[Game] 🔎 Resolution checks:", {
      roundWasResolved,
      scoresChanged,
      livesChanged,
      condition: roundWasResolved || scoresChanged || livesChanged,
    });

    if (roundWasResolved || scoresChanged || livesChanged) {
      // Wait for both proof validities to be known
      // If they're not available yet, we'll wait for the next update
      if (snapshot.player_1_proof_valid === null || snapshot.player_2_proof_valid === null) {
        console.log("[Game] ⏳ Waiting for proof validities:", {
          player1_proof_valid: snapshot.player_1_proof_valid,
          player2_proof_valid: snapshot.player_2_proof_valid,
          player1ProofSubmitted,
          player2ProofSubmitted,
        });
        
        // Try to update them if proofs are submitted
        if (player1ProofSubmitted && snapshot.player_1_proof_valid === null) {
          snapshot.player_1_proof_valid = player1ProofValid === true;
        }
        if (player2ProofSubmitted && snapshot.player_2_proof_valid === null) {
          snapshot.player_2_proof_valid = player2ProofValid === true;
        }
        
        // If still null, wait for next update
        if (snapshot.player_1_proof_valid === null || snapshot.player_2_proof_valid === null) {
          console.log("[Game] ⏳ Still waiting for proof validities");
          return;
        }
      }

      console.log("[Game] ✅ Round resolved! Calculating results...");

      // Calculate who lied using snapshot data (before resolution)
      const player1Lied = snapshot.player_1_condition_choice === true && snapshot.player_1_proof_valid === false;
      const player2Lied = snapshot.player_2_condition_choice === true && snapshot.player_2_proof_valid === false;

      // Calculate who believed using snapshot data
      const player1Believed = snapshot.player_1_challenge_choice === true;
      const player2Believed = snapshot.player_2_challenge_choice === true;

      // Calculate changes
      const player1ScoreChange = Number(game.player_1_score) - snapshot.player_1_score;
      const player2ScoreChange = Number(game.player_2_score) - snapshot.player_2_score;
      const player1LivesChange = Number(game.player_1_lives) - snapshot.player_1_lives;
      const player2LivesChange = Number(game.player_2_lives) - snapshot.player_2_lives;

      console.log("[Game] 📈 Results calculated:", {
        player1Lied,
        player2Lied,
        player1Believed,
        player2Believed,
        player1ScoreChange,
        player2ScoreChange,
        player1LivesChange,
        player2LivesChange,
      });

      setRoundResultData({
        player1Lied,
        player2Lied,
        player1Believed,
        player2Believed,
        player1ScoreChange,
        player2ScoreChange,
        player1LivesChange,
        player2LivesChange,
        player1NewScore: Number(game.player_1_score),
        player2NewScore: Number(game.player_2_score),
        player1NewLives: Number(game.player_1_lives),
        player2NewLives: Number(game.player_2_lives),
      });

      setShowRoundResultModal(true);
      roundResultShownRef.current = snapshotRound;
      console.log("[Game] 🎉 Modal should be shown now!");
    }
  }, [
    game,
    player1ProofSubmitted,
    player2ProofSubmitted,
    player1ProofValid,
    player2ProofValid,
    currentRound,
    currentGameState,
    showRoundResultModal,
  ]);

  // Reset snapshot when new round starts (but only after showing the result)
  useEffect(() => {
    // Reset when we enter ConditionPhase and we've already shown the result
    if (currentGameState === "ConditionPhase" && roundResultShownRef.current !== null) {
      // Only reset if we've shown the result and we're in a new round
      if (roundResultShownRef.current < currentRound || !showRoundResultModal) {
        roundSnapshotRef.current = null;
        roundResultShownRef.current = null;
        hasSubmittedProofRef.current = false;
      }
    }
  }, [currentGameState, currentRound, showRoundResultModal]);

  // Get player data
  const gameIdNumber = gameId || (game ? Number(game.id) : 0);
  const hasPlayer2 = game && game.player_2_name && String(game.player_2_name).trim() !== "";
  const player2Name = hasPlayer2 ? String(game.player_2_name) : "";
  const player1Name = game ? String(game.player_1_name || "Player 1") : "Player 1";
  
  // Get final scores and lives for GameOver modal
  const player1Score = game ? Number(game.player_1_score) : 0;
  const player2Score = game ? Number(game.player_2_score) : 0;
  const player1Lives = game ? Number(game.player_1_lives) : 0;
  const player2Lives = game ? Number(game.player_2_lives) : 0;
  
  // Determine winner based on game rules (matching contract logic):
  // - If player_1_lives == 0, player_2 wins
  // - If player_2_lives == 0, player_1 wins
  // - If player_1_score >= 50, player_1 wins
  // - Otherwise, player_2 wins (player_2_score >= 50)
  const isGameOver = currentGameState === "GameOver";
  const isPlayer1Winner = isGameOver && (
    player1Lives === 0 ? false :
    player2Lives === 0 ? true :
    player1Score >= 50 ? true :
    false // player_2_score >= 50
  );
  const winnerName = isGameOver && hasPlayer2 ? (isPlayer1Winner ? player1Name : player2Name) : "";

  const hasSubmittedCondition = game && isPlayer1
    ? Boolean(game.player_1_condition_submitted)
    : game ? Boolean(game.player_2_condition_submitted) : false;

  const hasSubmittedChallenge = game && isPlayer1
    ? Boolean(game.player_1_challenge_submitted)
    : game ? Boolean(game.player_2_challenge_submitted) : false;

  const player1ConditionSubmitted = game ? Boolean(game.player_1_condition_submitted) : false;
  const player1ConditionChoice = game && game.player_1_condition_submitted
    ? (game.player_1_condition_choice === true || String(game.player_1_condition_choice) === "true" || Number(game.player_1_condition_choice) === 1 || String(game.player_1_condition_choice) === "1")
    : null;
  const player2ConditionSubmitted = game ? Boolean(game.player_2_condition_submitted) : false;
  const player2ConditionChoice = game && game.player_2_condition_submitted
    ? (game.player_2_condition_choice === true || String(game.player_2_condition_choice) === "true" || Number(game.player_2_condition_choice) === 1 || String(game.player_2_condition_choice) === "1")
    : null;

  const player1ChallengeSubmitted = game ? Boolean(game.player_1_challenge_submitted) : false;
  const player1ChallengeChoice = game && game.player_1_challenge_submitted
    ? (game.player_1_challenge_choice === true || String(game.player_1_challenge_choice) === "true" || Number(game.player_1_challenge_choice) === 1 || String(game.player_1_challenge_choice) === "1")
    : null;
  const player2ChallengeSubmitted = game ? Boolean(game.player_2_challenge_submitted) : false;
  const player2ChallengeChoice = game && game.player_2_challenge_submitted
    ? (game.player_2_challenge_choice === true || String(game.player_2_challenge_choice) === "true" || Number(game.player_2_challenge_choice) === 1 || String(game.player_2_challenge_choice) === "1")
    : null;

  const currentPhase = currentGameState as "WaitingForHandCommitments" | "ConditionPhase" | "ChallengePhase" | "ResultPhase";

  const handleConditionChoice = async (choice: boolean) => {
    if (!account) return;

    try {
      setProcessingStatus({
        title: "SUBMITTING CONDITION CHOICE",
        explanation: choice
          ? "You are submitting that your hand fulfills the condition. This will be verified later with a zero-knowledge proof."
          : "You are submitting that your hand does not fulfill the condition. The game will proceed to the challenge phase.",
        message: "Preparing transaction (with automatic retry)...",
      });

      // Execute with automatic retry logic
      await retryTransaction(
        async () => {
          const result = await account.execute({
            contractAddress: GAME_CONTRACT_ADDRESS,
            entrypoint: "submit_condition_choice",
            calldata: [
              gameId.toString(),
              choice ? "1" : "0",
            ],
          });

          console.log("[Game] Condition choice tx hash:", result.transaction_hash);

          const receipt = await account.waitForTransaction(result.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          });

          // Verify transaction actually succeeded
          checkTransactionSuccess(receipt);
        },
        {
          maxAttempts: 20,
        }
      );

      setProcessingStatus(null);
      toast.success(`Condition choice submitted: ${choice ? "YES" : "NO"}`);
    } catch (error) {
      console.error("[Game] ❌ Error submitting condition choice:", error);
      setProcessingStatus(null);
      toast.error(`Failed to submit condition choice: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleChallengeChoice = async (choice: boolean) => {
    if (!account) return;

    try {
      setProcessingStatus({
        title: "SUBMITTING CHALLENGE CHOICE",
        explanation: choice
          ? "You are choosing to believe the opponent's claim. If the opponent is telling the truth, the round continues. If the opponent is lying, you may gain an advantage."
          : "You are choosing to challenge the opponent's claim. If the opponent cannot prove the claim with a valid zero-knowledge proof, you will win the round.",
        message: "Preparing transaction (with automatic retry)...",
      });

      // Execute with automatic retry logic
      await retryTransaction(
        async () => {
          const result = await account.execute({
            contractAddress: GAME_CONTRACT_ADDRESS,
            entrypoint: "submit_challenge_choice",
            calldata: [
              gameId.toString(),
              choice ? "1" : "0",
            ],
          });

          console.log("[Game] Challenge choice tx hash:", result.transaction_hash);

          const receipt = await account.waitForTransaction(result.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          });

          // Verify transaction actually succeeded
          checkTransactionSuccess(receipt);
        },
        {
          maxAttempts: 20,
        }
      );

      setProcessingStatus(null);
      toast.success(`Challenge choice submitted: ${choice ? "YES" : "NO"}`);
    } catch (error) {
      console.error("[Game] ❌ Error submitting challenge choice:", error);
      setProcessingStatus(null);
      toast.error(`Failed to submit challenge choice: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRoundResultContinue = useCallback(() => {
    setShowRoundResultModal(false);
    setRoundResultData(null);
    roundSnapshotRef.current = null;
  }, []);

  return (
    <div className="game-screen">
      <div
        className={`game-background ${isHoveringCards ? "blurred" : ""}`}
        style={{
          transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px)`,
        }}
      >
        <img
          src="/images/bar_bg.png"
          alt="Background"
          className="game-background-image"
        />
      </div>

      <GameInfo gameId={gameIdNumber} isPlayer1={isPlayer1} />

      {hasPlayer2 && (
        <OpponentCharacter
          image="/images/joker.png"
          name={player2Name}
          parallaxOffset={parallaxOffset}
          isBlurred={isHoveringCards}
        />
      )}

      <div className={`game-table ${isHoveringCards ? "blurred" : ""}`}>
        <img
          src="/images/table.png"
          alt="Table"
          className="game-table-image"
        />
      </div>

      <img src="/logo.png" alt="LIARS PROOF" className="game-logo" />

      <PlayerHandCards
        cards={playerHand}
        parallaxOffset={parallaxOffset}
        onHoverChange={setIsHoveringCards}
      />

      <GamePhasePanel
        currentPhase={currentPhase}
        opponentName={isPlayer1 ? player2Name : player1Name}
        conditionId={game ? Number(game.condition_id) : 0}
        player1Name={player1Name}
        player2Name={player2Name}
        player1CommitmentSubmitted={player1CommitmentSubmitted}
        player2CommitmentSubmitted={player2CommitmentSubmitted}
        isPlayer1={isPlayer1}
        player1ConditionSubmitted={player1ConditionSubmitted}
        player1ConditionChoice={player1ConditionChoice}
        player2ConditionSubmitted={player2ConditionSubmitted}
        player2ConditionChoice={player2ConditionChoice}
        player1ChallengeSubmitted={player1ChallengeSubmitted}
        player1ChallengeChoice={player1ChallengeChoice}
        player2ChallengeSubmitted={player2ChallengeSubmitted}
        player2ChallengeChoice={player2ChallengeChoice}
        player1ProofSubmitted={player1ProofSubmitted}
        player1ProofValid={player1ProofValid}
        player2ProofSubmitted={player2ProofSubmitted}
        player2ProofValid={player2ProofValid}
        onConditionChoice={handleConditionChoice}
        onChallengeChoice={handleChallengeChoice}
        onSubmitCommitment={handleSubmitCommitment}
        onSubmitProof={handleSubmitProof}
        hasSubmittedCondition={hasSubmittedCondition}
        hasSubmittedChallenge={hasSubmittedChallenge}
        isSubmittingCommitment={isSubmittingCommitment}
        isSubmittingProof={isSubmittingProof}
      />

      <ProcessingModal
        isOpen={processingStatus !== null}
        title={processingStatus?.title || ""}
        message={processingStatus?.message || ""}
        explanation={processingStatus?.explanation}
      />

      {showRoundResultModal && roundResultData && (
        <RoundResultModal
          isOpen={showRoundResultModal}
          player1Name={player1Name}
          player2Name={player2Name}
          player1Lied={roundResultData.player1Lied}
          player2Lied={roundResultData.player2Lied}
          player1Believed={roundResultData.player1Believed}
          player2Believed={roundResultData.player2Believed}
          player1ScoreChange={roundResultData.player1ScoreChange}
          player2ScoreChange={roundResultData.player2ScoreChange}
          player1LivesChange={roundResultData.player1LivesChange}
          player2LivesChange={roundResultData.player2LivesChange}
          player1NewScore={roundResultData.player1NewScore}
          player2NewScore={roundResultData.player2NewScore}
          player1NewLives={roundResultData.player1NewLives}
          player2NewLives={roundResultData.player2NewLives}
          onContinue={handleRoundResultContinue}
        />
      )}

      {isGameOver && hasPlayer2 && (
        <GameOverModal
          isOpen={isGameOver}
          player1Name={player1Name}
          player2Name={player2Name}
          player1Score={player1Score}
          player2Score={player2Score}
          player1Lives={player1Lives}
          player2Lives={player2Lives}
          winnerName={winnerName}
          isPlayer1Winner={isPlayer1Winner}
        />
      )}
    </div>
  );
};
