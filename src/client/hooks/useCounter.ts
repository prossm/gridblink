import { useCallback, useEffect, useState } from 'react';
import type { InitResponse, IncrementResponse, DecrementResponse } from '../../shared/types/api';

interface CounterState {
  count: number;
  username: string | null;
  personalBest: number;
  loading: boolean;
}

export const useCounter = () => {
  const [state, setState] = useState<CounterState>({
    count: 0,
    username: null,
    personalBest: 0,
    loading: true,
  });
  const [postId, setPostId] = useState<string | null>(null);

  // fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[Init] Starting initialization...');
        console.log('[Init] Current URL:', window.location.href);
        console.log('[Init] Origin:', window.location.origin);
        console.log('[Init] Pathname:', window.location.pathname);
        console.log('[Init] Fetching initial data from /api/init...');

        const res = await fetch('/api/init');
        console.log('[Init] Response status:', res.status, res.ok ? 'OK' : 'FAILED');

        if (!res.ok) {
          const errorText = await res.text();
          console.error('[Init] Error response:', errorText);
          throw new Error(`HTTP ${res.status}`);
        }

        const data: InitResponse = await res.json();
        console.log('[Init] Received data:', data);

        if (data.type !== 'init') {
          console.error('[Init] Unexpected response type:', data.type);
          throw new Error('Unexpected response');
        }

        console.log('[Init] Setting state with:', {
          count: data.count,
          username: data.username,
          personalBest: data.personalBest,
        });

        setState({
          count: data.count,
          username: data.username,
          personalBest: data.personalBest,
          loading: false,
        });
        setPostId(data.postId);

        console.log('[Init] Initialization complete');
      } catch (err) {
        console.error('[Init] Failed to init counter:', err);
        if (err instanceof Error) {
          console.error('[Init] Error message:', err.message);
          console.error('[Init] Error stack:', err.stack);
        }
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    void init();
  }, []);

  const update = useCallback(
    async (action: 'increment' | 'decrement') => {
      if (!postId) {
        console.error('No postId – cannot update counter');
        return;
      }
      try {
        const res = await fetch(`/api/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: IncrementResponse | DecrementResponse = await res.json();
        setState((prev) => ({ ...prev, count: data.count }));
      } catch (err) {
        console.error(`Failed to ${action}`, err);
      }
    },
    [postId]
  );

  const increment = useCallback(() => update('increment'), [update]);
  const decrement = useCallback(() => update('decrement'), [update]);

  return {
    ...state,
    increment,
    decrement,
  } as const;
};
