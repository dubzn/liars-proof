import { getCardImagePath } from "@/utils/cardUtils";
import "./PlayerHandCards.css";

interface PlayerHandCardsProps {
  cards: Array<{ suit: number; value: number }>;
  parallaxOffset: { x: number; y: number };
}

export const PlayerHandCards = ({
  cards,
  parallaxOffset,
}: PlayerHandCardsProps) => {
  // Invertir el parallax Y: cuando mouse está abajo, cartas suben; cuando está en medio, bajan
  const invertedY = -parallaxOffset.y;

  return (
    <div
      className="player-hand-cards"
      style={{
        transform: `translate(calc(-50% + ${parallaxOffset.x * 0.5}px), ${invertedY * 0.5}px)`,
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className="player-hand-card"
          style={{
            transform: `rotate(${(index - 1) * 8}deg) translateY(${index * -5}px)`,
          }}
        >
          <img
            src={getCardImagePath(card.value, card.suit)}
            alt={`Card ${index + 1}`}
            className="player-hand-card-image"
          />
        </div>
      ))}
    </div>
  );
};

