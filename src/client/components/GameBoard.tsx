import { Circle } from './Circle';
import { Sparkles } from './Sparkles';

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

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 bg-gradient-to-br from-purple-100/40 to-blue-100/40">
      {/* Personal Best - Top Left */}
      {personalBest > 0 && (
        <div className="absolute top-4 left-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Personal Best</p>
          <p className="text-2xl font-bold text-gray-700">
            {personalBest}
          </p>
        </div>
      )}

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
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-gray-700">
          {isPlayerTurn ? '👆 Your turn!' : '👀 Watch closely...'}
        </p>
      </div>
    </div>
  );
};
