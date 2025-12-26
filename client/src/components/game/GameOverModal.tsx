import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import "./GameOverModal.css";

interface GameOverModalProps {
  isOpen: boolean;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Lives: number;
  player2Lives: number;
  winnerName: string;
  isPlayer1Winner: boolean;
}

export const GameOverModal = ({
  isOpen,
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  player1Lives,
  player2Lives,
  winnerName,
  isPlayer1Winner,
}: GameOverModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBackToMenu = () => {
    navigate("/");
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">GAME OVER</h2>

        <div className="game-over-content">
          {/* Winner Section */}
          <div className="game-over-winner-section">
            <div className="game-over-winner-label">WINNER</div>
            <div
              className={`game-over-winner-name ${isPlayer1Winner ? "player1" : "player2"}`}
            >
              {winnerName}
            </div>
          </div>

          {/* Final Scores */}
          <div className="game-over-scores">
            <div
              className={`game-over-player-result ${isPlayer1Winner ? "winner" : "loser"}`}
            >
              <div className="game-over-player-header">
                <span className="game-over-player-name">{player1Name}</span>
                {isPlayer1Winner && (
                  <span className="game-over-winner-badge">WINNER</span>
                )}
              </div>
              <div className="game-over-player-stats">
                <div className="game-over-stat">
                  <span className="game-over-stat-label">Final Score:</span>
                  <span className="game-over-stat-value">
                    {player1Score} / 50
                  </span>
                </div>
                <div className="game-over-stat">
                  <span className="game-over-stat-label">Lives:</span>
                  <span className="game-over-stat-value">{player1Lives}</span>
                </div>
              </div>
            </div>

            <div
              className={`game-over-player-result ${!isPlayer1Winner ? "winner" : "loser"}`}
            >
              <div className="game-over-player-header">
                <span className="game-over-player-name">{player2Name}</span>
                {!isPlayer1Winner && (
                  <span className="game-over-winner-badge">WINNER</span>
                )}
              </div>
              <div className="game-over-player-stats">
                <div className="game-over-stat">
                  <span className="game-over-stat-label">Final Score:</span>
                  <span className="game-over-stat-value">
                    {player2Score} / 50
                  </span>
                </div>
                <div className="game-over-stat">
                  <span className="game-over-stat-label">Lives:</span>
                  <span className="game-over-stat-value">{player2Lives}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Menu Button */}
        <div className="game-over-actions">
          <Button
            onClick={handleBackToMenu}
            className="game-over-button"
            variant="default"
          >
            BACK TO MENU
          </Button>
        </div>
      </div>
    </div>
  );
};
