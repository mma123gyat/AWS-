import { useCallback, useEffect, useState } from 'react';
import type { FetchState } from '../types/common';

const LOADING = { status: 'loading' } as const;

/** Use a stable fetcher. A different fetcher or refresh hides the old result immediately. */
export function useFetch<T>(fetcher: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    fetcher: () => Promise<T>; attempt: number; state: FetchState<T>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      let state: FetchState<T>;
      try {
        state = { status: 'success', data: await fetcher() };
      } catch (error) {
        state = { status: 'error', message: error instanceof Error ? error.message : '通信エラーが発生しました。' };
      }
      if (active) setResult({ fetcher, attempt, state });
    }
    void load();
    return () => { active = false; };
  }, [fetcher, attempt]);

  const refetch = useCallback(() => setAttempt(value => value + 1), []);
  const state = result?.fetcher === fetcher && result.attempt === attempt ? result.state : LOADING;
  return { state, refetch };
}
