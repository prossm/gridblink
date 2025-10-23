import { useState, useEffect } from 'react';
import { Leaderboard } from './Leaderboard';
import { LeaderboardEntry, LeaderboardType } from '../types/game';

interface GameOverProps {
  score: number;
  onPlayAgain: () => void;
  username: string;
  dailyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  allTimeLeaderboard: LeaderboardEntry[];
}

export const GameOver = ({
  score,
  onPlayAgain,
  username,
  dailyLeaderboard,
  weeklyLeaderboard,
  allTimeLeaderboard,
}: GameOverProps) => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('daily');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const isChampion = score >= 200;

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscribe/status');
        const data = await response.json();
        setIsSubscribed(data.isSubscribed || false);
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    void checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    if (isSubscribing || isSubscribed) return;

    setIsSubscribing(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
      } else {
        console.error('Failed to subscribe:', data.message);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

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

        {/* Subscribe Button - Hidden until app is published and permission is approved */}
        {/* Uncomment after public launch when SUBSCRIBE_TO_SUBREDDIT permission is granted */}
        {/* {!isSubscribed && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="mt-3 px-6 py-2 text-sm font-semibold text-purple-600 bg-white border-2 border-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubscribing ? 'Subscribing...' : '🔔 Subscribe for Daily Games'}
          </button>
        )}
        {isSubscribed && (
          <div className="mt-3 px-6 py-2 text-sm font-semibold text-green-600 bg-green-50 border-2 border-green-600 rounded-full shadow-md">
            ✓ Subscribed!
          </div>
        )} */}
      </div>

      {/* Leaderboard */}
      <div className="w-full mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Leaderboard</h2>
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
