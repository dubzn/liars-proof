import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStarknetKit } from "@/context/starknetkit";
import { useGameWatcher } from "@/hooks/useGameWatcher";
import { useParallax } from "@/hooks/useParallax";
import { GameInfo } from "@/components/game/GameInfo";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { PlayerHandCards } from "@/components/game/PlayerHandCards";
import { calculateHandCommitment, handCommitmentToHex, type Card } from "@/utils/handCommitment";
import { toast } from "sonner";
// import { useGameExecute } from "@/hooks/examples/useGameExecute"; // Temporarily commented - uncomment after browser refresh
import "./Game.css";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

// Mock data for now
const MOCK_GAME = {
  id: 45,
  player_1_name: "dubctio",
  player_1_score: 20,
  player_1_lives: 3,
  player_2_name: "piloso",
  player_2_score: 30,
  player_2_lives: 2,
  state: "ChallengePhase" as const,
  round: 1,
};

/**
 * Generate a random hand of 3 cards
 * Values: 1 (Ace) - 13 (King)
 * Suits: 1 (Clubs), 2 (Spades), 3 (Diamonds), 4 (Hearts)
 */
const generateRandomHand = (): Card[] => {
  const hand: Card[] = [];
  const usedCards = new Set<string>();

  while (hand.length < 3) {
    // Random value: 1-13 (A, 2-10, J, Q, K)
    const value = Math.floor(Math.random() * 13) + 1;
    // Random suit: 1-4 (Clubs, Spades, Diamonds, Hearts)
    const suit = Math.floor(Math.random() * 4) + 1;

    // Create unique key to avoid duplicate cards
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

  // Watch game state with GraphQL polling (every 2 seconds)
  const { game, isLoading } = useGameWatcher(gameId, (updatedGame) => {
    console.log("🎮 Game updated in Game page:", updatedGame);
  });

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

      // Only submit if we're in WaitingForHandCommitments state
      const gameState = getGameStateVariant(game.state);
      if (gameState !== "WaitingForHandCommitments") {
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

        // Wait for transaction
        const receipt = await account.waitForTransaction(result.transaction_hash, {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
        });

        console.log("[Game] ✅ Hand commitment submitted successfully!", receipt);
        toast.success("Hand commitment submitted!");
        setHasSubmittedCommitment(true);
      } catch (error) {
        console.error("[Game] ❌ Error submitting hand commitment:", error);
        toast.error(`Failed to submit hand commitment: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsSubmittingCommitment(false);
      }
    };

    submitHandCommitment();
  }, [account, game, gameId, playerHand, hasSubmittedCommitment, isSubmittingCommitment]);

  // TODO: Use these when implementing full game logic
  // const { condition, playerConditionChoice, playerChallengeChoice, roundProof } = useGameModels(gameId);

  // Execute functions
  // TEMPORARILY COMMENTED TO FIX HOOK ORDER ERROR - REFRESH BROWSER TO FIX
  // const { executeSubmitConditionChoice, executeSubmitChallengeChoice } = useGameExecute();

  // Helper to get game state variant
  const getGameStateVariant = (state: any): string => {
    if (!state) return "ChallengePhase";
    if (typeof state === "string") return state;
    if (state.variant) return state.variant;
    // Handle CairoCustomEnum
    if (state.WaitingForPlayers !== undefined) return "WaitingForPlayers";
    if (state.WaitingForHandCommitments !== undefined) return "WaitingForHandCommitments";
    if (state.ConditionPhase !== undefined) return "ConditionPhase";
    if (state.ChallengePhase !== undefined) return "ChallengePhase";
    if (state.ResultPhase !== undefined) return "ResultPhase";
    if (state.GameOver !== undefined) return "GameOver";
    return "ChallengePhase";
  };

  // Use mock data for now, fallback to real data when available
  const currentGame = game || MOCK_GAME;
  const currentPhase = getGameStateVariant(currentGame.state) as "ConditionPhase" | "ChallengePhase" | "ResultPhase";
  const gameIdNumber = gameId || Number(currentGame.id) || MOCK_GAME.id;
  const player1Name = String(currentGame.player_1_name || MOCK_GAME.player_1_name);
  const player2Name = String(currentGame.player_2_name || MOCK_GAME.player_2_name);
  const player1Score = Number(currentGame.player_1_score) || MOCK_GAME.player_1_score;
  const player2Score = Number(currentGame.player_2_score) || MOCK_GAME.player_2_score;
  const player1Lives = Number(currentGame.player_1_lives) || MOCK_GAME.player_1_lives;
  const player2Lives = Number(currentGame.player_2_lives) || MOCK_GAME.player_2_lives;

  const handleConditionChoice = async (choice: boolean) => {
    if (!account) return;
    console.log("Condition choice:", choice);
    // TODO: Re-enable after browser refresh
    // await executeSubmitConditionChoice(gameId, choice);
  };

  const handleChallengeChoice = async (choice: boolean) => {
    if (!account) return;
    console.log("Challenge choice:", choice);
    // TODO: Re-enable after browser refresh
    // await executeSubmitChallengeChoice(gameId, choice);
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
          src="/images/liars_bg.png"
          alt="Background"
          className="game-background-image"
        />
      </div>

      {/* Game Info Panel */}
      <GameInfo
        gameId={gameIdNumber}
        player1Name={player1Name}
        player1Score={player1Score}
        player1Lives={player1Lives}
        player2Name={player2Name}
        player2Score={player2Score}
        player2Lives={player2Lives}
      />

      {/* Opponent Character (Jester) - includes cards in the image */}
      <OpponentCharacter
        image="/images/joker.png"
        name={player2Name}
        parallaxOffset={parallaxOffset}
        isBlurred={isHoveringCards}
      />

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
        onConditionChoice={handleConditionChoice}
        onChallengeChoice={handleChallengeChoice}
      />
    </div>
  );
};
