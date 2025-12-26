import { useEffect, useState } from "react";
import { getCardImagePath, getCardFullName } from "@/utils/cardUtils";
import "./PlayerHandCards.css";

interface PlayerHandCardsProps {
  cards: Array<{ suit: number; value: number }>;
  parallaxOffset: { x: number; y: number };
  onHoverChange?: (isHovering: boolean) => void;
}

export const PlayerHandCards = ({
  cards,
  parallaxOffset,
  onHoverChange,
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
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {cards.map((card, index) => {
        // Create arc effect: left card rotated left, center card straight, right card rotated right
        // Position them in an arc shape - very close together with significant overlap
        const angle = (index - 1) * 20; // -20deg, 0deg, 20deg
        const radius = 15; // Very small radius for tight grouping
        const arcAngle = (index - 1) * 0.3; // Arc angle in radians
        const xOffset = Math.sin(arcAngle) * radius;
        const yOffset = -Math.abs(Math.cos(arcAngle) - 1) * radius * 0.1; // Minimal vertical offset

        const cardName = getCardFullName(card.value, card.suit);

        return (
          <div
            key={index}
            className="player-hand-card"
            data-card-index={index}
            style={{
              transform: `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`,
              zIndex: index + 1, // CARTA_0 (1), CARTA_1 (2), CARTA_2 (3) - carta 2 encima de 1, 1 encima de 0
            }}
          >
            <img
              src={getCardImagePath(card.value, card.suit)}
              alt={`Card ${index + 1}`}
              className="player-hand-card-image"
            />
            <div className="player-hand-card-tooltip">{cardName}</div>
          </div>
        );
      })}
    </div>
  );
};
