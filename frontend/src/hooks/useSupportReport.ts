import { useEffect, useRef, useState } from 'react';
import { getSupportReport } from '../api/supportApi';
import type { ApiSupportReport } from '../types/api';

type State = { status: 'loading' } | { status: 'error'; message: string }
  | { status: 'success'; data: ApiSupportReport; fetchedAt: string };

export function useSupportReport() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    let active = true;
    const current = version.current;
    getSupportReport().then(data => {
      if (active && version.current === current) setState({ status: 'success', data, fetchedAt: new Date().toISOString() });
    }).catch(error => {
      if (active && version.current === current) setState({ status: 'error', message: error instanceof Error ? error.message : 'レポートを取得できませんでした。' });
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
