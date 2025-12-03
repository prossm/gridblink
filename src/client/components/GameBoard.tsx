import { Circle } from './Circle';
import { Sparkles } from './Sparkles';
import { useSound } from '../hooks/useSound';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';

interface GameBoardProps {
  flashingCircle: number | null;
  onCircleClick: (index: number) => void;
  isPlayerTurn: boolean;
  showSparkles: boolean;
  score: number;
  personalBest: number;
}

export const GameBoard = ({
  flashingCircle,
  onCircleClick,
  isPlayerTurn,
  showSparkles,
  score,
  personalBest,
}: GameBoardProps) => {
  const { isSoundEnabled, toggleSound } = useSound();

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 bg-gradient-to-br from-purple-100/40 to-blue-100/40">
      {/* Personal Best - Top Left */}
      {personalBest > 0 && (
        <div className="absolute top-4 left-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Personal Best</p>
          <p className="text-2xl font-bold text-gray-700">{personalBest}</p>
        </div>
      )}

      {/* Sound Toggle - Top Right */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
        aria-label={isSoundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        type="button"
      >
        {isSoundEnabled ? (
          <HiSpeakerWave className="w-6 h-6 text-gray-700" />
        ) : (
          <HiSpeakerXMark className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Score display */}
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600 mb-1">Score</p>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          {score}
        </p>
      </div>

      {/* Sparkles celebration area */}
      <div className="relative w-full max-w-md mb-2 h-12">
        <Sparkles show={showSparkles} />
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[min(400px,90vw)] aspect-square p-4">
        {Array.from({ length: 9 }, (_, i) => (
          <Circle
            key={i}
            index={i}
            isFlashing={flashingCircle === i}
            onClick={() => onCircleClick(i)}
            disabled={!isPlayerTurn}
          />
        ))}
      </div>

      {/* Turn indicator */}
      <div className="mt-4 flex justify-center">
        <div
          className="px-6 py-3 bg-white rounded-xl shadow-lg"
          style={{
            boxShadow: isPlayerTurn
              ? '0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -4px rgba(34, 197, 94, 0.3)'
              : '0 10px 15px -3px rgba(234, 179, 8, 0.3), 0 4px 6px -4px rgba(234, 179, 8, 0.3)',
          }}
        >
          <p className="text-lg font-bold flex items-center gap-2">
            <span>{isPlayerTurn ? '☝' : '👀'}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              {isPlayerTurn ? 'Your turn!' : 'Watch closely...'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
