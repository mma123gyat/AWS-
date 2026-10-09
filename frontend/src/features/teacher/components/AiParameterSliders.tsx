import { useState } from 'react';
import { Slider } from '../../../components/ui/Slider';
import type { AiParameters } from '../../../types/teacher';

const DEFAULT_PARAMS: AiParameters = { difficulty: 3, volume: 3, supportLevel: 3 };

export function AiParameterSliders({
  onApply,
}: {
  onApply: (params: AiParameters) => Promise<void>;
}) {
  const [params, setParams] = useState<AiParameters>(DEFAULT_PARAMS);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const update = (key: keyof AiParameters) => (value: number) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const handleApply = async () => {
    setStatus('submitting');
    try {
      await onApply(params);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <Slider label="難易度" value={params.difficulty} onChange={update('difficulty')} />
      <Slider label="学習量" value={params.volume} onChange={update('volume')} />
      <Slider label="サポートの強さ" value={params.supportLevel} onChange={update('supportLevel')} />
      <button
        type="button"
        onClick={handleApply}
        disabled={status === 'submitting'}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === 'submitting' ? '適用中...' : '適用'}
      </button>
      {status === 'success' && (
        <p className="text-sm text-green-700">AI提案パラメータを適用しました。</p>
      )}
      {status === 'error' && <p className="text-sm text-red-700">適用に失敗しました。</p>}
    </div>
  );
}
