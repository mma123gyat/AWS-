// バックエンド未接続でもUIを確認できるようにするための開発用モックデータ。
// VITE_USE_MOCK=true のときのみ api/parentApi.ts から利用される。
import type { ApiParentDashboard } from '../../../types/api';

export const mockParentDashboard: ApiParentDashboard = {
  studentName: 'テスト生徒',
  weeklyStudyMinutes: 75,
  studiedDays: 4,
  recordCount: 5,
  badges: [
    { id: 'streak_3', label: '3日継続', earned: true },
    { id: 'streak_5', label: '5日継続', earned: false },
    { id: 'understanding_up', label: '理解度アップ', earned: true },
    { id: 'hour_challenge', label: '1時間チャレンジ', earned: true },
  ],
  messages: [
    {
      message_id: 'mock-message-1',
      student_id: 'student-001',
      sort_key: `${new Date().toISOString()}#mock-message-1`,
      sender_user_id: 'mock-support-1',
      sender_role: 'SUPPORT',
      body: '最近、数学に継続して取り組めています。この調子で見守っていきましょう。',
      created_at: new Date().toISOString(),
    },
  ],
};
