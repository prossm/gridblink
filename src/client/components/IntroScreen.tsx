import { useState, useEffect, useRef } from 'react';
import type { GameSpeed } from '../hooks/useGame';

interface IntroScreenProps {
  onStart: () => void;
  gameSpeed: GameSpeed;
  onGameSpeedChange: (speed: GameSpeed) => void;
}

export const IntroScreen = ({ onStart, gameSpeed, onGameSpeedChange }: IntroScreenProps) => {
  const [isSpeedDropdownOpen, setIsSpeedDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSpeedDropdownOpen(false);
      }
    };

    if (isSpeedDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSpeedDropdownOpen]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-purple-100/40 to-blue-100/40">
      <div className="flex flex-col items-center gap-8 max-w-md">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 leading-tight pb-2">
          gridblink
        </h1>

        <p className="text-xl text-center text-gray-800 font-semibold -mt-4">Test your memory!</p>

        <div className="flex flex-col gap-4 text-base text-gray-700 w-full">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🟣</span>
            <p>Match the sequence of tones</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <p>Sequences grow longer with each round</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <p>Beat your personal best</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <p>Climb the daily and weekly leaderboards</p>
          </div>
        </div>

        <button
          onClick={onStart}
          className="mt-4 px-12 py-2 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          Start Playing
        </button>

        {/* Game Speed Selector */}
        <div className="mt-4 mb-12 flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Game Speed:</label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSpeedDropdownOpen(!isSpeedDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>{gameSpeed}x</span>
              <span className="text-xs">{isSpeedDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {isSpeedDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg overflow-hidden z-10 min-w-[140px]">
                {([1, 1.5, 2] as GameSpeed[]).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      onGameSpeedChange(speed);
                      setIsSpeedDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                      speed === gameSpeed
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {speed}x {speed === 1 ? '(Normal)' : speed === 1.5 ? '(Fast)' : '(Very Fast)'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
