import { useEffect, useState } from "react";
import "./CharacterCarousel.css";

const CHARACTER_IMAGES = [
  "/images/joker_pose_3.png",
  "/images/joker_pose_1.png",
  "/images/joker_pose_2.png",
];

const ANIMATION_DURATION = 8000; // 8 seconds total per image - constant movement

export const CharacterCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Only animate if we have more than one image
    if (CHARACTER_IMAGES.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CHARACTER_IMAGES.length);
    }, ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="character-carousel">
      {CHARACTER_IMAGES.map((image, index) => (
        <div
          key={index}
          className={`character-slide ${
            index === currentIndex ? "active" : ""
          }`}
        >
          <img src={image} alt={`Character ${index + 1}`} />
        </div>
      ))}
    </div>
  );
};
