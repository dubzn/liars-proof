import "./GameInfo.css";

interface GameInfoProps {
  gameId: number;
  player1Name: string;
  player1Score: number;
  player1Lives: number;
  player2Name: string;
  player2Score: number;
  player2Lives: number;
}

export const GameInfo = ({
  gameId,
  player1Name,
  player1Score,
  player1Lives,
  player2Name,
  player2Score,
  player2Lives,
}: GameInfoProps) => {
  return (
    <div className="game-info">
      <div className="game-info-title">Liar's Proof - Game #{gameId}</div>
      <div className="game-info-players">
        <div className="game-info-player">
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
        <div className="game-info-player">
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
      </div>
    </div>
  );
};

