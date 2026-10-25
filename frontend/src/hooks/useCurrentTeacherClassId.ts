import { useEffect, useRef, useState } from 'react';
import { getTeacherProfile } from '../api/teacherApi';
import type { ApiTeacherProfile } from '../types/api';
import type { FetchState } from '../types/common';

/** Never infer a class from build-time configuration or a default ID. */
export function useCurrentTeacherClassId() {
  const [state, setState] = useState<FetchState<ApiTeacherProfile>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    let active = true;
    const current = version.current;
    getTeacherProfile().then(data => {
      if (active && version.current === current) setState({ status: 'success', data });
    }).catch(error => {
      if (active && version.current === current) setState({ status: 'error', message: error instanceof Error ? error.message : '担当クラスを取得できませんでした。' });
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
