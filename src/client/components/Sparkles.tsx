import { useEffect, useState } from 'react';
import { SPARKLE_COLORS } from '../utils/colors';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  color2: string;
  size: number;
  delay: number;
  duration: number;
  animationType: 'float' | 'spin' | 'twinkle';
}

interface SparklesProps {
  show: boolean;
}

export const Sparkles = ({ show }: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate more sparkles with greater variety and staggered timing
      const animationTypes: Array<'float' | 'spin' | 'twinkle'> = ['float', 'spin', 'twinkle'];
      const newSparkles: Sparkle[] = Array.from({ length: 30 }, (_, i) => {
        const color1 = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)] || '#FFD700';
        const color2 = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)] || '#FF6B9D';
        return {
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 120 - 10, // Allow -10% to 110% for softer boundary
          color: color1,
          color2: color2,
          size: 3 + Math.random() * 7, // Bigger size range
          delay: Math.random() * 0.5, // Longer stagger window
          duration: 0.6 + Math.random() * 0.6, // Vary duration 0.6-1.2s
          animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)] || 'float',
        };
      });
      setSparkles(newSparkles);

      // Clear sparkles after animation
      const timer = setTimeout(() => {
        setSparkles([]);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show || sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {sparkles.map((sparkle) => {
        const animClass =
          sparkle.animationType === 'float' ? 'animate-sparkle-float' :
          sparkle.animationType === 'spin' ? 'animate-sparkle-spin' :
          'animate-sparkle-twinkle';

        return (
          <div
            key={sparkle.id}
            className={`absolute ${animClass} animate-shimmer`}
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              background: `linear-gradient(135deg, ${sparkle.color}, ${sparkle.color2})`,
              borderRadius: '50%',
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              boxShadow: `0 0 ${sparkle.size * 1.3}px ${sparkle.color}, 0 0 ${sparkle.size * 1.7}px ${sparkle.color2}`,
            }}
          />
        );
      })}
    </div>
  );
};
