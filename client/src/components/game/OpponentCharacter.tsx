import "./OpponentCharacter.css";

interface OpponentCharacterProps {
  image: string;
  name: string;
  parallaxOffset: { x: number; y: number };
}

export const OpponentCharacter = ({
  image,
  name,
  parallaxOffset,
}: OpponentCharacterProps) => {
  return (
    <div
      className="opponent-character"
      style={{
        transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
      }}
    >
      <div className="opponent-character-glow"></div>
      <img src={image} alt={name} className="opponent-character-image" />
    </div>
  );
};

