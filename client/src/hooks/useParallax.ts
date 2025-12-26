import { useEffect, useState } from "react";

interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * Hook to calculate parallax offset based on mouse position
 */
export const useParallax = (intensity: number = 20): ParallaxOffset => {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const deltaX = (e.clientX - centerX) / centerX;
      const deltaY = (e.clientY - centerY) / centerY;

      setOffset({
        x: deltaX * intensity,
        y: deltaY * intensity,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [intensity]);

  return offset;
};
