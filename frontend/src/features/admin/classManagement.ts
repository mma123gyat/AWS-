export type SchoolClass = { class_id: string; class_name: string; grade: string; school_year: string; version: number };
export type Person = { user_id: string; name: string; email: string; role: 'TEACHER' | 'STUDENT'; class_id: string | null; version: number };
export type Audit = { audit_id: string; created_at: string; actor_name: string; actor_id: string; operation: string; target_id: string; before: Record<string, string | null> | null; after: Record<string, string | null> };
export type ClassData = { classes: SchoolClass[]; users: Person[]; audits: Audit[] };
export function readClassData(value: unknown): ClassData {
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const text = (v: unknown): v is string => typeof v === 'string';
  const version = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  const snapshot = (v: unknown) => obj(v) && Object.values(v).every(x => x === null || text(x));
  if (!obj(value) || !Array.isArray(value.classes) || !Array.isArray(value.users) || !Array.isArray(value.audits)
    || !value.classes.every(c => obj(c) && ['class_id', 'class_name', 'grade', 'school_year'].every(k => text(c[k])) && version(c.version))
    || !value.users.every(u => obj(u) && ['user_id', 'name', 'email'].every(k => text(u[k])) && (u.role === 'TEACHER' || u.role === 'STUDENT') && (u.class_id === null || text(u.class_id)) && version(u.version))
    || !value.audits.every(a => obj(a) && ['audit_id', 'created_at', 'actor_name', 'actor_id', 'operation', 'target_id'].every(k => text(a[k])) && Number.isFinite(Date.parse(a.created_at as string)) && (a.before === null || snapshot(a.before)) && snapshot(a.after))) {
    throw new Error('クラス管理の応答を確認できません。再読み込みしてください。');
  }
  return value as ClassData;
}
