import { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../types/game';

const API_BASE = '';

export const useLeaderboard = (_username: string, score: number, gameOver: boolean) => {
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboards = useCallback(async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes] = await Promise.all([
        fetch(`${API_BASE}/api/leaderboard/daily`),
        fetch(`${API_BASE}/api/leaderboard/weekly`),
      ]);

      if (dailyRes.ok && weeklyRes.ok) {
        const daily = await dailyRes.json();
        const weekly = await weeklyRes.json();
        setDailyLeaderboard(daily.entries || []);
        setWeeklyLeaderboard(weekly.entries || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(
    async (finalScore: number) => {
      try {
        await fetch(`${API_BASE}/api/leaderboard/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: finalScore }),
        });
        // Refetch leaderboards after submitting
        await fetchLeaderboards();
      } catch (error) {
        console.error('Error submitting score:', error);
      }
    },
    [fetchLeaderboards]
  );

  // Fetch leaderboards on mount
  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  // Submit score when game is over
  useEffect(() => {
    if (gameOver && score > 0) {
      submitScore(score);
    }
  }, [gameOver, score, submitScore]);

  return {
    dailyLeaderboard,
    weeklyLeaderboard,
    loading,
    refreshLeaderboards: fetchLeaderboards,
  };
};
