import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useStarknetKit } from "@/context/starknetkit";
import { useGameWatcher } from "@/hooks/useGameWatcher";
import { useParallax } from "@/hooks/useParallax";
import { GameInfo } from "@/components/game/GameInfo";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { PlayerHandCards } from "@/components/game/PlayerHandCards";
import { ProcessingModal } from "@/components/login/ProcessingModal";
import { calculateHandCommitment, handCommitmentToHex, type Card } from "@/utils/handCommitment";
import { generateProofAndCalldata, initializeProofSystem } from "@/utils/proofGenerator";
import type { ProofInput } from "@/types/proof";
import { toast } from "sonner";
// import { useGameExecute } from "@/hooks/examples/useGameExecute"; // Temporarily commented - uncomment after browser refresh
import "./Game.css";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

/**
 * Generate a random hand of 3 cards
 * Values: 1 (Ace) - 13 (King)
 * Suits: 1 (Clubs), 2 (Spades), 3 (Diamonds), 4 (Hearts)
 */
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

  // Parallax effect
  const parallaxOffset = useParallax(20);
  const backgroundOffset = useParallax(10);

  // State for blur effect when hovering over player cards
  const [isHoveringCards, setIsHoveringCards] = useState(false);

  // State for player's hand - generated randomly when game is created
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [isSubmittingCommitment, setIsSubmittingCommitment] = useState(false);
  const [hasSubmittedCommitment, setHasSubmittedCommitment] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const hasSubmittedProofRef = useRef(false);

  // Watch game state with GraphQL polling (every 2 seconds)
  const { game } = useGameWatcher(gameId, (updatedGame) => {
    console.log("🎮 Game updated in Game page:", updatedGame);
  });

  console.log("game", game);

  // Helper to get game state variant (needed before useEffect)
  const getGameStateVariant = (state: any): string => {
    if (!state) return "CommitmentPhase";
    if (typeof state === "string") return state;
    if (state.variant) return state.variant;
    // Handle CairoCustomEnum
    if (state.WaitingForPlayers !== undefined) return "WaitingForPlayers";
    if (state.WaitingForHandCommitments !== undefined) return "CommitmentPhase";
    if (state.ConditionPhase !== undefined) return "ConditionPhase";
    if (state.ChallengePhase !== undefined) return "ChallengePhase";
    if (state.ResultPhase !== undefined) return "ResultPhase";
    if (state.GameOver !== undefined) return "GameOver";
    return "CommitmentPhase";
  };

  // Determine if current player is player_1 or player_2 (needed before useEffect)
  const isPlayer1 = game && account?.address === game.player_1 ? true : false;

  // Check commitment status (needed before useEffect)
  const player1CommitmentSubmitted = game ? Boolean(game.player_1_hand_commitment && game.player_1_hand_commitment !== "0x0" && game.player_1_hand_commitment !== "0") : false;
  const player2CommitmentSubmitted = game ? Boolean(game.player_2_hand_commitment && game.player_2_hand_commitment !== "0x0" && game.player_2_hand_commitment !== "0") : false;


  // Initialize proof system on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[Game] 🔧 Initializing proof system...");
        await initializeProofSystem();
        console.log("[Game] ✅ Proof system initialized successfully");
      } catch (error) {
        console.error("[Game] ❌ Failed to initialize proof system:", error);
        toast.error("Failed to initialize proof system");
      }
    };

    initialize();
  }, []);

  // Generate random hand when game is loaded for the first time
  useEffect(() => {
    if (gameId > 0 && playerHand.length === 0) {
      const newHand = generateRandomHand();
      setPlayerHand(newHand);
      console.log("[Game] 🃏 Generated random hand:", newHand);
    }
  }, [gameId, playerHand.length]);

  // Submit hand commitment after generating hand
  useEffect(() => {
    const submitHandCommitment = async () => {
      if (!account || !game || hasSubmittedCommitment || isSubmittingCommitment || playerHand.length !== 3) {
        return;
      }

      // Check if current player already submitted commitment
      const currentPlayerCommitmentSubmitted = isPlayer1 ? player1CommitmentSubmitted : player2CommitmentSubmitted;
      if (currentPlayerCommitmentSubmitted) {
        setHasSubmittedCommitment(true);
        return;
      }

      // Only submit if we're in CommitmentPhase state
      const gameState = getGameStateVariant(game.state);
      if (gameState !== "CommitmentPhase") {
        return;
      }

      setIsSubmittingCommitment(true);
      try {
        console.log("[Game] 🔐 Calculating hand commitment...");
        const commitment = await calculateHandCommitment(playerHand);
        const commitmentHex = handCommitmentToHex(commitment);

        console.log("[Game] 📤 Submitting hand commitment to contract:", {
          gameId,
          commitment: commitment.toString(),
          commitmentHex,
          hand: playerHand,
        });

        // Split the u256 commitment into two u128 values (low, high)
        const low = commitment & ((BigInt(1) << BigInt(128)) - BigInt(1));
        const high = commitment >> BigInt(128);

        setProcessingStatus({
          title: "SUBMITTING HAND COMMITMENT",
          message: "Please sign the transaction in your wallet",
        });

        const result = await account.execute({
          contractAddress: GAME_CONTRACT_ADDRESS,
          entrypoint: "submit_hand_commitment",
          calldata: [
            gameId.toString(), // game_id: u32
            low.toString(), // hand_commitment low part
            high.toString(), // hand_commitment high part
          ],
        });

        console.log("[Game] Transaction hash:", result.transaction_hash);

        setProcessingStatus({
          title: "SUBMITTING HAND COMMITMENT",
          message: "Transaction submitted, waiting for confirmation...",
        });

        // Wait for transaction
        const receipt = await account.waitForTransaction(result.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
        });

        console.log("[Game] ✅ Hand commitment submitted successfully!", receipt);
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
    };

    submitHandCommitment();
  }, [account, game, gameId, playerHand, hasSubmittedCommitment, isSubmittingCommitment, isPlayer1, player1CommitmentSubmitted, player2CommitmentSubmitted]);


  // Generate and submit proof when entering ResultPhase
  useEffect(() => {
    const generateAndSubmitProof = async () => {
      if (!account || !game || isSubmittingProof || hasSubmittedProofRef.current || playerHand.length !== 3) {
        return;
      }

      const gameState = getGameStateVariant(game.state);
      if (gameState !== "ResultPhase") {
        return;
      }

      // Check if we're player 1 or player 2
      const isPlayer1 = account.address === game.player_1;
      const handCommitment = isPlayer1 ? game.player_1_hand_commitment : game.player_2_hand_commitment;

      if (!handCommitment) {
        console.error("[Game] No hand commitment found");
        return;
      }

      setIsSubmittingProof(true);
      hasSubmittedProofRef.current = true;

      try {
        console.log("[Game] 🔐 Generating ZK proof for ResultPhase...");

        // Prepare proof input - HARDCODED condition for now
        const proofInput: ProofInput = {
          _game_id: gameId.toString(),
          hand_commitment: `0x${BigInt(handCommitment).toString(16)}`,
          condition_id: "1",
          // HARDCODED: comparator = 2 (GREATER_THAN), value = 3, suit = 0
          comparator: "3",
          value: "3",
          suit: "0",
          hand: {
            card1_suit: playerHand[0].suit.toString(),
            card1_value: playerHand[0].value.toString(),
            card2_suit: playerHand[1].suit.toString(),
            card2_value: playerHand[1].value.toString(),
            card3_suit: playerHand[2].suit.toString(),
            card3_value: playerHand[2].value.toString(),
          },
        };
          // condition_id: game.condition_id?.toString() || "1", TODO:

        // card1_suit: playerHand[0].suit.toString(),
        //     card1_value: playerHand[0].value.toString(),
        //     card2_suit: playerHand[1].suit.toString(),
        //     card2_value: playerHand[1].value.toString(),
        //     card3_suit: playerHand[2].suit.toString(),
        //     card3_value: playerHand[2].value.toString(),

        console.log("[Game] Proof input:", proofInput);

        // Generate proof
        const result = await generateProofAndCalldata(proofInput);
        console.log("[Game] ✅ Proof generated! Calldata length:", result.calldata.length);
        console.log("[Game] Proof generated! Calldata:", result.calldata);

        // Submit proof to contract
        console.log("[Game] 📤 Submitting proof to contract...");


        if (result.calldata.length === 0) {
          console.log("[Game] No calldata generated");
          const txResult = await account.execute({
            contractAddress: GAME_CONTRACT_ADDRESS,
            entrypoint: "submit_round_proof",
            calldata: [
              gameId.toString(), // game_id: u32
              0, // proof calldata
            ],
          });

          console.log("[Game] Transaction hash:", txResult.transaction_hash);

          // Wait for transaction
          const receipt = await account.waitForTransaction(txResult.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
          });

          console.log("[Game] ✅ Proof submitted successfully!", receipt);
          toast.success("Proof submitted successfully!");
        } else {
          // Convert calldata to strings (remove first element as per documentation)
          const proofCalldata = result.calldata.slice(1).map(item =>
            typeof item === 'bigint' ? item.toString() : String(item)
          );

          const txResult = await account.execute({
            contractAddress: GAME_CONTRACT_ADDRESS,
            entrypoint: "submit_round_proof",
            calldata: [
              gameId.toString(), // game_id: u32
              ...proofCalldata, // proof calldata
            ],
          });

          console.log("[Game] Transaction hash:", txResult.transaction_hash);

          // Wait for transaction
          const receipt = await account.waitForTransaction(txResult.transaction_hash, {
            retryInterval: 100,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
          });

          console.log("[Game] ✅ Proof submitted successfully!", receipt);
          toast.success("Proof submitted successfully!");
        }

      } catch (error) {
        console.error("[Game] ❌ Error generating/submitting proof:", error);
        toast.error(`Failed to submit proof: ${error instanceof Error ? error.message : String(error)}`);
        hasSubmittedProofRef.current = false; // Allow retry on error
      } finally {
        setIsSubmittingProof(false);
      }
    };

    generateAndSubmitProof();
  }, [account, game, gameId, playerHand, isSubmittingProof]);

  // TODO: Use these when implementing full game logic
  // const { condition, playerConditionChoice, playerChallengeChoice, roundProof } = useGameModels(gameId);

  // Execute functions
  // TEMPORARILY COMMENTED TO FIX HOOK ORDER ERROR - REFRESH BROWSER TO FIX
  // const { executeSubmitConditionChoice, executeSubmitChallengeChoice } = useGameExecute();

  // Use real game data
  const currentPhase = game ? getGameStateVariant(game.state) as "CommitmentPhase" | "ConditionPhase" | "ChallengePhase" | "ResultPhase" : "CommitmentPhase";
  const gameIdNumber = gameId || (game ? Number(game.id) : 0);
  // Only show player 2 name if they have joined
  const hasPlayer2 = game && game.player_2_name && String(game.player_2_name).trim() !== "";
  const player2Name = hasPlayer2 ? String(game.player_2_name) : "";

  // Check if current player has submitted their choices (only if game data is available)
  const hasSubmittedCondition = game && isPlayer1
    ? Boolean(game.player_1_condition_submitted)
    : game ? Boolean(game.player_2_condition_submitted) : false;

  const hasSubmittedChallenge = game && isPlayer1
    ? Boolean(game.player_1_challenge_submitted)
    : game ? Boolean(game.player_2_challenge_submitted) : false;

  // Get player names
  const player1Name = game ? String(game.player_1_name || "Player 1") : "Player 1";

  const handleConditionChoice = async (choice: boolean) => {
    if (!account) return;

    try {
      console.log("[Game] 📤 Submitting condition choice:", { gameId, choice });

      setProcessingStatus({
        title: "SUBMITTING CONDITION CHOICE",
        message: "Please sign the transaction in your wallet",
      });

      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "submit_condition_choice",
        calldata: [
          gameId.toString(), // game_id: u32
          choice ? "1" : "0", // player_choice: bool (1 = true, 0 = false)
        ],
      });

      console.log("[Game] Transaction hash:", result.transaction_hash);

      setProcessingStatus({
        title: "SUBMITTING CONDITION CHOICE",
        message: "Transaction submitted, waiting for confirmation...",
      });

      // Wait for transaction
      const receipt = await account.waitForTransaction(result.transaction_hash, {
        retryInterval: 100,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
      });

      console.log("[Game] ✅ Condition choice submitted successfully!", receipt);
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
      console.log("[Game] 📤 Submitting challenge choice:", { gameId, choice });

      setProcessingStatus({
        title: "SUBMITTING CHALLENGE CHOICE",
        message: "Please sign the transaction in your wallet",
      });

      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "submit_challenge_choice",
        calldata: [
          gameId.toString(), // game_id: u32
          choice ? "1" : "0", // player_choice: bool (1 = true, 0 = false)
        ],
      });

      console.log("[Game] Transaction hash:", result.transaction_hash);

      setProcessingStatus({
        title: "SUBMITTING CHALLENGE CHOICE",
        message: "Transaction submitted, waiting for confirmation...",
      });

      // Wait for transaction
      const receipt = await account.waitForTransaction(result.transaction_hash, {
        retryInterval: 100,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
      });

      console.log("[Game] ✅ Challenge choice submitted successfully!", receipt);
      setProcessingStatus(null);
      toast.success(`Challenge choice submitted: ${choice ? "YES" : "NO"}`);
    } catch (error) {
      console.error("[Game] ❌ Error submitting challenge choice:", error);
      setProcessingStatus(null);
      toast.error(`Failed to submit challenge choice: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // if (!account) {
  //   return (
  //     <div className="game-wallet-message">
  //       <div className="game-wallet-message-text">PLEASE CONNECT YOUR WALLET</div>
  //     </div>
  //   );
  // }

  return (
    <div className="game-screen">
      {/* Background with parallax */}
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

      {/* Game Info Panel */}
      <GameInfo gameId={gameIdNumber} />

      {/* Opponent Character (Jester) - includes cards in the image */}
      <OpponentCharacter
        image="/images/joker.png"
        name={player2Name}
        parallaxOffset={parallaxOffset}
        isBlurred={isHoveringCards}
      />

      {/* Table */}
      <div className={`game-table ${isHoveringCards ? "blurred" : ""}`}>
        <img
          src="/images/table.png"
          alt="Table"
          className="game-table-image"
        />
      </div>

      <img src="/logo.png" alt="LIARS PROOF" className="game-logo" />

      {/* Player Hand Cards - 3 random cards */}
      <PlayerHandCards
        cards={playerHand}
        parallaxOffset={parallaxOffset}
        onHoverChange={setIsHoveringCards}
      />

      {/* Game Phase Panel */}
      <GamePhasePanel
        currentPhase={currentPhase}
        opponentName={player2Name}
        conditionId={game ? Number(game.condition_id) : 0}
        player1Name={player1Name}
        player2Name={player2Name}
        player1CommitmentSubmitted={player1CommitmentSubmitted}
        player2CommitmentSubmitted={player2CommitmentSubmitted}
        isPlayer1={isPlayer1}
        onConditionChoice={handleConditionChoice}
        onChallengeChoice={handleChallengeChoice}
        hasSubmittedCondition={hasSubmittedCondition}
        hasSubmittedChallenge={hasSubmittedChallenge}
      />

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={processingStatus !== null}
        title={processingStatus?.title || ""}
        message={processingStatus?.message || ""}
      />
    </div>
  );
};
