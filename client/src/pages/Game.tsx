import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CallData, cairo } from "starknet";
import type { Call } from "starknet";
import { useStarknetKit } from "@/context/starknetkit";
import { useGameWatcher } from "@/hooks/useGameWatcher";
import { useParallax } from "@/hooks/useParallax";
import { useConditionGraphQL } from "@/hooks/useConditionGraphQL";
import { useRoundProofGraphQL } from "@/hooks/useRoundProofGraphQL";
import { GameInfo } from "@/components/game/GameInfo";
import { GameRules } from "@/components/game/GameRules";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { PlayerHandCards } from "@/components/game/PlayerHandCards";
import { ProcessingModal } from "@/components/login/ProcessingModal";
import { RoundResultModal } from "@/components/game/RoundResultModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { calculateHandCommitment, type Card } from "@/utils/handCommitment";
import {
  generateProofAndCalldata,
  initializeProofSystem,
} from "@/utils/proofGenerator";
import { savePlayerHand, loadPlayerHand } from "@/utils/playerHandStorage";
import type { ProofInput } from "@/types/proof";
import { toast } from "sonner";
import "./Game.css";

const GAME_CONTRACT_ADDRESS =
  import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

type GamePhase =
  | "WaitingForPlayers"
  | "WaitingForHandCommitments"
  | "ConditionPhase"
  | "ChallengePhase"
  | "ResultPhase"
  | "GameOver";

interface RoundResultSnapshot {
  round: number;
  player_1_score: number;
  player_2_score: number;
  player_1_lives: number;
  player_2_lives: number;
  player_1_condition_choice: boolean | null;
  player_2_condition_choice: boolean | null;
  player_1_challenge_choice: boolean | null;
  player_2_challenge_choice: boolean | null;
  player_1_proof_valid: boolean | null;
  player_2_proof_valid: boolean | null;
}

// Helper to get game state variant
const getGameStateVariant = (state: any): GamePhase => {
  if (!state) return "WaitingForHandCommitments";
  if (typeof state === "string") return state as GamePhase;
  if (state.variant) return state.variant as GamePhase;
  if (state.WaitingForPlayers !== undefined) return "WaitingForHandCommitments";
  if (state.WaitingForHandCommitments !== undefined)
    return "WaitingForHandCommitments";
  if (state.ConditionPhase !== undefined) return "ConditionPhase";
  if (state.ChallengePhase !== undefined) return "ChallengePhase";
  if (state.ResultPhase !== undefined) return "ResultPhase";
  if (state.GameOver !== undefined) return "GameOver";
  return "WaitingForHandCommitments";
};

// Helper to parse boolean from game data
const parseBoolean = (value: any): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (String(value) === "true" || String(value) === "1") return true;
  if (String(value) === "false" || String(value) === "0") return false;
  return Number(value) === 1;
};

// Generate random hand
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

  // UI State
  const [isHoveringCards, setIsHoveringCards] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    title: string;
    message: string;
    explanation?: string;
  } | null>(null);

  // Game State
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
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
  const handGeneratedRef = useRef(false);
  const commitmentSubmittedRef = useRef(false);
  const proofSubmittedRef = useRef(false);
  const roundSnapshotRef = useRef<RoundResultSnapshot | null>(null);
  const roundResultShownRef = useRef<number | null>(null);
  const previousPhaseRef = useRef<GamePhase | null>(null);
  const previousRoundRef = useRef<number>(0);
  const lastProofSubmittedRoundRef = useRef<number | null>(null);

  // Watch game state
  const { game } = useGameWatcher(gameId);
  const currentPhase = game ? getGameStateVariant(game.state) : "WaitingForHandCommitments";
  const currentRound = game ? Number(game.round) : 0;
  const isPlayer1 = Boolean(game && account?.address === game.player_1);

  // Fetch condition and proofs
  const conditionId = game ? Number(game.condition_id) : 0;
  const { condition } = useConditionGraphQL(conditionId);
  const {
    player1ProofSubmitted,
    player1ProofValid,
    player2ProofSubmitted,
    player2ProofValid,
  } = useRoundProofGraphQL(
    gameId,
    currentRound,
    game?.player_1,
    game?.player_2,
    currentPhase === "ResultPhase",
  );

  // Initialize proof system
  useEffect(() => {
    initializeProofSystem().catch((error) => {
      console.error("[Game] Failed to initialize proof system:", error);
      toast.error("Failed to initialize proof system");
    });
  }, []);

  // Generate or load player hand
  useEffect(() => {
    if (!gameId || !account?.address || !game || handGeneratedRef.current) {
      return;
    }

    const savedHand = loadPlayerHand(gameId, account.address);
    if (savedHand && savedHand.length === 3) {
      setPlayerHand(savedHand);
      handGeneratedRef.current = true;
      return;
    }

    const gameState = getGameStateVariant(game.state);
    const isPlayer1Local = account.address === game.player_1;
    const isPlayer2Local = account.address === game.player_2;

    if (
      (isPlayer1Local && gameState === "WaitingForPlayers") ||
      (isPlayer2Local && gameState === "WaitingForHandCommitments" && game.player_2)
    ) {
      const newHand = generateRandomHand();
      setPlayerHand(newHand);
      savePlayerHand(gameId, account.address, newHand);
      handGeneratedRef.current = true;
    }
  }, [gameId, account?.address, game]);

  // Reset refs when game/player changes
  useEffect(() => {
    handGeneratedRef.current = false;
    commitmentSubmittedRef.current = false;
    proofSubmittedRef.current = false;
    roundSnapshotRef.current = null;
    roundResultShownRef.current = null;
    previousPhaseRef.current = null;
    previousRoundRef.current = 0;
    lastProofSubmittedRoundRef.current = null;
  }, [gameId, account?.address]);

  // AUTOMATIC: Submit commitment when entering WaitingForHandCommitments
  useEffect(() => {
    if (
      !account ||
      !game ||
      currentPhase !== "WaitingForHandCommitments" ||
      commitmentSubmittedRef.current ||
      playerHand.length !== 3
    ) {
      return;
    }

    const isPlayer1Local = account.address === game.player_1;
    const currentCommitmentSubmitted = isPlayer1Local
      ? Boolean(game.player_1_hand_commitment && game.player_1_hand_commitment !== "0x0" && game.player_1_hand_commitment !== "0")
      : Boolean(game.player_2_hand_commitment && game.player_2_hand_commitment !== "0x0" && game.player_2_hand_commitment !== "0");

    if (currentCommitmentSubmitted) {
      commitmentSubmittedRef.current = true;
      return;
    }

    const submitCommitment = async () => {
      commitmentSubmittedRef.current = true;
      try {
        setProcessingStatus({
          title: "SUBMITTING HAND COMMITMENT",
          explanation: "Committing your hand cards to start the game.",
          message: "Preparing transaction...",
        });

        const commitment = await calculateHandCommitment(playerHand);
        const submitCall: Call = {
          contractAddress: GAME_CONTRACT_ADDRESS,
          entrypoint: "submit_hand_commitment",
          calldata: CallData.compile([gameId, cairo.uint256(commitment)]),
        };

        setProcessingStatus({
          title: "SUBMITTING HAND COMMITMENT",
          message: "Transaction submitted, waiting for confirmation...",
        });

        const result = await account.execute(submitCall);
        await account.waitForTransaction(result.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });

        setProcessingStatus(null);
        toast.success("Hand commitment submitted!");
      } catch (error) {
        console.error("[Game] Error submitting commitment:", error);
        setProcessingStatus(null);
        commitmentSubmittedRef.current = false;
        toast.error("Failed to submit hand commitment");
      }
    };

    submitCommitment();
  }, [account, game, gameId, playerHand, currentPhase]);

  // Capture snapshot when entering ResultPhase (BEFORE round resolution)
  useEffect(() => {
    if (!game || currentPhase !== "ResultPhase") {
      return;
    }

    // Reset proofSubmittedRef when entering a new ResultPhase (new round)
    // This ensures we can submit proof again for the new round
    const snapshotRound = roundSnapshotRef.current?.round || 0;
    if (snapshotRound !== currentRound) {
      console.log("[Game] 🔄 Resetting proofSubmittedRef for new round:", {
        snapshotRound,
        currentRound,
      });
      proofSubmittedRef.current = false;
    }

    // Capture snapshot as soon as we enter ResultPhase (only if we don't have one for this round)
    if (!roundSnapshotRef.current || roundSnapshotRef.current.round !== currentRound) {
      roundSnapshotRef.current = {
        round: currentRound,
        player_1_score: Number(game.player_1_score),
        player_2_score: Number(game.player_2_score),
        player_1_lives: Number(game.player_1_lives),
        player_2_lives: Number(game.player_2_lives),
        player_1_condition_choice: parseBoolean(game.player_1_condition_choice),
        player_2_condition_choice: parseBoolean(game.player_2_condition_choice),
        player_1_challenge_choice: parseBoolean(game.player_1_challenge_choice),
        player_2_challenge_choice: parseBoolean(game.player_2_challenge_choice),
        player_1_proof_valid: null,
        player_2_proof_valid: null,
      };

      console.log("[Game] 📸 Snapshot captured when entering ResultPhase:", {
        round: currentRound,
        player1_score: roundSnapshotRef.current.player_1_score,
        player2_score: roundSnapshotRef.current.player_2_score,
      });
    }
  }, [game, currentPhase, currentRound]);

  // AUTOMATIC: Submit proof when entering ResultPhase
  useEffect(() => {
    if (
      !account ||
      !game ||
      currentPhase !== "ResultPhase" ||
      playerHand.length !== 3 ||
      !condition
    ) {
      return;
    }

    const isPlayer1Local = account.address === game.player_1;
    const currentProofSubmitted = isPlayer1Local
      ? player1ProofSubmitted
      : player2ProofSubmitted;

    // CRITICAL: Reset proofSubmittedRef if we're in a different round
    // This MUST happen before checking if proof is already submitted
    // This ensures we can submit proof for each new round
    if (lastProofSubmittedRoundRef.current !== currentRound) {
      console.log("[Game] 🔄 New round detected, resetting proof submission state:", {
        lastRound: lastProofSubmittedRoundRef.current,
        currentRound,
        currentProofSubmitted, // This may be from previous round, so we reset
      });
      proofSubmittedRef.current = false;
      lastProofSubmittedRoundRef.current = currentRound;
      
      // If we just reset for a new round, don't check currentProofSubmitted yet
      // because it might be stale data from the previous round
      // Instead, proceed to submit (the check will happen in the next render when data is fresh)
      console.log("[Game] 🚀 Round changed, will attempt proof submission for round", currentRound);
    } else {
      // Same round - check if proof already submitted on-chain
      if (currentProofSubmitted) {
        console.log("[Game] ✅ Proof already submitted on-chain for round", currentRound);
        proofSubmittedRef.current = true;
        return;
      }
    }

    // If we've already attempted to submit for this round, don't try again
    if (proofSubmittedRef.current) {
      console.log("[Game] ⏸️ Already attempted to submit proof for round", currentRound);
      return;
    }

    console.log("[Game] 🚀 Starting automatic proof submission for round", currentRound);

    const submitProof = async () => {
      proofSubmittedRef.current = true;

      try {
        setProcessingStatus({
          title: "SUBMITTING PROOF",
          explanation: "Generating zero-knowledge proof to verify your claim.",
          message: "Generating proof...",
        });

        const handCommitment = isPlayer1Local
          ? game.player_1_hand_commitment
          : game.player_2_hand_commitment;

        if (!handCommitment) {
          throw new Error("No hand commitment found");
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
        const proofCalldata =
          result.calldata.length === 0
            ? [gameId.toString(), 0]
            : [
                gameId.toString(),
                ...result.calldata.map((item) =>
                  typeof item === "bigint" ? item.toString() : String(item),
                ),
              ];

        setProcessingStatus({
          title: "SUBMITTING PROOF",
          message: "Transaction submitted, waiting for confirmation...",
        });

        const txResult = await account.execute({
          contractAddress: GAME_CONTRACT_ADDRESS,
          entrypoint: "submit_round_proof",
          calldata: proofCalldata,
        });

        await account.waitForTransaction(txResult.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });

        setProcessingStatus(null);
        toast.success("Proof submitted successfully!");
      } catch (error) {
        console.error("[Game] Error submitting proof:", error);
        setProcessingStatus(null);
        proofSubmittedRef.current = false;
        toast.error("Failed to submit proof");
      }
    };

    submitProof();
  }, [
    account,
    game,
    gameId,
    playerHand,
    condition,
    currentPhase,
    currentRound,
    player1ProofSubmitted,
    player2ProofSubmitted,
    // Note: lastProofSubmittedRoundRef and proofSubmittedRef are refs, so they don't need to be in deps
  ]);

  // Update snapshot with proof validities as they become available
  useEffect(() => {
    if (!roundSnapshotRef.current) return;

    if (player1ProofSubmitted && roundSnapshotRef.current.player_1_proof_valid === null) {
      roundSnapshotRef.current.player_1_proof_valid = player1ProofValid === true;
    }
    if (player2ProofSubmitted && roundSnapshotRef.current.player_2_proof_valid === null) {
      roundSnapshotRef.current.player_2_proof_valid = player2ProofValid === true;
    }
  }, [player1ProofSubmitted, player1ProofValid, player2ProofSubmitted, player2ProofValid]);

  // TRIGGER: Show RoundResultModal when we're in ConditionPhase and have a snapshot from the previous round
  // This happens when the round is resolved and we move to the next round
  // Works for both players independently - doesn't depend on previousPhaseRef timing
  useEffect(() => {
    if (!game) return;

    // We're in ConditionPhase (new round started after ResultPhase)
    const isConditionPhase = currentPhase === "ConditionPhase";
    const snapshot = roundSnapshotRef.current;
    const hasSnapshot = snapshot !== null;
    
    if (!isConditionPhase || !hasSnapshot || showRoundResultModal) {
      // Update previous phase ref even if we don't show modal
      previousPhaseRef.current = currentPhase;
      return;
    }

    // At this point, snapshot is guaranteed to be non-null
    const snapshotRound = snapshot.round;
    
    // The snapshot should be from the previous round (round was resolved and advanced)
    // Or from the current round if we just entered ResultPhase
    const roundMatches = snapshotRound === currentRound - 1 || snapshotRound === currentRound;

    if (!roundMatches) {
      console.log("[Game] ⏸️ Snapshot round doesn't match:", {
        snapshotRound,
        currentRound,
      });
      previousPhaseRef.current = currentPhase;
      return;
    }

    // Wait for both proof validities to be available
    if (
      snapshot.player_1_proof_valid === null ||
      snapshot.player_2_proof_valid === null
    ) {
      console.log("[Game] ⏳ Waiting for proof validities before showing result modal:", {
        player1: snapshot.player_1_proof_valid,
        player2: snapshot.player_2_proof_valid,
      });
      previousPhaseRef.current = currentPhase;
      return;
    }

    // Check if we've already shown the result for this round
    if (roundResultShownRef.current === snapshotRound) {
      console.log("[Game] ✅ Already shown result for round", snapshotRound);
      previousPhaseRef.current = currentPhase;
      return;
    }

    console.log("[Game] 🎯 Showing RoundResultModal - ConditionPhase with valid snapshot:", {
      snapshotRound,
      currentRound,
      player1ProofValid: snapshot.player_1_proof_valid,
      player2ProofValid: snapshot.player_2_proof_valid,
    });

    // Calculate results based on snapshot (state before resolution)
    const player1Lied =
      snapshot.player_1_condition_choice !== snapshot.player_1_proof_valid;
    const player2Lied =
      snapshot.player_2_condition_choice !== snapshot.player_2_proof_valid;
    const player1Believed = snapshot.player_1_challenge_choice === true;
    const player2Believed = snapshot.player_2_challenge_choice === true;

    // Calculate changes by comparing snapshot (before) with current state (after)
    setRoundResultData({
      player1Lied,
      player2Lied,
      player1Believed,
      player2Believed,
      player1ScoreChange: Number(game.player_1_score) - snapshot.player_1_score,
      player2ScoreChange: Number(game.player_2_score) - snapshot.player_2_score,
      player1LivesChange: Number(game.player_1_lives) - snapshot.player_1_lives,
      player2LivesChange: Number(game.player_2_lives) - snapshot.player_2_lives,
      player1NewScore: Number(game.player_1_score),
      player2NewScore: Number(game.player_2_score),
      player1NewLives: Number(game.player_1_lives),
      player2NewLives: Number(game.player_2_lives),
    });

    setShowRoundResultModal(true);
    roundResultShownRef.current = snapshotRound;

    // Update previous phase ref
    previousPhaseRef.current = currentPhase;
  }, [
    game,
    currentPhase,
    currentRound,
    showRoundResultModal,
    player1ProofSubmitted,
    player1ProofValid,
    player2ProofSubmitted,
    player2ProofValid,
  ]);

  // Reset snapshot when modal is closed and we're in ConditionPhase (new round started)
  useEffect(() => {
    if (
      currentPhase === "ConditionPhase" &&
      !showRoundResultModal &&
      roundResultShownRef.current !== null
    ) {
      // Reset for next round - the round has advanced
      if (roundResultShownRef.current < currentRound) {
        console.log("[Game] 🔄 Resetting snapshot and refs for new round:", {
          shownRound: roundResultShownRef.current,
          currentRound,
        });
        roundSnapshotRef.current = null;
        roundResultShownRef.current = null;
        proofSubmittedRef.current = false;
        commitmentSubmittedRef.current = false;
        lastProofSubmittedRoundRef.current = null;
        previousPhaseRef.current = currentPhase;
      }
    }
  }, [currentPhase, currentRound, showRoundResultModal]);

  // Manual handlers for Condition and Challenge phases
  const handleConditionChoice = useCallback(
    async (choice: boolean) => {
      if (!account || !game) return;

      try {
        setProcessingStatus({
          title: "SUBMITTING CONDITION CHOICE",
          explanation: choice
            ? "You claim your hand fulfills the condition."
            : "You claim your hand does not fulfill the condition.",
          message: "Preparing transaction...",
        });

        const result = await account.execute({
          contractAddress: GAME_CONTRACT_ADDRESS,
          entrypoint: "submit_condition_choice",
          calldata: [gameId.toString(), choice ? "1" : "0"],
        });

        await account.waitForTransaction(result.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });

        setProcessingStatus(null);
        toast.success(`Condition choice submitted: ${choice ? "YES" : "NO"}`);
      } catch (error) {
        console.error("[Game] Error submitting condition choice:", error);
        setProcessingStatus(null);
        toast.error("Failed to submit condition choice");
      }
    },
    [account, game, gameId],
  );

  const handleChallengeChoice = useCallback(
    async (choice: boolean) => {
      if (!account || !game) return;

      try {
        setProcessingStatus({
          title: "SUBMITTING CHALLENGE CHOICE",
          explanation: choice
            ? "You choose to believe the opponent's claim."
            : "You choose to challenge the opponent's claim.",
          message: "Preparing transaction...",
        });

        const result = await account.execute({
          contractAddress: GAME_CONTRACT_ADDRESS,
          entrypoint: "submit_challenge_choice",
          calldata: [gameId.toString(), choice ? "1" : "0"],
        });

        await account.waitForTransaction(result.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });

        setProcessingStatus(null);
        toast.success(`Challenge choice submitted: ${choice ? "YES" : "NO"}`);
      } catch (error) {
        console.error("[Game] Error submitting challenge choice:", error);
        setProcessingStatus(null);
        toast.error("Failed to submit challenge choice");
      }
    },
    [account, game, gameId],
  );

  const handleRoundResultContinue = useCallback(() => {
    console.log("[Game] 🔄 Closing RoundResultModal and resetting for next round");
    setShowRoundResultModal(false);
    setRoundResultData(null);
    // Note: Refs will be reset when entering new ResultPhase or ConditionPhase
  }, []);

  // Extract game data
  const gameIdNumber = gameId || (game ? Number(game.id) : 0);
  const hasPlayer2 = game && game.player_2_name && String(game.player_2_name).trim() !== "";
  const player1Name = game ? String(game.player_1_name || "Player 1") : "Player 1";
  const player2Name = hasPlayer2 ? String(game.player_2_name) : "";

  const player1CommitmentSubmitted = game
    ? Boolean(
        game.player_1_hand_commitment &&
          game.player_1_hand_commitment !== "0x0" &&
          game.player_1_hand_commitment !== "0",
      )
    : false;
  const player2CommitmentSubmitted = game
    ? Boolean(
        game.player_2_hand_commitment &&
          game.player_2_hand_commitment !== "0x0" &&
          game.player_2_hand_commitment !== "0",
      )
    : false;

  const hasSubmittedCondition = game && isPlayer1
    ? Boolean(game.player_1_condition_submitted)
    : game
      ? Boolean(game.player_2_condition_submitted)
      : false;

  const hasSubmittedChallenge = game && isPlayer1
    ? Boolean(game.player_1_challenge_submitted)
    : game
      ? Boolean(game.player_2_challenge_submitted)
      : false;

  const player1ConditionChoice = game && game.player_1_condition_submitted
    ? parseBoolean(game.player_1_condition_choice)
    : null;
  const player2ConditionChoice = game && game.player_2_condition_submitted
    ? parseBoolean(game.player_2_condition_choice)
    : null;
  const player1ChallengeChoice = game && game.player_1_challenge_submitted
    ? parseBoolean(game.player_1_challenge_choice)
    : null;
  const player2ChallengeChoice = game && game.player_2_challenge_submitted
    ? parseBoolean(game.player_2_challenge_choice)
    : null;

  // Game over logic
  const isGameOver = currentPhase === "GameOver";
  const player1Score = game ? Number(game.player_1_score) : 0;
  const player2Score = game ? Number(game.player_2_score) : 0;
  const player1Lives = game ? Number(game.player_1_lives) : 0;
  const player2Lives = game ? Number(game.player_2_lives) : 0;
  const isPlayer1Winner =
    isGameOver &&
    (player1Lives === 0
      ? false
      : player2Lives === 0
        ? true
        : player1Score >= 50);
  const winnerName = isGameOver && hasPlayer2
    ? isPlayer1Winner
      ? player1Name
      : player2Name
    : "";

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

      <div className="game-info-container">
        <GameInfo gameId={gameIdNumber} isPlayer1={isPlayer1} />
        <GameRules onExpandChange={setIsRulesExpanded} />
      </div>

      {hasPlayer2 && (
        <OpponentCharacter
          image="/images/joker.png"
          name={player2Name}
          parallaxOffset={parallaxOffset}
          isBlurred={isHoveringCards}
        />
      )}

      <div className={`game-table ${isHoveringCards ? "blurred" : ""}`}>
        <img src="/images/table.png" alt="Table" className="game-table-image" />
      </div>

      <img
        src="/logo.png"
        alt="LIARS PROOF"
        className={`game-logo ${isRulesExpanded ? "hidden" : ""}`}
      />

      <PlayerHandCards
        cards={playerHand}
        parallaxOffset={parallaxOffset}
        onHoverChange={setIsHoveringCards}
      />

      <GamePhasePanel
        currentPhase={currentPhase === "GameOver" ? "ResultPhase" : currentPhase === "WaitingForPlayers" ? "WaitingForHandCommitments" : currentPhase}
        opponentName={isPlayer1 ? player2Name : player1Name}
        conditionId={conditionId}
        player1Name={player1Name}
        player2Name={player2Name}
        player1CommitmentSubmitted={player1CommitmentSubmitted}
        player2CommitmentSubmitted={player2CommitmentSubmitted}
        isPlayer1={isPlayer1}
        player1ConditionSubmitted={Boolean(game?.player_1_condition_submitted)}
        player1ConditionChoice={player1ConditionChoice}
        player2ConditionSubmitted={Boolean(game?.player_2_condition_submitted)}
        player2ConditionChoice={player2ConditionChoice}
        player1ChallengeSubmitted={Boolean(game?.player_1_challenge_submitted)}
        player1ChallengeChoice={player1ChallengeChoice}
        player2ChallengeSubmitted={Boolean(game?.player_2_challenge_submitted)}
        player2ChallengeChoice={player2ChallengeChoice}
        player1ProofSubmitted={player1ProofSubmitted}
        player1ProofValid={player1ProofValid}
        player2ProofSubmitted={player2ProofSubmitted}
        player2ProofValid={player2ProofValid}
        onConditionChoice={handleConditionChoice}
        onChallengeChoice={handleChallengeChoice}
        onSubmitCommitment={() => {}}
        onSubmitProof={() => {}}
        hasSubmittedCondition={hasSubmittedCondition}
        hasSubmittedChallenge={hasSubmittedChallenge}
        isSubmittingCommitment={false}
        isSubmittingProof={false}
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
