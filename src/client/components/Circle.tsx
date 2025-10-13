import { useState, useEffect } from 'react';
import { CIRCLE_COLORS } from '../utils/colors';

interface CircleProps {
  index: number;
  isFlashing: boolean;
  onClick: () => void;
  disabled: boolean;
}

const DEFAULT_COLOR = { base: '#FF6B9D', bright: '#FF8FB8' };

export const Circle = ({ index, isFlashing, onClick, disabled }: CircleProps) => {
  const [haloScale, setHaloScale] = useState(0);
  const color = CIRCLE_COLORS[index] || DEFAULT_COLOR;

  useEffect(() => {
    if (isFlashing) {
      setHaloScale(1);
      const timer = setTimeout(() => {
        setHaloScale(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  return (
    <button
      className="relative flex items-center justify-center aspect-square rounded-full transition-all duration-200 focus:outline-none"
      style={{
        backgroundColor: isFlashing ? color.bright : color.base,
        transform: isFlashing ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isFlashing ? `0 0 20px ${color.bright}` : 'none',
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Circle ${index + 1}`}
    >
      {/* Halo effect */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-400"
        style={{
          transform: `scale(${1 + haloScale * 0.5})`,
          opacity: haloScale > 0 ? 1 - haloScale : 0,
          border: `2px solid ${color.bright}`,
        }}
      />
    </button>
  );
};
