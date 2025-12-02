import { useParams } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { useGameModels } from "@/hooks/useGameModels";
import { useParallax } from "@/hooks/useParallax";
import { GameInfo } from "@/components/game/GameInfo";
import { GamePhasePanel } from "@/components/game/GamePhasePanel";
import { PlayerCharacter } from "@/components/game/PlayerCharacter";
import { OpponentCharacter } from "@/components/game/OpponentCharacter";
import { GameCards } from "@/components/game/GameCards";
import { useGameExecute } from "@/hooks/examples/useGameExecute";
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

// Mock cards: value (1-13), suit (1=Clubs, 2=Spades, 3=Diamonds, 4=Hearts)
// 9 of Hearts, 8 of Hearts, Ace of Spades
const MOCK_CARDS = [
  { suit: 4, value: 9 }, // 9 of Hearts
  { suit: 4, value: 8 }, // 8 of Hearts
  { suit: 2, value: 1 }, // Ace of Spades
];

export const Game = () => {
  const { game_id } = useParams<{ game_id: string }>();
  const { account } = useAccount();
  const gameId = game_id ? parseInt(game_id) : 0;

  // Parallax effect
  const parallaxOffset = useParallax(20);
  const backgroundOffset = useParallax(10);

  // Subscribe to all game models
  const { game } = useGameModels(gameId);
  
  // TODO: Use these when implementing full game logic
  // const { condition, playerConditionChoice, playerChallengeChoice, roundProof } = useGameModels(gameId);

  // Execute functions
  const { executeSubmitConditionChoice, executeSubmitChallengeChoice } = useGameExecute();

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
    await executeSubmitConditionChoice(gameId, choice);
  };

  const handleChallengeChoice = async (choice: boolean) => {
    if (!account) return;
    await executeSubmitChallengeChoice(gameId, choice);
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
        className="game-background"
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

      {/* Player Character (Badger) */}
      <PlayerCharacter
        image="/images/player_cards.png"
        name={player1Name}
        parallaxOffset={{ x: parallaxOffset.x * 0.8, y: parallaxOffset.y * 0.8 }}
      />

      {/* Opponent Character (Jester) */}
      <OpponentCharacter
        image="/images/joker.png"
        name={player2Name}
        parallaxOffset={parallaxOffset}
      />

      {/* Game Cards */}
      <GameCards cards={MOCK_CARDS} parallaxOffset={parallaxOffset} />

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
