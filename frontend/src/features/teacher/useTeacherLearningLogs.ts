import { useCallback, useEffect, useRef, useState } from 'react';
import { getStudents, getTeacherLearningLogs } from '../../api/teacherApi';
import type { ApiStudentSummary, ApiTeacherLearningLogs } from '../../types/api';
import type { FetchState } from '../../types/common';
import { latestLearningRecords } from './utils/learningLogs';

type LogState = { status: 'idle' } | (FetchState<ApiTeacherLearningLogs> & { studentId: string });

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '通信エラーが発生しました。もう一度お試しください。';
}

export function useTeacherLearningLogs() {
  const [students, setStudents] = useState<FetchState<ApiStudentSummary[]>>({ status: 'loading' });
  const [studentAttempt, setStudentAttempt] = useState(0);
  const [studentId, setStudentId] = useState('');
  const [logs, setLogs] = useState<LogState>({ status: 'idle' });
  const [logAttempt, setLogAttempt] = useState(0);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    getStudents().then(data => {
      if (active) setStudents({ status: 'success', data });
    }).catch(error => {
      if (active) setStudents({ status: 'error', message: errorMessage(error) });
    });
    return () => { active = false; };
  }, [studentAttempt]);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    const version = requestVersion.current;
    getTeacherLearningLogs(studentId).then(data => {
      if (!active || requestVersion.current !== version) return;
      if (
        !data || data.studentId !== studentId || !Array.isArray(data.recentRecords)
        || data.recentRecords.some(record => !record || typeof record !== 'object')
      ) {
        throw new Error('学習記録の応答形式を確認できませんでした。再読み込みしてください。');
      }
      setLogs({ status: 'success', studentId, data: {
        ...data, name: typeof data.name === 'string' ? data.name : null,
        recentRecords: latestLearningRecords(data.recentRecords),
      } });
    }).catch(error => {
      if (active && requestVersion.current === version) {
        setLogs({ status: 'error', studentId, message: errorMessage(error) });
      }
    });
    return () => { active = false; };
  }, [studentId, logAttempt]);

  const selectStudent = useCallback((id: string) => {
    requestVersion.current += 1;
    setStudentId(id);
    setLogs(id ? { status: 'loading', studentId: id } : { status: 'idle' });
    setLogAttempt(attempt => attempt + 1);
  }, []);

  const refreshLogs = useCallback(() => {
    if (studentId) selectStudent(studentId);
  }, [studentId, selectStudent]);

  const retryStudents = useCallback(() => {
    setStudents({ status: 'loading' });
    setStudentAttempt(attempt => attempt + 1);
  }, []);

  // Keep results bound to the selected student, even between render and
  // effect cleanup. The version also invalidates an earlier request on retry.
  const currentLogs: LogState = 'studentId' in logs && logs.studentId !== studentId
    ? { status: 'loading', studentId }
    : logs;

  return { students, studentId, logs: currentLogs, selectStudent, refreshLogs, retryStudents };
}
