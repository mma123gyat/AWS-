import { useEffect, useRef, useState } from 'react';
import { getStudents } from '../../api/teacherApi';
import type { ApiStudentSummary } from '../../types/api';
import type { FetchState } from '../../types/common';

type Snapshot = { students: ApiStudentSummary[]; fetchedAt: number };

export function useTeacherStudents() {
  const [state, setState] = useState<FetchState<Snapshot>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);

  useEffect(() => {
    let active = true;
    const currentVersion = version.current;
    getStudents().then(students => {
      if (!active || version.current !== currentVersion) return;
      const ids = new Set<string>();
      if (!Array.isArray(students) || students.some(student => {
        if (!student || typeof student.studentId !== 'string' || !student.studentId.trim() || ids.has(student.studentId)) return true;
        ids.add(student.studentId);
        return false;
      })) throw new Error('生徒一覧の応答形式を確認できませんでした。再読み込みしてください。');
      setState({ status: 'success', data: { students: students.map(student => ({ ...student, name: typeof student.name === 'string' ? student.name : null })), fetchedAt: Date.now() } });
    }).catch(error => {
      if (active && version.current === currentVersion) {
        setState({ status: 'error', message: error instanceof Error ? error.message : '通信エラーが発生しました。' });
      }
    });
    return () => { active = false; };
  }, [attempt]);

  function refresh() {
    version.current += 1;
    setState({ status: 'loading' });
    setAttempt(value => value + 1);
  }

  return { state, refresh };
}
