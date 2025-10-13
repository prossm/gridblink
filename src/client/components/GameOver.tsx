import { useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { LeaderboardEntry, LeaderboardType } from '../types/game';

interface GameOverProps {
  score: number;
  onPlayAgain: () => void;
  username: string;
  dailyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
}

export const GameOver = ({
  score,
  onPlayAgain,
  username,
  dailyLeaderboard,
  weeklyLeaderboard,
}: GameOverProps) => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('daily');
  const isChampion = score >= 200;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 bg-gradient-to-br from-purple-50 to-blue-50 overflow-y-auto">
      {/* Game Over Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
          {isChampion ? 'Ultimate Champion!' : 'Game Over'}
        </h1>

        {isChampion && (
          <p className="text-xl text-purple-600 mb-4">
            You reached the maximum sequence of 200!
          </p>
        )}

        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">Your Score</p>
          <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            {score}
          </p>
        </div>

        <button
          onClick={onPlayAgain}
          className="mt-4 px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
        >
          Play Again
        </button>
      </div>

      {/* Leaderboard */}
      <div className="w-full mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Leaderboard</h2>
        <Leaderboard
          entries={leaderboardType === 'daily' ? dailyLeaderboard : weeklyLeaderboard}
          currentUsername={username}
          currentScore={score}
          type={leaderboardType}
          onTypeChange={setLeaderboardType}
        />
      </div>
    </div>
  );
};
