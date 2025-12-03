import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStarknetKit } from "@/context/starknetkit";
import { useGameWatcher } from "@/hooks/useGameWatcher";
import { useParallax } from "@/hooks/useParallax";
import { GameInfo } from "@/components/game/GameInfo";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { PlayerHandCards } from "@/components/game/PlayerHandCards";
// import { useGameExecute } from "@/hooks/examples/useGameExecute"; // Temporarily commented - uncomment after browser refresh
import "./Game.css";

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

// Card type
type Card = {
  suit: number;
  value: number;
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
