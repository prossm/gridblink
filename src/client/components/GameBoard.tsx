import { Circle } from './Circle';
import { Sparkles } from './Sparkles';

interface GameBoardProps {
  flashingCircle: number | null;
  onCircleClick: (index: number) => void;
  isPlayerTurn: boolean;
  showSparkles: boolean;
  score: number;
}

export const GameBoard = ({
  flashingCircle,
  onCircleClick,
  isPlayerTurn,
  showSparkles,
  score,
}: GameBoardProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Score display */}
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-600 mb-1">Score</p>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          {score}
        </p>
      </div>

      {/* Sparkles celebration area */}
      <div className="relative w-full max-w-md mb-4 h-12">
        <Sparkles show={showSparkles} />
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md aspect-square p-4">
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
      <div className="mt-8 text-center">
        <p className="text-lg text-gray-700">
          {isPlayerTurn ? 'Your turn!' : 'Watch closely...'}
        </p>
      </div>
    </div>
  );
};
