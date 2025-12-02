import { useEffect, useState } from "react";
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
  // Offset controlado por posición vertical del mouse:
  // - En la parte inferior de la pantalla -> offsetY ≈ 0 (cartas centradas abajo, visibles)
  // - A medida que el mouse sube -> offsetY aumenta y las cartas se van hacia abajo (fuera de la pantalla)
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const height = window.innerHeight || 1;
      // 0 en bottom, 1 en top
      const progressFromBottom = 1 - e.clientY / height;
      // Clamp 0..1
      const clamped = Math.max(0, Math.min(1, progressFromBottom));
      const MAX_DOWN = 150;
      setOffsetY(clamped * MAX_DOWN);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="player-hand-cards"
      style={{
        // Centrado horizontal con ligero parallax X, Y controlado por offsetY
        transform: `translate(calc(-50% + ${parallaxOffset.x * 0.4}px), ${offsetY}px)`,
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

