import { useRef, useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { apiGet, apiPost, apiPut } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { PortalFrame } from '../../components/layout/PortalFrame';
import './ClassManagementPage.css';

import { readClassData } from './classManagement';
import type { SchoolClass } from './classManagement';
const load = async () => readClassData(await apiGet<unknown>('/admin/classes'));
const stamp = (value: string) => new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
const operations: Record<string, string> = { CREATE_CLASS: 'クラス作成', UPDATE_CLASS: 'クラス情報変更', MOVE_TEACHER: '教員の担当変更', MOVE_STUDENT: '生徒の所属変更' };

export default function ClassManagementPage({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { state, refetch } = useFetch(load);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');
  const [year, setYear] = useState('');
  const [personId, setPersonId] = useState('');
  const [classId, setClassId] = useState('');
  const [filter, setFilter] = useState('');
  const data = state.status === 'success' ? state.data : null;
  const person = data?.users.find(p => p.user_id === personId);
  const target = data?.classes.find(c => c.class_id === classId);
  const classLabel = (id: string | null | undefined) => data?.classes.find(c => c.class_id === id)?.class_name ?? (id || '未設定');
  async function action(work: () => Promise<unknown>, message: string, reset?: () => void) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); setNotice(message); reset?.(); refetch(); }
    catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした。再読み込みしてください。'); }
    finally { lock.current = false; setBusy(false); }
  }
  function reload() {
    if ((className || grade || year || personId || classId) && !window.confirm('未保存の入力を破棄して再読み込みしますか？')) return;
    setEditing(null); setClassName(''); setGrade(''); setYear(''); setPersonId(''); setClassId(''); refetch();
  }
  return <PortalFrame label="学校管理者ポータル" email={email} links={[{ to: '/admin/classes', label: 'クラス管理' }]} busy={busy} error="" onLogout={() => { void action(async () => { await signOut(); onLogout(); }, ''); }}>
    <div className="class-management">
      <header><p className="eyebrow">学校の登録情報を整える</p><h1>クラス管理</h1><p>教員の担当・生徒の所属と変更履歴を管理します。この環境に登録された学校全体が対象です。</p><button type="button" disabled={busy || state.status === 'loading'} onClick={reload}>再読み込み</button></header>
      {notice && <p role="status" className="success">{notice}</p>}{error && <p role="alert" className="error">{error}</p>}
      {state.status === 'loading' && <p role="status">登録情報を取得しています…</p>}
      {state.status === 'error' && <p role="alert">{state.message}</p>}
      {data && <>
        <section><h2>{editing ? 'クラス情報の変更' : 'クラスを作成する'}</h2><p>名称を変更しても、そのクラスの授業進度と所属は維持されます。</p>
          <form onSubmit={e => { e.preventDefault(); if (!window.confirm(`${editing ? '変更' : '作成'}するクラス：${year}／${grade}／${className}${editing ? `（変更前：${editing.class_name}）` : ''}。保存しますか？`)) return; void action(() => editing ? apiPut(`/admin/classes/${encodeURIComponent(editing.class_id)}`, { className, grade, schoolYear: year, version: editing.version }) : apiPost('/admin/classes', { className, grade, schoolYear: year }), 'クラス情報を保存しました。', () => { setEditing(null); setClassName(''); setGrade(''); setYear(''); }); }}>
            <fieldset disabled={busy}><label htmlFor="class-year">年度</label><input id="class-year" required maxLength={30} value={year} onChange={e => setYear(e.target.value)} placeholder="2026" />
              <label htmlFor="class-grade">学年</label><input id="class-grade" required maxLength={30} value={grade} onChange={e => setGrade(e.target.value)} placeholder="2年" />
              <label htmlFor="class-name">クラス名</label><input id="class-name" required maxLength={100} value={className} onChange={e => setClassName(e.target.value)} placeholder="2年1組" />
              <button type="submit">確認して保存する</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setClassName(''); setGrade(''); setYear(''); }}>編集を取り消す</button>}</fieldset>
          </form>
          <ul>{data.classes.map(c => <li key={c.class_id}><span>{c.school_year}年度／{c.grade}／<strong>{c.class_name}</strong></span><button type="button" className="secondary" disabled={busy} onClick={() => { if ((className || grade || year) && !window.confirm('入力中のクラス情報を破棄して編集しますか？')) return; setEditing(c); setClassName(c.class_name); setGrade(c.grade); setYear(c.school_year); }}>編集</button></li>)}</ul>
        </section>
        <section><h2>担当・所属クラスを変更する</h2><p>教員は担当クラス、生徒は所属クラスを1つ登録できます。教員の変更で生徒が自動移動することはありません。</p><p>生徒の学習記録・理解度・保護者や支援者との紐づけは維持します。移動先の担当教員が過去の学習記録も確認できるようになります。生成済みプランは変更しません。</p>
          <form onSubmit={e => { e.preventDefault(); if (!person || !target || !window.confirm(`${person.name}（${person.role === 'TEACHER' ? '教員' : '生徒'}）の${person.role === 'TEACHER' ? '担当' : '所属'}を「${classLabel(person.class_id)}」から「${target.school_year}年度 ${target.class_name}」へ変更します。保存しますか？`)) return; void action(() => apiPut(`/admin/users/${encodeURIComponent(person.user_id)}/class`, { classId: target.class_id, previousClassId: person.class_id, version: person.version }), '担当・所属クラスを変更しました。対象者の画面は再読み込みしてください。', () => { setPersonId(''); setClassId(''); }); }}>
            <fieldset disabled={busy}><label htmlFor="person-filter">氏名・メールで絞り込む</label><input id="person-filter" value={filter} onChange={e => { setFilter(e.target.value); setPersonId(''); }} />
              <label htmlFor="class-person">変更する方</label><select id="class-person" required value={personId} onChange={e => { setPersonId(e.target.value); setClassId(''); }}><option value="">選択してください</option>{data.users.filter(p => `${p.name} ${p.email}`.toLowerCase().includes(filter.toLowerCase())).map(p => <option key={p.user_id} value={p.user_id}>{p.role === 'TEACHER' ? '教員' : '生徒'}：{p.name}（{p.email}）</option>)}</select>
              {person && <p>変更前：<strong>{classLabel(person.class_id)}</strong></p>}
              <label htmlFor="class-target">変更先クラス</label><select id="class-target" required value={classId} onChange={e => setClassId(e.target.value)}><option value="">選択してください</option>{data.classes.filter(c => c.class_id !== person?.class_id).map(c => <option key={c.class_id} value={c.class_id}>{c.school_year}年度／{c.class_name}</option>)}</select>
              <button type="submit" disabled={!person || !target}>変更内容を確認して保存</button></fieldset>
          </form>
        </section>
        <section><h2>変更履歴</h2><p>新しい100件まで。日時は日本時間です。</p>{data.audits.length === 0 ? <p>まだ変更履歴はありません。</p> : <ol>{data.audits.map(a => <li key={a.audit_id}><div><strong>{operations[a.operation] ?? a.operation}</strong><p>{stamp(a.created_at)}／{a.actor_name || a.actor_id}</p><p>{a.before?.name ?? a.after.class_name}：{a.before ? (a.before.class_name ?? classLabel(a.before.class_id)) : '新規'} → {a.after.class_name ?? classLabel(a.after.class_id)}</p></div></li>)}</ol>}</section>
      </>}
    </div>
  </PortalFrame>;
}
