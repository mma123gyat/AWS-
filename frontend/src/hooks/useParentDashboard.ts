import { useEffect, useRef, useState } from 'react';
import { getParentDashboard } from '../api/parentApi';
import type { ApiParentDashboard } from '../types/api';

type State = { status: 'loading' } | { status: 'error'; message: string }
  | { status: 'success'; data: ApiParentDashboard; fetchedAt: string };

export function useParentDashboard() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    let active = true;
    const current = version.current;
    getParentDashboard().then(data => {
      if (active && version.current === current) setState({ status: 'success', data, fetchedAt: new Date().toISOString() });
    }).catch(error => {
      if (active && version.current === current) setState({ status: 'error', message: error instanceof Error ? error.message : '学習状況を取得できませんでした。' });
    });
    return () => { active = false; };
  }, [attempt]);
  function refresh() {
    version.current++;
    setState({ status: 'loading' });
    setAttempt(value => value + 1);
  }
  return { state, refresh };
}
