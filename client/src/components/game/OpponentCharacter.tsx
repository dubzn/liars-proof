import "./OpponentCharacter.css";

interface OpponentCharacterProps {
  image: string;
  name: string;
  parallaxOffset: { x: number; y: number };
  isBlurred?: boolean;
}

export const OpponentCharacter = ({
  image,
  name,
  parallaxOffset,
  isBlurred = false,
}: OpponentCharacterProps) => {
  return (
    <div
      className="opponent-character"
      style={{
        transform: `translate(calc(-50% + ${parallaxOffset.x}px), ${parallaxOffset.y}px)`,
      }}
    >
      <div className={`opponent-character-blur-wrapper ${isBlurred ? "blurred" : ""}`}>
        <div className="opponent-character-glow"></div>
        <img src={image} alt={name} className="opponent-character-image" />
      </div>
    </div>
  );
};

