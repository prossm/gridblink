import { useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { LeaderboardEntry, LeaderboardType } from '../types/game';
import { HiArrowPath } from 'react-icons/hi2';

interface GameOverProps {
  score: number;
  onPlayAgain: () => void;
  username: string;
  dailyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  allTimeLeaderboard: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
}

export const GameOver = ({
  score,
  onPlayAgain,
  username,
  dailyLeaderboard,
  weeklyLeaderboard,
  allTimeLeaderboard,
  loading,
  onRefresh,
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
          className="mt-4 px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          Play Again
        </button>
      </div>

      {/* Leaderboard */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Leaderboard</h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh leaderboard"
            type="button"
          >
            <HiArrowPath className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <Leaderboard
          entries={
            leaderboardType === 'daily'
              ? dailyLeaderboard
              : leaderboardType === 'weekly'
                ? weeklyLeaderboard
                : allTimeLeaderboard
          }
          currentUsername={username}
          currentScore={score}
          type={leaderboardType}
          onTypeChange={setLeaderboardType}
        />
      </div>
    </div>
  );
};
