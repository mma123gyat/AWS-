import { useState } from 'react';
import { mathSteps } from '../../math/catalog';
import { getMathStepsForTask } from '../../math/mathMaterials';

const grades = [...new Set(mathSteps.map(step => step.grade))];
const controlClass = 'w-full rounded-md border border-gray-300 px-3 py-2';

/** Keep the saved/draft name as the source of truth, including legacy names. */
export function ProgressUnitField({ id, subjectId, value, onChange }: {
  id: string; subjectId: string; value: string; onChange: (value: string) => void;
}) {
  const [manual, setManual] = useState(false);
  const math = subjectId === 'math';
  const exact = mathSteps.find(step => step.unit === value);
  const selected = exact ? String(exact.id) : value ? 'current' : '';
  const supported = math && getMathStepsForTask({ subject_id: subjectId, unit_name: value }).length > 0;

  return <div>
    <label htmlFor={`${id}-unit`} className="mb-1 block text-sm font-medium">単元名</label>
    {math && !manual ? <>
      <select id={`${id}-unit`} required value={selected} aria-describedby={`${id}-unit-hint ${id}-material-hint`}
        onChange={event => {
          const choice = event.target.value;
          if (choice === 'manual') { setManual(true); return; }
          const step = mathSteps.find(candidate => String(candidate.id) === choice);
          if (step) onChange(step.unit);
        }} className={controlClass}>
        <option value="" disabled>数学の単元を選んでください</option>
        {value && !exact && <option value="current">現在の入力：{value}</option>}
        {grades.map(grade => <optgroup key={grade} label={grade}>
          {mathSteps.filter(step => step.grade === grade).map(step => <option key={step.id} value={String(step.id)}>{step.unit}</option>)}
        </optgroup>)}
        <option value="manual">一覧にない単元を入力する</option>
      </select>
      <p id={`${id}-unit-hint`} className="text-xs text-gray-500">中1〜中3の数学教材から選べます。選ぶと単元名が入力されます。</p>
    </> : <>
      <input id={`${id}-unit`} aria-describedby={`${id}-unit-hint${math ? ` ${id}-material-hint` : ''}`} required value={value}
        onChange={event => onChange(event.target.value)} className={controlClass} />
      <p id={`${id}-unit-hint`} className="text-xs text-gray-500">単元名は200文字以内で入力してください。</p>
      {math && <button type="button" onClick={() => setManual(false)} className="teacher-inline-link">教材一覧から選ぶ</button>}
    </>}
    {math && <p id={`${id}-material-hint`} className="text-xs text-gray-500" role="status">
      {value ? supported ? 'この単元は数学教材に対応しています。' : '現在の単元に対応する数学教材はありません。教材を使う場合は一覧から選んでください。' : '教材に対応する単元を選ぶと、生成する生徒の数学課題に教材リンクを表示できます。'}
      {' '}教材リンクは生徒の現在地の単元に従います。保存後に新しく作るプランへ反映され、作成済みのプランは変わりません。
    </p>}
  </div>;
}
