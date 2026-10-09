import { fetchAuthSession } from 'aws-amplify/auth'

const rawApiBase = import.meta.env.VITE_API_BASE_URL

if (!rawApiBase) {
  throw new Error('VITE_API_BASE_URL が設定されていません。')
}

const API_BASE = rawApiBase.replace(/\/$/, '')

export type AvailableMinutes = 0 | 5 | 15 | 30

export type DailyCondition = {
  condition_id: string
  student_id: string
  date: string
  available_minutes: AvailableMinutes
  created_at: string
}

export async function saveCondition(
  availableMinutes: AvailableMinutes,
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
    body: JSON.stringify({ availableMinutes }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('ログインし直してください。')
    }
    if (response.status === 403) {
      throw new Error('生徒アカウントでログインしてください。')
    }
    throw new Error(`学習時間を登録できませんでした（${response.status}）。`)
  }

  const result = await response.json()

  if (
    result.success !== true ||
    result.data?.available_minutes !== availableMinutes
  ) {
    throw new Error('登録結果を確認できませんでした。')
  }

  return result.data as DailyCondition
}