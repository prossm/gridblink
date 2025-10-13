import { useEffect, useState } from 'react';
import { SPARKLE_COLORS } from '../utils/colors';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

interface SparklesProps {
  show: boolean;
}

export const Sparkles = ({ show }: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate sparkles
      const newSparkles: Sparkle[] = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)] || '#FFD700',
        size: 3 + Math.random() * 5,
        delay: Math.random() * 0.2,
      }));
      setSparkles(newSparkles);

      // Clear sparkles after animation
      const timer = setTimeout(() => {
        setSparkles([]);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show || sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            backgroundColor: sparkle.color,
            borderRadius: '50%',
            animationDelay: `${sparkle.delay}s`,
            boxShadow: `0 0 10px ${sparkle.color}`,
          }}
        />
      ))}
    </div>
  );
};
