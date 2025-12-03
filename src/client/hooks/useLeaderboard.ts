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
      console.log('[Leaderboard] Starting leaderboard fetch...');
      console.log('[Leaderboard] Current URL:', window.location.href);
      console.log('[Leaderboard] Origin:', window.location.origin);
      const timestamp = Date.now();
      console.log('[Leaderboard] Timestamp:', timestamp);
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
        console.log('[Leaderboard] Raw data:', { daily, weekly, allTime });
        setDailyLeaderboard(daily.entries || []);
        setWeeklyLeaderboard(weekly.entries || []);
        setAllTimeLeaderboard(allTime.entries || []);
      } else {
        console.error('[Leaderboard] Some requests failed:', {
          daily: { ok: dailyRes.ok, status: dailyRes.status },
          weekly: { ok: weeklyRes.ok, status: weeklyRes.status },
          allTime: { ok: allTimeRes.ok, status: allTimeRes.status },
        });
        // Try to get error messages
        try {
          const dailyError = await dailyRes.text();
          const weeklyError = await weeklyRes.text();
          const allTimeError = await allTimeRes.text();
          console.error('[Leaderboard] Error responses:', {
            daily: dailyError,
            weekly: weeklyError,
            allTime: allTimeError,
          });
        } catch (e) {
          console.error('[Leaderboard] Could not read error responses:', e);
        }
      }
    } catch (error) {
      console.error('[Leaderboard] Error fetching leaderboards:', error);
      if (error instanceof Error) {
        console.error('[Leaderboard] Error message:', error.message);
        console.error('[Leaderboard] Error stack:', error.stack);
      }
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
        console.log(
          '[Leaderboard] Submit response status:',
          response.status,
          response.ok ? 'OK' : 'FAILED'
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Leaderboard] Submit error response:', errorText);
          return;
        }

        const result = await response.json();
        console.log('[Leaderboard] Submit response:', result);

        // Refetch leaderboards after submitting
        console.log('[Leaderboard] Refetching leaderboards after score submission...');
        await fetchLeaderboards();
      } catch (error) {
        console.error('[Leaderboard] Error submitting score:', error);
        if (error instanceof Error) {
          console.error('[Leaderboard] Error message:', error.message);
          console.error('[Leaderboard] Error stack:', error.stack);
        }
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
