import { useState, useEffect } from "react";
import "./GameRules.css";

interface GameRulesProps {
  onExpandChange?: (isExpanded: boolean) => void;
}

interface RuleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const RuleSection = ({ title, isExpanded, onToggle, children }: RuleSectionProps) => {
  return (
    <div className="game-rules-section">
      <div
        className="game-rules-section-header"
        onClick={onToggle}
      >
        <span className="game-rules-section-title">{title}</span>
        <span className="game-rules-section-toggle">
          {isExpanded ? "-" : "+"}
        </span>
      </div>
      {isExpanded && (
        <div className="game-rules-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export const GameRules = ({ onExpandChange }: GameRulesProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newState = { ...prev, [section]: !prev[section] };
      return newState;
    });
  };

  useEffect(() => {
    const hasExpanded = Object.values(expandedSections).some(v => v);
    onExpandChange?.(hasExpanded);
  }, [expandedSections, onExpandChange]);

  return (
    <div className="game-rules">
      <div className="game-rules-header">
        <span className="game-rules-title">GAME RULES</span>
      </div>
      <div className="game-rules-content">
        <RuleSection
          title="Objective"
          isExpanded={expandedSections.objective || false}
          onToggle={() => toggleSection("objective")}
        >
          <p className="game-rules-section-text">
            Be the first player to reach 50 points or reduce the opponent to 0 lives.
          </p>
        </RuleSection>

        <RuleSection
          title="How to Play"
          isExpanded={expandedSections.howToPlay || false}
          onToggle={() => toggleSection("howToPlay")}
        >
          <ol className="game-rules-list">
            <li>Each player commits to 3 cards without revealing them</li>
            <li>A random condition is revealed each round</li>
            <li>Each player decides if their hand fulfills the condition</li>
            <li>Players then decide whether to believe the opponent's claim</li>
            <li>Players submit zero-knowledge proofs to verify their claims</li>
            <li>Round results are calculated based on who lied and who believed</li>
          </ol>
        </RuleSection>

        <RuleSection
          title="Round Scoring"
          isExpanded={expandedSections.scoring || false}
          onToggle={() => toggleSection("scoring")}
        >
          <div className="game-rules-scoring">
            <div className="game-rules-scoring-item">
              <span className="game-rules-scoring-label">You lie + Opponent doesn't believe:</span>
              <span className="game-rules-scoring-value">Opponent +20 points, You -1 life</span>
            </div>
            <div className="game-rules-scoring-item">
              <span className="game-rules-scoring-label">You lie + Opponent believes:</span>
              <span className="game-rules-scoring-value">You +10 points</span>
            </div>
            <div className="game-rules-scoring-item">
              <span className="game-rules-scoring-label">You tell truth + Opponent doesn't believe:</span>
              <span className="game-rules-scoring-value">Opponent -1 life</span>
            </div>
            <div className="game-rules-scoring-item">
              <span className="game-rules-scoring-label">You tell truth + Opponent believes:</span>
              <span className="game-rules-scoring-value">No changes</span>
            </div>
          </div>
        </RuleSection>

        <RuleSection
          title="Winning Conditions"
          isExpanded={expandedSections.winning || false}
          onToggle={() => toggleSection("winning")}
        >
          <ul className="game-rules-list">
            <li>First player to reach 50 points wins</li>
            <li>First player to reduce opponent to 0 lives wins</li>
          </ul>
        </RuleSection>
      </div>
    </div>
  );
};

