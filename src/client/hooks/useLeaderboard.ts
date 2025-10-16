import { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../types/game';

const API_BASE = '';

export const useLeaderboard = (_username: string, score: number, gameOver: boolean) => {
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboards = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Leaderboard] Fetching leaderboards...');
      const timestamp = Date.now();
      const [dailyRes, weeklyRes, allTimeRes] = await Promise.all([
        fetch(`${API_BASE}/api/leaderboard/daily?t=${timestamp}`, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
        fetch(`${API_BASE}/api/leaderboard/weekly?t=${timestamp}`, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
        fetch(`${API_BASE}/api/leaderboard/alltime?t=${timestamp}`, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
      ]);

      console.log('[Leaderboard] Response statuses:', {
        daily: dailyRes.status,
        weekly: weeklyRes.status,
        allTime: allTimeRes.status,
      });

      if (dailyRes.ok && weeklyRes.ok && allTimeRes.ok) {
        const daily = await dailyRes.json();
        const weekly = await weeklyRes.json();
        const allTime = await allTimeRes.json();
        console.log('[Leaderboard] Data received:', {
          daily: daily.entries?.length || 0,
          weekly: weekly.entries?.length || 0,
          allTime: allTime.entries?.length || 0,
        });
        setDailyLeaderboard(daily.entries || []);
        setWeeklyLeaderboard(weekly.entries || []);
        setAllTimeLeaderboard(allTime.entries || []);
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
        console.log('[Leaderboard] Submitting score:', finalScore);
        const response = await fetch(`${API_BASE}/api/leaderboard/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: finalScore }),
        });
        console.log('[Leaderboard] Submit response status:', response.status);
        const result = await response.json();
        console.log('[Leaderboard] Submit response:', result);
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
    void fetchLeaderboards();
  }, [fetchLeaderboards]);

  // Submit score when game is over
  useEffect(() => {
    if (gameOver && score > 0) {
      void submitScore(score);
    }
  }, [gameOver, score, submitScore]);

  return {
    dailyLeaderboard,
    weeklyLeaderboard,
    allTimeLeaderboard,
    loading,
    refreshLeaderboards: fetchLeaderboards,
  };
};
