import { fetchAuthSession } from 'aws-amplify/auth'

const rawApiBase = import.meta.env.VITE_API_BASE_URL

if (!rawApiBase) {
  throw new Error('VITE_API_BASE_URL が設定されていません。frontend/.env を確認してください。')
}

const API_BASE = rawApiBase.replace(/\/+$/, '')

export type AvailableMinutes = 0 | 5 | 15 | 30

export type DailyCondition = {
  condition_id: string
  student_id: string
  date: string
  available_minutes: AvailableMinutes
  subject_id?: string
  created_at: string
}

export async function saveCondition(
  availableMinutes: AvailableMinutes,
  subjectId?: string,
): Promise<DailyCondition> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()

  if (!token) {
    throw new Error('ログインし直してください。')
  }

  const response = await fetch(`${API_BASE}/students/me/condition`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availableMinutes, ...(availableMinutes > 0 && subjectId ? { subjectId } : {}) }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('ログインし直してください。')
    }
    if (response.status === 403) {
      throw new Error('生徒アカウントでログインしてください。')
    }
    const result = await response.json().catch(() => null)
    throw new Error(result?.error?.message ?? `学習時間を登録できませんでした（${response.status}）。`)
  }

  const result = await response.json()

  if (
    result.success !== true ||
    result.data?.available_minutes !== availableMinutes
  ) {
    throw new Error('登録結果を確認できませんでした。')
  }

  if (availableMinutes > 0 && subjectId && result.data.subject_id !== subjectId) {
    throw new Error('教科の登録結果を確認できませんでした。教科選択に対応したAPIへ更新されているか確認してください。')
  }
  return result.data as DailyCondition
}
