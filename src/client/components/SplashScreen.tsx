interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen = ({ onStart }: SplashScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-8 max-w-md">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
          Gridblink
        </h1>

        <p className="text-lg text-center text-gray-700 dark:text-gray-300 leading-relaxed">
          Test your memory and reflexes! Match the sequence of flashing circles and compete on the leaderboard.
        </p>

        <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 w-full">
          <div className="flex items-start gap-2">
            <span className="text-xl">🎵</span>
            <p>Each circle plays a unique musical tone</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🧠</span>
            <p>Sequences grow longer with each round</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🏆</span>
            <p>Climb the daily and weekly leaderboards</p>
          </div>
        </div>

        <button
          onClick={onStart}
          className="mt-4 px-12 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
        >
          Start Playing
        </button>
      </div>
    </div>
  );
};
