import { Button } from "@/components/ui/button";
import "./GamePhasePanel.css";

type GamePhase = "ConditionPhase" | "ChallengePhase" | "ResultPhase";

interface GamePhasePanelProps {
  currentPhase: GamePhase;
  opponentName: string;
  onChallengeChoice?: (choice: boolean) => void;
  onConditionChoice?: (choice: boolean) => void;
  hasSubmittedCondition?: boolean;
  hasSubmittedChallenge?: boolean;
}

export const GamePhasePanel = ({
  currentPhase,
  opponentName,
  onChallengeChoice,
  onConditionChoice,
  hasSubmittedCondition = false,
  hasSubmittedChallenge = false,
}: GamePhasePanelProps) => {
  const isConditionPhase = currentPhase === "ConditionPhase";
  const isChallengePhase = currentPhase === "ChallengePhase";
  const isResultPhase = currentPhase === "ResultPhase";

  return (
    <div className="game-phase-panel">
      {/* Condition Phase */}
      <div className={`game-phase ${isConditionPhase ? "active" : "completed"}`}>
        <div className="game-phase-header">
          <span className="game-phase-icon">
            {isConditionPhase ? "⋯" : "✓"}
          </span>
          <span className="game-phase-title">Condition phase</span>
        </div>
        {isConditionPhase && (
          <div className="game-phase-content">
            {hasSubmittedCondition ? (
              <div className="game-phase-message">
                Waiting for opponent's condition choice...
              </div>
            ) : (
              <>
                <div className="game-phase-question">
                  Do you fulfill the condition?
                </div>
                <div className="game-phase-buttons">
                  <Button
                    variant="default"
                    onClick={() => onConditionChoice?.(true)}
                    className="game-phase-button game-phase-button-yes"
                  >
                    YES
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onConditionChoice?.(false)}
                    className="game-phase-button game-phase-button-no"
                  >
                    NO
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Challenge Phase */}
      <div className={`game-phase ${isChallengePhase ? "active" : isResultPhase || isConditionPhase ? "pending" : "completed"}`}>
        <div className="game-phase-header">
          <span className="game-phase-icon">
            {isChallengePhase ? "⋯" : isResultPhase || isConditionPhase ? "○" : "✓"}
          </span>
          <span className="game-phase-title">Challenge phase</span>
        </div>
        {isChallengePhase && (
          <div className="game-phase-content">
            {hasSubmittedChallenge ? (
              <div className="game-phase-message">
                Waiting for opponent's challenge choice...
              </div>
            ) : (
              <>
                <div className="game-phase-question">
                  Do you trust that {opponentName || "your opponent"} is fulfilling the condition?
                </div>
                <div className="game-phase-buttons">
                  <Button
                    variant="default"
                    onClick={() => onChallengeChoice?.(true)}
                    className="game-phase-button game-phase-button-yes"
                  >
                    YES
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onChallengeChoice?.(false)}
                    className="game-phase-button game-phase-button-no"
                  >
                    NO
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Result Phase */}
      <div className={`game-phase ${isResultPhase ? "active" : "pending"}`}>
        <div className="game-phase-header">
          <span className="game-phase-icon">
            {isResultPhase ? "⋯" : "○"}
          </span>
          <span className="game-phase-title">Result phase</span>
        </div>
        {isResultPhase && (
          <div className="game-phase-content">
            <div className="game-phase-message">
              Waiting for proofs to be submitted...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

