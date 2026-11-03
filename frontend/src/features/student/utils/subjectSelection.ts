import type { DailyCondition } from '../../../api.ts'
import type { StudyPlanWithTasks } from '../../../types/student.ts'

const names: Record<string, string> = {
  japanese: '国語', math: '算数・数学', science: '理科', social: '社会', english: '英語',
}

export function subjectName(id: string): string {
  return Object.hasOwn(names, id) ? names[id] : id
}

export function planMatchesCondition(plan: StudyPlanWithTasks | null, condition: DailyCondition): boolean {
  return plan !== null && plan.available_minutes === condition.available_minutes
    && (!condition.subject_id || plan.subject_id === condition.subject_id)
}
