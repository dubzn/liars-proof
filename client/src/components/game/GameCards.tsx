import "./GameCards.css";
import { getCardImagePath, getCardDisplayValue, getCardDisplaySuit } from "@/utils/cardUtils";

interface GameCardsProps {
  cards: Array<{ suit: number; value: number }>;
  parallaxOffset: { x: number; y: number };
}

export const GameCards = ({
  cards,
  parallaxOffset,
}: GameCardsProps) => {
  return (
    <div
      className="game-cards"
      style={{
        transform: `translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px)`,
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className="game-card"
          style={{
            transform: `rotate(${(index - 1) * 15}deg) translateY(${index * -10}px)`,
          }}
        >
          <img
            src={getCardImagePath(card.value, card.suit)}
            alt={`${getCardDisplayValue(card.value)}${getCardDisplaySuit(card.suit)}`}
            className="game-card-image"
          />
        </div>
      ))}
    </div>
  );
};

