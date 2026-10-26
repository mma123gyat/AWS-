import { ProgressEditor } from './ProgressEditor';

export function SchoolProgressForm({ classId }: { classId: string }) {
  return <ProgressEditor kind="school" targetId={classId} />;
}
