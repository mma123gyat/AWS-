import { useEffect, useRef, useState } from 'react';
import { getAiPlanParameters, requestAiPlanAdjustment } from '../../../api/teacherApi';
import { Slider } from '../../../components/ui/Slider';
import type { AiParameterSettings, AiParameters } from '../../../types/teacher';
import { formatLogDate } from '../utils/learningLogs';
import './AiParameterSliders.css';

function checkedSettings(data: AiParameterSettings, studentId: string): AiParameterSettings {
  if (!data || data.studentId !== studentId || !data.params
    || ['difficulty', 'volume', 'supportLevel'].some(key => {
      const value = data.params[key as keyof AiParameters];
      return typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5;
    })) {
    throw new Error('AI提案設定の応答を確認できませんでした。再読み込みしてください。');
  }
  return data;
}

export function AiParameterSliders({ studentId }: { studentId: string }) {
  const [settings, setSettings] = useState<AiParameterSettings | null>(null);
  const [params, setParams] = useState<AiParameters>({ difficulty: 3, volume: 3, supportLevel: 3 });
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const mounted = useRef(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    getAiPlanParameters(studentId).then(data => {
      if (!active) return;
      const value = checkedSettings(data, studentId);
      setSettings(value);
      setParams({ ...value.params });
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : '設定を読み込めませんでした。');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; mounted.current = false; };
  }, [studentId, attempt]);

  function reload() {
    setLoading(true);
    setSettings(null);
    setError('');
    setSaved(false);
    setAttempt(value => value + 1);
  }

  function update(key: keyof AiParameters) {
    return (value: number) => {
      setParams(previous => ({ ...previous, [key]: value }));
      setSaved(false);
      setError('');
    };
  }

  async function handleApply() {
    if (submitting.current || loading || !settings) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const value = checkedSettings(await requestAiPlanAdjustment(studentId, { ...params }), studentId);
      if (mounted.current) {
        setSettings(value);
        setParams({ ...value.params });
        setSaved(true);
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : '設定を保存できませんでした。');
    } finally {
      submitting.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return (
    <div className="ai-parameter-settings space-y-4">
      <p className="text-sm text-gray-600">設定は、保存後に開始する新規プラン生成に反映されます。生成済みのプランや完了記録は変わりません。時間を戻して復元するプランも同じ内容を使います。</p>
      {loading ? <p role="status" className="text-sm text-gray-500">設定を読み込み中…</p> : settings ? (
        <>
          <fieldset disabled={saving} className="space-y-4">
            <legend className="sr-only">生徒のAI提案設定</legend>
            <Slider label="難易度" value={params.difficulty} onChange={update('difficulty')} />
            <p className="text-xs text-gray-500">1：基礎中心 ／ 3：標準 ／ 5：応用に挑戦</p>
            <Slider label="学習量" value={params.volume} onChange={update('volume')} />
            <p className="text-xs text-gray-500">1〜2：少なめ ／ 3：標準 ／ 4〜5：確認を多めに。少なめでは取り組む時間を短くし、多めでも生徒が選んだ時間は超えません。</p>
            <Slider label="サポートの強さ" value={params.supportLevel} onChange={update('supportLevel')} />
            <p className="text-xs text-gray-500">1：簡潔に ／ 3：要点を説明 ／ 5：手順やヒントを丁寧に</p>
          </fieldset>
          <p className="text-xs text-gray-500">{settings.updatedAt ? `最終保存：${formatLogDate(settings.updatedAt)}（日本時間）` : '未設定のため、標準値を表示しています。'}</p>
          <button type="button" onClick={handleApply} disabled={saving} className="ai-parameter-button ai-parameter-save">{saving ? '保存中…' : '設定を保存'}</button>
          {saved && <p className="text-sm text-green-700" role="status">設定を保存しました。次の新規プラン生成から反映されます。</p>}
        </>
      ) : <button type="button" className="ai-parameter-button" onClick={reload}>設定を再読み込み</button>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
