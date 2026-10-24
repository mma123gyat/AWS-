import type { ReactNode } from 'react';

export function TeacherEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="teacher-empty" role="status">
    <span className="teacher-empty-mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg></span>
    <p className="teacher-empty-title">{title}</p><p>{description}</p>{action}
  </div>;
}
