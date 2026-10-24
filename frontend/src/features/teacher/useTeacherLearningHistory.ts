import { useEffect, useRef, useState } from 'react';
import { getTeacherLearningHistory } from '../../api/teacherApi';
import type { FetchState } from '../../types/common';
import type { LearningHistory } from '../../types/learningHistory';

export function useTeacherLearningHistory(studentId: string) {
  const [state, setState] = useState<FetchState<LearningHistory>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);

  useEffect(() => {
    let active = true;
    const current = version.current;
    getTeacherLearningHistory(studentId).then(data => {
      if (active && version.current === current) setState({ status: 'success', data });
    }).catch(error => {
      if (active && version.current === current) setState({ status: 'error', message: error instanceof Error ? error.message : '学習履歴を読み込めませんでした。' });
    });
    return () => { active = false; };
  }, [studentId, attempt]);

  function refresh() {
    version.current += 1;
    setState({ status: 'loading' });
    setAttempt(value => value + 1);
  }

  return { state, refresh };
}
