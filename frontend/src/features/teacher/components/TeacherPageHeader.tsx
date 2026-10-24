import type { ReactNode } from 'react';

export function TeacherPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="teacher-page-header">
    <div><p className="eyebrow">教員ポータル</p><h1>{title}</h1><p className="teacher-page-description">{description}</p></div>
    {action && <div className="teacher-page-actions">{action}</div>}
  </header>;
}
