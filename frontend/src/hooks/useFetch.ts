import { useEffect, useState } from 'react';
import type { FetchState } from '../types/common';

/** loading/success/errorの状態管理を統一するための汎用フック。 */
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '通信エラーが発生しました。';
          setState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}
