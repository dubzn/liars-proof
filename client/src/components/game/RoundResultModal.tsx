import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import "./RoundResultModal.css";

interface RoundResultModalProps {
  isOpen: boolean;
  player1Name: string;
  player2Name: string;
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
  onContinue: () => void;
}

export const RoundResultModal = ({
  isOpen,
  player1Name,
  player2Name,
  player1Lied,
  player2Lied,
  player1Believed,
  player2Believed,
  player1ScoreChange,
  player2ScoreChange,
  player1LivesChange,
  player2LivesChange,
  player1NewScore,
  player2NewScore,
  player1NewLives,
  player2NewLives,
  onContinue,
}: RoundResultModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 5; // Number of steps in the animation
    const stepDuration = 800; // Duration of each step in milliseconds

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const showPlayer1Truth = currentStep >= 0;
  const showPlayer2Truth = currentStep >= 1;
  const showBeliefs = currentStep >= 2;
  const showResults = currentStep >= 3;
  const showContinueButton = currentStep >= 4;

  return (
    <div className="round-result-overlay">
      <div className="round-result-modal">
        <h2 className="round-result-title">ROUND RESULT</h2>
        <div className="round-result-content">

        {/* Player 1 Truth Status */}
        {showPlayer1Truth && (
          <div className={`round-result-section ${showPlayer1Truth ? "visible" : ""}`}>
            <div className={`round-result-player-card ${player1Lied ? "lied" : "truth"}`}>
              <div className="round-result-player-header">
                <span className="round-result-player-name">{player1Name}</span>
                <span className={`round-result-status ${player1Lied ? "lied-badge" : "truth-badge"}`}>
                  {player1Lied ? "LIED" : "TOLD THE TRUTH"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Player 2 Truth Status */}
        {showPlayer2Truth && (
          <div className={`round-result-section ${showPlayer2Truth ? "visible" : ""}`}>
            <div className={`round-result-player-card ${player2Lied ? "lied" : "truth"}`}>
              <div className="round-result-player-header">
                <span className="round-result-player-name">{player2Name}</span>
                <span className={`round-result-status ${player2Lied ? "lied-badge" : "truth-badge"}`}>
                  {player2Lied ? "LIED" : "TOLD THE TRUTH"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Beliefs */}
        {showBeliefs && (
          <div className={`round-result-section ${showBeliefs ? "visible" : ""}`}>
            <div className="round-result-beliefs">
              <div className="round-result-belief-item">
                <span className="round-result-belief-name">{player2Name}</span>
                <span className="round-result-belief-action">
                  {player2Believed ? "believed" : "didn't believe"} {player1Name}
                </span>
              </div>
              <div className="round-result-belief-item">
                <span className="round-result-belief-name">{player1Name}</span>
                <span className="round-result-belief-action">
                  {player1Believed ? "believed" : "didn't believe"} {player2Name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className={`round-result-section ${showResults ? "visible" : ""}`}>
            <div className="round-result-changes">
              <div className="round-result-player-result">
                <div className="round-result-player-result-header">
                  <span className="round-result-player-result-name">{player1Name}</span>
                </div>
                <div className="round-result-player-result-stats">
                  {player1ScoreChange !== 0 && (
                    <div className={`round-result-stat ${player1ScoreChange > 0 ? "positive" : "negative"}`}>
                      <span className="round-result-stat-label">Score:</span>
                      <span className="round-result-stat-value">
                        {player1ScoreChange > 0 ? "+" : ""}{player1ScoreChange}
                      </span>
                    </div>
                  )}
                  {player1LivesChange !== 0 && (
                    <div className={`round-result-stat ${player1LivesChange > 0 ? "positive" : "negative"}`}>
                      <span className="round-result-stat-label">Lives:</span>
                      <span className="round-result-stat-value">
                        {player1LivesChange > 0 ? "+" : ""}{player1LivesChange}
                      </span>
                    </div>
                  )}
                  {player1ScoreChange === 0 && player1LivesChange === 0 && (
                    <div className="round-result-stat neutral">
                      <span className="round-result-stat-value">No changes</span>
                    </div>
                  )}
                </div>
                <div className="round-result-player-result-total">
                  <span>Total Score: {player1NewScore}</span>
                  <span>Lives: {player1NewLives}</span>
                </div>
              </div>

              <div className="round-result-player-result">
                <div className="round-result-player-result-header">
                  <span className="round-result-player-result-name">{player2Name}</span>
                </div>
                <div className="round-result-player-result-stats">
                  {player2ScoreChange !== 0 && (
                    <div className={`round-result-stat ${player2ScoreChange > 0 ? "positive" : "negative"}`}>
                      <span className="round-result-stat-label">Score:</span>
                      <span className="round-result-stat-value">
                        {player2ScoreChange > 0 ? "+" : ""}{player2ScoreChange}
                      </span>
                    </div>
                  )}
                  {player2LivesChange !== 0 && (
                    <div className={`round-result-stat ${player2LivesChange > 0 ? "positive" : "negative"}`}>
                      <span className="round-result-stat-label">Lives:</span>
                      <span className="round-result-stat-value">
                        {player2LivesChange > 0 ? "+" : ""}{player2LivesChange}
                      </span>
                    </div>
                  )}
                  {player2ScoreChange === 0 && player2LivesChange === 0 && (
                    <div className="round-result-stat neutral">
                      <span className="round-result-stat-value">No changes</span>
                    </div>
                  )}
                </div>
                <div className="round-result-player-result-total">
                  <span>Total Score: {player2NewScore}</span>
                  <span>Lives: {player2NewLives}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Continue Button */}
        {showContinueButton && (
          <div className={`round-result-continue ${showContinueButton ? "visible" : ""}`}>
            <Button
              onClick={onContinue}
              className="round-result-continue-button"
              variant="default"
            >
              CONTINUE TO NEXT ROUND
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

