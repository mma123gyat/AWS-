import { ProgressEditor } from './ProgressEditor';

export function StudentProgressForm({ studentId }: { studentId: string }) {
  return <ProgressEditor kind="student" targetId={studentId} />;
}
