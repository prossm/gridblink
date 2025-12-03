import React, { useState, useEffect, useRef } from 'react';
import { CIRCLE_COLORS } from '../utils/colors';
import { getComplementaryColor } from '../utils/colorUtils';

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
  const [showRipple, setShowRipple] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const color = CIRCLE_COLORS[index] || DEFAULT_COLOR;
  const invertedColor = getComplementaryColor(color.base);

  // Store timer IDs to clear them on rapid clicks
  const clickTimersRef = useRef<{
    ripple?: ReturnType<typeof setTimeout>;
    invert?: ReturnType<typeof setTimeout>;
    press?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    if (isFlashing) {
      // Computer's turn - trigger ripple and color inversion
      setShowRipple(true);
      setIsInverted(true);

      // Reset to 0 first, then immediately set to 1 to ensure clean animation restart
      setHaloScale(0);
      // Use requestAnimationFrame to ensure the reset happens before the new animation
      requestAnimationFrame(() => {
        setHaloScale(1);
      });

      const rippleTimer = setTimeout(() => setShowRipple(false), 500);
      const invertTimer = setTimeout(() => setIsInverted(false), 100);
      const haloTimer = setTimeout(() => {
        setHaloScale(0);
      }, 400);

      return () => {
        clearTimeout(rippleTimer);
        clearTimeout(invertTimer);
        clearTimeout(haloTimer);
        // Ensure all effects are reset when component unmounts or effect re-runs
        setHaloScale(0);
        setShowRipple(false);
        setIsInverted(false);
      };
    } else {
      // Explicitly reset when not flashing
      setHaloScale(0);
      setShowRipple(false);
      setIsInverted(false);
    }
  }, [isFlashing]);

  // Cleanup click timers on unmount
  useEffect(() => {
    const timers = clickTimersRef.current;
    return () => {
      if (timers.ripple) clearTimeout(timers.ripple);
      if (timers.invert) clearTimeout(timers.invert);
      if (timers.press) clearTimeout(timers.press);
    };
  }, []);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    // Clear any existing animation timers
    if (clickTimersRef.current.ripple) clearTimeout(clickTimersRef.current.ripple);
    if (clickTimersRef.current.invert) clearTimeout(clickTimersRef.current.invert);
    if (clickTimersRef.current.press) clearTimeout(clickTimersRef.current.press);

    // Reset states immediately to allow animation restart
    setShowRipple(false);
    setIsInverted(false);
    setIsPressed(false);

    // Use requestAnimationFrame to ensure state reset happens before new animation
    requestAnimationFrame(() => {
      // Increment key to force ripple remount and restart animation
      setRippleKey((prev) => prev + 1);

      // Trigger ripple effect
      setShowRipple(true);
      clickTimersRef.current.ripple = setTimeout(() => setShowRipple(false), 500);

      // Color inversion effect: fade to inverted color and back
      setIsInverted(true);
      clickTimersRef.current.invert = setTimeout(() => setIsInverted(false), 100);

      // Quick press animation
      setIsPressed(true);
      clickTimersRef.current.press = setTimeout(() => setIsPressed(false), 50);
    });

    onClick();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
    // Prevent click event from firing (avoid double-tap)
    if (!disabled) {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <button
      className="relative flex items-center justify-center aspect-square w-full rounded-full focus:outline-none cursor-pointer touch-manipulation overflow-hidden"
      style={{
        backgroundColor: isFlashing ? color.dark : isInverted ? invertedColor : color.base,
        transform: isFlashing ? 'scale(0.95)' : isPressed ? 'scale(0.92)' : 'scale(1)',
        boxShadow: isFlashing
          ? `0 0 35px ${color.bright}, 0 0 15px ${color.dark}, inset 0 0 20px rgba(0,0,0,0.2)`
          : isPressed
            ? `inset 0 2px 8px rgba(0,0,0,0.3)`
            : 'none',
        transition:
          'transform 0.05s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.05s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, background-color, box-shadow',
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      aria-label={`Circle ${index + 1}`}
      type="button"
    >
      {/* Halo effect - more prominent and solid */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          transform: `scale(${1 + haloScale * 0.6})`,
          opacity: haloScale > 0 ? 0.9 - haloScale * 0.7 : 0,
          border: `4px solid ${color.bright}`,
          boxShadow: `0 0 25px ${color.bright}`,
          transition:
            'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, opacity',
        }}
      />
      {/* Inner glow ring for more contrast */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: isFlashing ? 0.6 : 0,
          boxShadow: `inset 0 0 25px ${color.bright}`,
          transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'opacity',
        }}
      />
      {/* Water drop ripple effect */}
      {showRipple && (
        <div
          key={rippleKey}
          className="absolute inset-0 rounded-full pointer-events-none animate-ripple"
          style={{
            backgroundColor: invertedColor,
            mixBlendMode: 'normal',
          }}
        />
      )}
    </button>
  );
};
