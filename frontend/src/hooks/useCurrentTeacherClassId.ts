/**
 * 教員自身の classId を解決する暫定実装。
 * バックエンドに `/teacher/me` 相当のプロフィール取得APIが存在せず、
 * Cognito JWTのクレームにも class_id は含まれていないため、
 * 現時点では開発用の環境変数で代替している。
 * TODO: Cognito統合担当がプロフィール取得APIを実装した後、ここをAPI呼び出しに置き換える。
 */
export function useCurrentTeacherClassId(): string {
  return import.meta.env.VITE_DEV_CLASS_ID ?? 'class-001';
}
