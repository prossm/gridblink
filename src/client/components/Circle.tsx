import { useState, useEffect } from 'react';
import { CIRCLE_COLORS } from '../utils/colors';

interface CircleProps {
  index: number;
  isFlashing: boolean;
  onClick: () => void;
  disabled: boolean;
}

const DEFAULT_COLOR = { base: '#FF6B9D', bright: '#FF8FB8', dark: '#CC4470' };

export const Circle = ({ index, isFlashing, onClick, disabled }: CircleProps) => {
  const [haloScale, setHaloScale] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const color = CIRCLE_COLORS[index] || DEFAULT_COLOR;

  useEffect(() => {
    if (isFlashing) {
      // Reset to 0 first, then immediately set to 1 to ensure clean animation restart
      setHaloScale(0);
      // Use requestAnimationFrame to ensure the reset happens before the new animation
      requestAnimationFrame(() => {
        setHaloScale(1);
      });
      const timer = setTimeout(() => {
        setHaloScale(0);
      }, 400);
      return () => {
        clearTimeout(timer);
        // Ensure halo is reset when component unmounts or effect re-runs
        setHaloScale(0);
      };
    } else {
      // Explicitly reset when not flashing
      setHaloScale(0);
    }
  }, [isFlashing]);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    // Quick press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 50);
    onClick();
  };

  return (
    <button
      className="relative flex items-center justify-center aspect-square rounded-full focus:outline-none cursor-pointer"
      style={{
        backgroundColor: isFlashing ? color.dark : color.base,
        transform: isFlashing
          ? 'scale(0.95)'
          : isPressed
            ? 'scale(0.92)'
            : 'scale(1)',
        boxShadow: isFlashing
          ? `0 0 35px ${color.bright}, 0 0 15px ${color.dark}, inset 0 0 20px rgba(0,0,0,0.2)`
          : isPressed
            ? `inset 0 2px 8px rgba(0,0,0,0.3)`
            : 'none',
        transition: 'transform 0.03s ease-out, box-shadow 0.03s ease-out, background-color 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={disabled}
      aria-label={`Circle ${index + 1}`}
    >
      {/* Halo effect - more prominent and solid */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-400"
        style={{
          transform: `scale(${1 + haloScale * 0.6})`,
          opacity: haloScale > 0 ? 0.9 - haloScale * 0.7 : 0,
          border: `4px solid ${color.bright}`,
          boxShadow: `0 0 25px ${color.bright}`,
        }}
      />
      {/* Inner glow ring for more contrast */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isFlashing ? 0.6 : 0,
          boxShadow: `inset 0 0 25px ${color.bright}`,
        }}
      />
    </button>
  );
};
