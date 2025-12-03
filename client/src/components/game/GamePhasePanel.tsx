import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useConditionGraphQL } from "@/hooks/useConditionGraphQL";
import { generateConditionText } from "@/utils/conditionText";
import "./GamePhasePanel.css";

type GamePhase = "CommitmentPhase" | "ConditionPhase" | "ChallengePhase" | "ResultPhase";

interface GamePhasePanelProps {
  currentPhase: GamePhase;
  opponentName: string;
  conditionId: number;
  player1Name: string;
  player2Name: string;
  player1CommitmentSubmitted: boolean;
  player2CommitmentSubmitted: boolean;
  isPlayer1: boolean;
  onChallengeChoice?: (choice: boolean) => void;
  onConditionChoice?: (choice: boolean) => void;
  hasSubmittedCondition?: boolean;
  hasSubmittedChallenge?: boolean;
}

export const GamePhasePanel = ({
  currentPhase,
  opponentName,
  conditionId,
  player1Name,
  player2Name,
  player1CommitmentSubmitted,
  player2CommitmentSubmitted,
  isPlayer1,
  onChallengeChoice,
  onConditionChoice,
  hasSubmittedCondition = false,
  hasSubmittedChallenge = false,
}: GamePhasePanelProps) => {
  const isCommitmentPhase = currentPhase === "CommitmentPhase";
  const isConditionPhase = currentPhase === "ConditionPhase";
  const isChallengePhase = currentPhase === "ChallengePhase";
  const isResultPhase = currentPhase === "ResultPhase";

  // Determine phase status
  // CommitmentPhase is completed if we're past it
  const isCommitmentCompleted = isConditionPhase || isChallengePhase || isResultPhase;
  // ConditionPhase is completed if we're in ChallengePhase or ResultPhase
  const isConditionCompleted = isChallengePhase || isResultPhase;
  // ChallengePhase is completed if we're in ResultPhase
  const isChallengeCompleted = isResultPhase;
  // ResultPhase is never completed (only active or pending)

  // Determine if a phase can be expanded (current phase or past phase)
  const canExpandCommitment = isCommitmentPhase || isCommitmentCompleted;
  const canExpandCondition = isConditionPhase || isConditionCompleted;
  const canExpandChallenge = isChallengePhase || isChallengeCompleted || isConditionCompleted;
  const canExpandResult = isResultPhase; // Only expandable when it's the current phase

  // Fetch condition data
  const { condition, isLoading: isLoadingCondition, error: conditionError } = useConditionGraphQL(conditionId);

  // Debug logs
  useEffect(() => {
    console.log("[GamePhasePanel] conditionId:", conditionId);
    console.log("[GamePhasePanel] condition:", condition);
    console.log("[GamePhasePanel] isLoadingCondition:", isLoadingCondition);
    console.log("[GamePhasePanel] conditionError:", conditionError);
  }, [conditionId, condition, isLoadingCondition, conditionError]);

  // Generate condition text
  const conditionText = condition
    ? generateConditionText(
        Number(condition.condition),
        Number(condition.quantity),
        Number(condition.comparator),
        Number(condition.value),
        Number(condition.suit)
      )
    : null;

  // Collapsible state - only the active phase is expanded
  const [expandedPhase, setExpandedPhase] = useState<GamePhase | null>(currentPhase);

  // Update expanded phase when current phase changes
  useEffect(() => {
    setExpandedPhase(currentPhase);
  }, [currentPhase]);

  const isCommitmentExpanded = expandedPhase === "CommitmentPhase";
  const isConditionExpanded = expandedPhase === "ConditionPhase";
  const isChallengeExpanded = expandedPhase === "ChallengePhase";
  const isResultExpanded = expandedPhase === "ResultPhase";

  // Check if current player has submitted commitment
  const currentPlayerCommitmentSubmitted = isPlayer1 ? player1CommitmentSubmitted : player2CommitmentSubmitted;
  const bothCommitmentsSubmitted = player1CommitmentSubmitted && player2CommitmentSubmitted;

  return (
    <div className="game-phase-panel">
      {/* Commitment Phase */}
      <div className={`game-phase ${isCommitmentPhase ? "active" : isCommitmentCompleted ? "completed" : "pending"}`}>
        <div
          className={`game-phase-header ${canExpandCommitment ? "clickable" : ""}`}
          onClick={() => {
            if (canExpandCommitment) {
              setExpandedPhase(isCommitmentExpanded ? null : "CommitmentPhase");
            }
          }}
        >
          <span className="game-phase-icon">
            {isCommitmentPhase ? "⋯" : isCommitmentCompleted ? "✓" : "○"}
          </span>
          <span className="game-phase-title">COMMITMENT PHASE</span>
          {canExpandCommitment && (
            <span className="game-phase-toggle">
              {isCommitmentExpanded ? "−" : "+"}
            </span>
          )}
        </div>
        {isCommitmentExpanded && (
          <div className="game-phase-content">
            <div className="game-phase-commitment-status">
              <div className="game-phase-commitment-player">
                <span className="game-phase-commitment-name">{player1Name || "Player 1"}</span>
                <span className="game-phase-commitment-check">
                  {player1CommitmentSubmitted ? "✓" : "○"}
                </span>
              </div>
              <div className="game-phase-commitment-player">
                <span className="game-phase-commitment-name">{player2Name || "Player 2"}</span>
                <span className="game-phase-commitment-check">
                  {player2CommitmentSubmitted ? "✓" : "○"}
                </span>
              </div>
            </div>
            {bothCommitmentsSubmitted ? (
              <div className="game-phase-message">
                Both players have submitted their commitments!
              </div>
            ) : currentPlayerCommitmentSubmitted ? (
              <div className="game-phase-message">
                Waiting for opponent to submit commitment...
              </div>
            ) : (
              <div className="game-phase-message">
                Please submit your hand commitment to continue.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Condition Phase */}
      <div className={`game-phase ${isConditionPhase ? "active" : isConditionCompleted ? "completed" : "pending"}`}>
        <div
          className={`game-phase-header ${canExpandCondition ? "clickable" : ""}`}
          onClick={() => {
            if (canExpandCondition) {
              setExpandedPhase(isConditionExpanded ? null : "ConditionPhase");
            }
          }}
        >
          <span className="game-phase-icon">
            {isConditionPhase ? "⋯" : isConditionCompleted ? "✓" : "○"}
          </span>
          <span className="game-phase-title">CONDITION PHASE</span>
          {canExpandCondition && (
            <span className="game-phase-toggle">
              {isConditionExpanded ? "−" : "+"}
            </span>
          )}
        </div>
        {isConditionExpanded && (
          <div className="game-phase-content">
            {isLoadingCondition ? (
              <div className="game-phase-message">Loading condition...</div>
            ) : conditionText ? (
              <>
                <div className="game-phase-condition">
                  {conditionText}
                </div>
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
              </>
            ) : (
              <div className="game-phase-message">No condition available</div>
            )}
          </div>
        )}
      </div>

      {/* Challenge Phase */}
      <div className={`game-phase ${isChallengePhase ? "active" : isChallengeCompleted ? "completed" : "pending"}`}>
        <div
          className={`game-phase-header ${canExpandChallenge ? "clickable" : ""}`}
          onClick={() => {
            if (canExpandChallenge) {
              setExpandedPhase(isChallengeExpanded ? null : "ChallengePhase");
            }
          }}
        >
          <span className="game-phase-icon">
            {isChallengePhase ? "⋯" : isChallengeCompleted ? "✓" : "○"}
          </span>
          <span className="game-phase-title">CHALLENGE PHASE</span>
          {canExpandChallenge && (
            <span className="game-phase-toggle">
              {isChallengeExpanded ? "−" : "+"}
            </span>
          )}
        </div>
        {isChallengeExpanded && (
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
        <div
          className={`game-phase-header ${canExpandResult ? "clickable" : ""}`}
          onClick={() => {
            if (canExpandResult) {
              setExpandedPhase(isResultExpanded ? null : "ResultPhase");
            }
          }}
        >
          <span className="game-phase-icon">
            {isResultPhase ? "⋯" : "○"}
          </span>
          <span className="game-phase-title">RESULT PHASE</span>
          {canExpandResult && (
            <span className="game-phase-toggle">
              {isResultExpanded ? "−" : "+"}
            </span>
          )}
        </div>
        {isResultExpanded && (
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

