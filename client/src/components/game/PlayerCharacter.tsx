import "./PlayerCharacter.css";

interface PlayerCharacterProps {
  image: string;
  name: string;
  parallaxOffset: { x: number; y: number };
}

export const PlayerCharacter = ({
  image,
  name,
  parallaxOffset,
}: PlayerCharacterProps) => {
  return (
    <div
      className="player-character"
      style={{
        transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
      }}
    >
      <img src={image} alt={name} className="player-character-image" />
    </div>
  );
};

