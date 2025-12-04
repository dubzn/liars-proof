import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useConditionGraphQL } from "@/hooks/useConditionGraphQL";
import { generateConditionText } from "@/utils/conditionText";
import "./GamePhasePanel.css";

type GamePhase = "WaitingForHandCommitments" | "ConditionPhase" | "ChallengePhase" | "ResultPhase";

interface GamePhasePanelProps {
  currentPhase: GamePhase;
  opponentName: string;
  conditionId: number;
  player1Name: string;
  player2Name: string;
  player1CommitmentSubmitted: boolean;
  player2CommitmentSubmitted: boolean;
  isPlayer1: boolean;
  player1ConditionSubmitted: boolean;
  player1ConditionChoice: boolean | null;
  player2ConditionSubmitted: boolean;
  player2ConditionChoice: boolean | null;
  player1ChallengeSubmitted: boolean;
  player1ChallengeChoice: boolean | null;
  player2ChallengeSubmitted: boolean;
  player2ChallengeChoice: boolean | null;
  player1ProofSubmitted: boolean;
  player1ProofValid: boolean;
  player2ProofSubmitted: boolean;
  player2ProofValid: boolean;
  onChallengeChoice?: (choice: boolean) => void;
  onConditionChoice?: (choice: boolean) => void;
  onSubmitCommitment?: () => void;
  onSubmitProof?: () => void;
  hasSubmittedCondition?: boolean;
  hasSubmittedChallenge?: boolean;
  isSubmittingCommitment?: boolean;
  isSubmittingProof?: boolean;
}

export const GamePhasePanel = ({
  currentPhase,
  conditionId,
  player1Name,
  player2Name,
  player1CommitmentSubmitted,
  player2CommitmentSubmitted,
  isPlayer1,
  player1ConditionSubmitted,
  player1ConditionChoice,
  player2ConditionSubmitted,
  player2ConditionChoice,
  player1ChallengeSubmitted,
  player1ChallengeChoice,
  player2ChallengeSubmitted,
  player2ChallengeChoice,
  player1ProofSubmitted,
  player1ProofValid,
  player2ProofSubmitted,
  player2ProofValid,
  onChallengeChoice,
  onConditionChoice,
  onSubmitCommitment,
  onSubmitProof,
  hasSubmittedCondition = false,
  hasSubmittedChallenge = false,
  isSubmittingCommitment = false,
  isSubmittingProof = false,
}: GamePhasePanelProps) => {
  const isCommitmentPhase = currentPhase === "WaitingForHandCommitments";
  const isConditionPhase = currentPhase === "ConditionPhase";
  const isChallengePhase = currentPhase === "ChallengePhase";
  const isResultPhase = currentPhase === "ResultPhase";

  // Determine phase status
  // WaitingForHandCommitments is completed if we're past it
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
  const { condition, isLoading: isLoadingCondition } = useConditionGraphQL(conditionId);

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

  const isCommitmentExpanded = expandedPhase === "WaitingForHandCommitments";
  const isConditionExpanded = expandedPhase === "ConditionPhase";
  const isChallengeExpanded = expandedPhase === "ChallengePhase";
  const isResultExpanded = expandedPhase === "ResultPhase";

  // Check if current player has submitted commitment
  const currentPlayerCommitmentSubmitted = isPlayer1 ? player1CommitmentSubmitted : player2CommitmentSubmitted;
  const bothCommitmentsSubmitted = player1CommitmentSubmitted && player2CommitmentSubmitted;

  // Opponent info for challenge phase
  const opponentDisplayName = isPlayer1 ? (player2Name || "Player 2") : (player1Name || "Player 1");
  const opponentConditionSubmitted = isPlayer1 ? player2ConditionSubmitted : player1ConditionSubmitted;
  const opponentConditionChoice = isPlayer1 ? player2ConditionChoice : player1ConditionChoice;

  let opponentConditionSummary = "";
  if (opponentConditionSubmitted) {
    if (opponentConditionChoice === true) {
      opponentConditionSummary = `${opponentDisplayName} says that fulfills the condition.`;
    } else if (opponentConditionChoice === false) {
      opponentConditionSummary = `${opponentDisplayName} says that doesn't fulfill the condition.`;
    }
  } else {
    opponentConditionSummary = `${opponentDisplayName} is thinking...`;
  }

  return (
    <div className="game-phase-panel">
      {/* Commitment Phase */}
      <div className={`game-phase ${isCommitmentPhase ? "active" : isCommitmentCompleted ? "completed" : "pending"}`}>
        <div
          className={`game-phase-header ${canExpandCommitment ? "clickable" : ""}`}
          onClick={() => {
            if (canExpandCommitment) {
              setExpandedPhase(isCommitmentExpanded ? null : "WaitingForHandCommitments");
            }
          }}
        >
          <span className="game-phase-icon">
            {isCommitmentPhase ? "⋯" : isCommitmentCompleted ? "✓" : "○"}
          </span>
          <span className="game-phase-title">COMMITMENT PHASE</span>
          {canExpandCommitment && (
            <span className="game-phase-toggle">
              {isCommitmentExpanded ? "▲" : "▼"}
            </span>
          )}
        </div>
        {isCommitmentExpanded && (
          <div className="game-phase-content">
            <div className="game-phase-description">
              Both players must commit to their hand cards without revealing them.
            </div>
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
                Both players have submitted their hand commitments!
              </div>
            ) : currentPlayerCommitmentSubmitted ? (
              <div className="game-phase-message">
                Waiting for opponent to submit commitment...
              </div>
            ) : (
              <>
                <div className="game-phase-message">
                  Please submit your hand commitment to continue.
                </div>
                <div className="game-phase-buttons">
                  <Button
                    variant="default"
                    onClick={() => onSubmitCommitment?.()}
                    className="game-phase-button"
                    disabled={isSubmittingCommitment}
                  >
                    {isSubmittingCommitment ? "Submitting..." : "SUBMIT COMMITMENT"}
                  </Button>
                </div>
              </>
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
              {isConditionExpanded ? "▲" : "▼"}
            </span>
          )}
        </div>
        {isConditionExpanded && (
          <div className="game-phase-content">
            <div className="game-phase-description">
              A random condition is revealed. Each player must decide if their hand fulfills it.
            </div>
            {isLoadingCondition ? (
              <div className="game-phase-message">Loading condition...</div>
            ) : conditionText ? (
              <>
                <div className="game-phase-condition-container">
                  <div className="game-phase-condition-label">CONDITION</div>
                  <div className="game-phase-condition-text">
                    {conditionText}
                  </div>
                </div>
                <div className="game-phase-condition-status">
                  <div className="game-phase-condition-player">
                    <span className="game-phase-condition-name">{player1Name || "Player 1"}</span>
                    <span className="game-phase-condition-message">
                      {player1ConditionSubmitted
                        ? player1ConditionChoice === true
                          ? "says that fulfills the condition"
                          : "says that doesn't fulfill the condition"
                        : "is thinking..."}
                    </span>
                  </div>
                  {player2Name && (
                    <div className="game-phase-condition-player">
                      <span className="game-phase-condition-name">{player2Name}</span>
                      <span className="game-phase-condition-message">
                        {player2ConditionSubmitted
                          ? player2ConditionChoice === true
                            ? "says that fulfills the condition"
                            : "says that doesn't fulfill the condition"
                          : "is thinking..."}
                      </span>
                    </div>
                  )}
                </div>
                {player1ConditionSubmitted && player2ConditionSubmitted ? (
                  <div className="game-phase-message">
                    Both players have submitted their condition choices!
                  </div>
                ) : hasSubmittedCondition ? (
                  <div className="game-phase-message">
                    Waiting for opponent to submit condition choice...
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
              {isChallengeExpanded ? "▲" : "▼"}
            </span>
          )}
        </div>
        {isChallengeExpanded && (
          <div className="game-phase-content">
            <div className="game-phase-description">
              Each player decides whether to believe the opponent's claim about fulfilling the condition.
            </div>
            {/* Opponent's previous claim about the condition */}
            <div className="game-phase-opponent-claim-container">
              <div className="game-phase-opponent-claim-label">OPPONENT CLAIM</div>
              <div className="game-phase-opponent-claim-text">
                {opponentConditionSummary}
              </div>
            </div>
            {/* Show challenge choices status */}
            <div className="game-phase-condition-status">
              <div className="game-phase-condition-player">
                <span className="game-phase-condition-name">{player1Name || "Player 1"}</span>
                <span className="game-phase-condition-message">
                  {player1ChallengeSubmitted
                    ? player1ChallengeChoice === true
                      ? "believes the opponent"
                      : "doesn't believe the opponent"
                    : "is thinking..."}
                </span>
              </div>
              {player2Name && (
                <div className="game-phase-condition-player">
                  <span className="game-phase-condition-name">{player2Name}</span>
                  <span className="game-phase-condition-message">
                    {player2ChallengeSubmitted
                      ? player2ChallengeChoice === true
                        ? "believes the opponent"
                        : "doesn't believe the opponent"
                      : "is thinking..."}
                  </span>
                </div>
              )}
            </div>
            {player1ChallengeSubmitted && player2ChallengeSubmitted ? (
              <div className="game-phase-message">
                Both players have submitted their challenge choices!
              </div>
            ) : hasSubmittedChallenge ? (
              <div className="game-phase-message">
                Waiting for opponent to submit challenge choice...
              </div>
            ) : (
              <>
                <div className="game-phase-question">
                  Do you believe {isPlayer1 ? (player2Name || "Player 2") : (player1Name || "Player 1")}?
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
              {isResultExpanded ? "▲" : "▼"}
            </span>
          )}
        </div>
        {isResultExpanded && (
          <div className="game-phase-content">
            <div className="game-phase-description">
              Players submit proofs to verify their claims. The round winner is determined.
            </div>
            {/* Show proof submission status */}
            <div className="game-phase-condition-status">
              <div className="game-phase-condition-player">
                <span className="game-phase-condition-name">{player1Name || "Player 1"}</span>
                <span className="game-phase-condition-message">
                  {player1ProofSubmitted
                    ? player1ProofValid
                      ? "✓ Proof verified (valid)"
                      : "✗ Proof verified (invalid)"
                    : "Submitting proof..."}
                </span>
              </div>
              {player2Name && (
                <div className="game-phase-condition-player">
                  <span className="game-phase-condition-name">{player2Name}</span>
                  <span className="game-phase-condition-message">
                    {player2ProofSubmitted
                      ? player2ProofValid
                        ? "✓ Proof verified (valid)"
                        : "✗ Proof verified (invalid)"
                      : "Submitting proof..."}
                  </span>
                </div>
              )}
            </div>
            {player1ProofSubmitted && player2ProofSubmitted ? (
              <div className="game-phase-message">
                Both players have submitted their proofs! Determining winner...
              </div>
            ) : (
              <>
                <div className="game-phase-message">
                  {isPlayer1 
                    ? (player1ProofSubmitted 
                        ? "Waiting for opponent to submit proof..."
                        : "Submit your proof to verify your claim.")
                    : (player2ProofSubmitted 
                        ? "Waiting for opponent to submit proof..."
                        : "Submit your proof to verify your claim.")}
                </div>
                {((isPlayer1 && !player1ProofSubmitted) || (!isPlayer1 && !player2ProofSubmitted)) && (
                  <div className="game-phase-buttons">
                    <Button
                      variant="default"
                      onClick={() => onSubmitProof?.()}
                      className="game-phase-button"
                      disabled={isSubmittingProof}
                    >
                      {isSubmittingProof ? "Submitting..." : "SUBMIT PROOF"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

