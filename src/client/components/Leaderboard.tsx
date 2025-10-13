import { useState, useEffect, useRef } from 'react';
import { LeaderboardEntry, LeaderboardType } from '../types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
  currentScore: number;
  type: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}

export const Leaderboard = ({
  entries,
  currentUsername,
  currentScore,
  type,
  onTypeChange,
}: LeaderboardProps) => {
  const [userRank, setUserRank] = useState<number | null>(null);
  const userEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find user's rank
    const rank = entries.findIndex((entry) => entry.username === currentUsername);
    setUserRank(rank >= 0 ? rank + 1 : null);
  }, [entries, currentUsername]);

  const isUserInTop10 = userRank !== null && userRank <= 10;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => onTypeChange('daily')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            type === 'daily'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => onTypeChange('weekly')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            type === 'weekly'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          7-Day
        </button>
      </div>

      {/* User's current position (if not in top 10) */}
      {!isUserInTop10 && userRank && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-purple-700">#{userRank}</span>
              <span className="font-semibold text-gray-800">{currentUsername}</span>
            </div>
            <span className="text-2xl font-bold text-purple-700">{currentScore}</span>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No scores yet. Be the first!
          </div>
        ) : (
          entries.slice(0, 50).map((entry, index) => {
            const isCurrentUser = entry.username === currentUsername;
            const rank = index + 1;

            return (
              <div
                key={`${entry.username}-${entry.timestamp}`}
                ref={isCurrentUser ? userEntryRef : null}
                className={`flex items-center justify-between p-4 border-b border-gray-100 ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-l-purple-500'
                    : rank <= 3
                    ? 'bg-yellow-50'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      rank === 1
                        ? 'text-yellow-500'
                        : rank === 2
                        ? 'text-gray-400'
                        : rank === 3
                        ? 'text-orange-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </span>
                  <span
                    className={`font-semibold ${
                      isCurrentUser ? 'text-purple-700' : 'text-gray-800'
                    }`}
                  >
                    {entry.username}
                  </span>
                </div>
                <span className={`text-xl font-bold ${isCurrentUser ? 'text-purple-700' : 'text-gray-700'}`}>
                  {entry.score}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
