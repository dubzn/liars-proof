import { useGameGraphQL } from "@/hooks/useGameGraphQL";
import { useStarknetKit } from "@/context/starknetkit";
import "./GameInfo.css";

interface GameInfoProps {
  gameId: number;
  isPlayer1: boolean;
}

export const GameInfo = ({ gameId, isPlayer1 }: GameInfoProps) => {
  const { account } = useStarknetKit();
  const { game, isLoading, error } = useGameGraphQL(gameId);

  if (isLoading) {
    return (
      <div className="game-info">
        <div className="game-info-loading">Loading game data...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-info">
        <div className="game-info-error">Failed to load game data</div>
      </div>
    );
  }

  const player1Name = String(game.player_1_name || "Player 1");
  const player1Score = Number(game.player_1_score) || 0;
  const player1Lives = Number(game.player_1_lives) || 0;
  
  // Only show player 2 if they have joined (player_2_name is set)
  const hasPlayer2 = game.player_2_name && String(game.player_2_name).trim() !== "";
  const player2Name = hasPlayer2 ? String(game.player_2_name) : "";
  const player2Score = hasPlayer2 ? (Number(game.player_2_score) || 0) : 0;
  const player2Lives = hasPlayer2 ? (Number(game.player_2_lives) || 0) : 0;

  return (
    <div className="game-info">
      <div className="game-info-title">LIARS PROOF - GAME #{gameId}</div>
      <div className="game-info-players">
        <div className={`game-info-player ${isPlayer1 ? "game-info-player-current" : ""}`}>
          <span className="game-info-player-name">{player1Name}:</span>
          <span className="game-info-player-score">{player1Score} / 50</span>
          <div className="game-info-lives">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`game-info-heart ${
                  i < player1Lives ? "active" : "inactive"
                }`}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>
        {hasPlayer2 && (
          <div className={`game-info-player ${!isPlayer1 ? "game-info-player-current" : ""}`}>
            <span className="game-info-player-name">{player2Name}:</span>
            <span className="game-info-player-score">{player2Score} / 50</span>
            <div className="game-info-lives">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`game-info-heart ${
                    i < player2Lives ? "active" : "inactive"
                  }`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

