import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LearningHistory } from '../../../types/learningHistory';
import { formatHistoryDate } from '../utils/learningHistory';
import { formatLogDate, formatSubject, formatUnderstanding } from '../utils/learningLogs';

const shortDate = (value: string) => value.slice(5).replace('-', '/');

export function ProgressChart({ history }: { history: LearningHistory }) {
  const [subjectKey, setSubjectKey] = useState('');
  const selected = history.subjects.find(subject => JSON.stringify(subject.subjectId) === subjectKey) ?? history.subjects[0];
  const hasUnknownTime = history.totalMinutes === null;
  return (
    <div className="space-y-5">
      <p className="text-sm font-medium">{history.name?.trim() || '名前未設定'}さんの学習記録</p>
      <p className="text-sm text-gray-600">対象期間：{formatHistoryDate(history.startDate)}〜{formatHistoryDate(history.endDate)}（日本時間）</p>
      <p className="text-xs text-gray-500">取得日時：{formatLogDate(history.generatedAt)}（日本時間）。この期間の全記録を集計しています。</p>
      <dl className="flex flex-wrap gap-6 rounded-lg bg-gray-50 p-4">
        <div><dt className="text-sm text-gray-600">記録された学習時間</dt><dd className="text-xl font-semibold">{history.totalMinutes === null ? '集計できません' : `${history.totalMinutes}分`}</dd></div>
        <div><dt className="text-sm text-gray-600">学習記録</dt><dd className="text-xl font-semibold">{history.recordCount}件</dd></div>
      </dl>
      {history.unassignedRecordCount > 0 && <p role="status" className="text-sm text-amber-800">日時を確認できない記録が{history.unassignedRecordCount}件あるため、学習時間は表示していません。</p>}
      {hasUnknownTime && history.unassignedRecordCount === 0 && <p role="status" className="text-sm text-amber-800">学習時間を確認できない記録があります。該当日の時間と期間の合計は表示していません。</p>}
      {history.recordCount === 0 && history.unassignedRecordCount === 0 && <p role="status" className="text-sm text-gray-600">この期間の学習記録はまだありません。</p>}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold">日別の学習時間（分）</h3>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <BarChart data={history.days} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={label => formatHistoryDate(String(label))} formatter={value => [`${value}分`, '記録された学習時間']} />
                <Bar dataKey="minutes" name="学習時間" fill="#3567c8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500">記録のない日は0分です。未記録の学習や出欠は表していません。値が不明な日は下の表で確認できます。</p>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold">教科別の理解度（各日の最後の記録）</h3>
          {selected ? (
            <>
              <label htmlFor="history-subject" className="mr-2 text-sm">教科</label>
              <select id="history-subject" value={JSON.stringify(selected.subjectId)} onChange={event => setSubjectKey(event.target.value)} className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {history.subjects.map(subject => <option key={JSON.stringify(subject.subjectId)} value={JSON.stringify(subject.subjectId)}>{subject.subjectId === null ? '教科不明' : formatSubject(subject.subjectId)}</option>)}
              </select>
              <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <LineChart data={selected.days} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={label => formatHistoryDate(String(label))} formatter={value => [formatUnderstanding(value), 'その日の最後の理解度']} />
                    <Line type="linear" dataKey="understanding" name="理解度" stroke="#d96b28" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : <p className="py-6 text-sm text-gray-500">この期間に理解度を記録した教科はありません。</p>}
          <p className="text-xs text-gray-500">生徒が学習完了時に記録した1〜5の値です。記録がない日は線をつなぎません。異なる単元を含み、先生が登録した現在地の理解度は含みません。</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="p-3 text-left font-medium">グラフの元データ{selected ? `：理解度は${selected.subjectId === null ? '教科不明' : formatSubject(selected.subjectId)}` : ''}</caption>
          <thead className="border-y border-gray-200 bg-gray-50"><tr>
            <th scope="col" className="px-3 py-2">日付</th><th scope="col" className="px-3 py-2">全教科の学習時間</th><th scope="col" className="px-3 py-2">全教科の記録数</th><th scope="col" className="px-3 py-2">教科の最後の理解度</th><th scope="col" className="px-3 py-2">最後に記録した単元</th>
          </tr></thead>
          <tbody>{history.days.map((day, index) => {
            const point = selected?.days[index];
            return <tr key={day.date} className="border-b border-gray-100 last:border-0">
              <th scope="row" className="whitespace-nowrap px-3 py-2 font-normal">{formatHistoryDate(day.date)}</th>
              <td className="px-3 py-2">{day.minutes === null ? '不明' : day.recordCount === 0 ? '0分（記録なし）' : `${day.minutes}分`}</td>
              <td className="px-3 py-2">{day.recordCount}件</td>
              <td className="px-3 py-2">{!point || point.recordCount === 0 ? '記録なし' : point.understanding === null ? '理解度不明' : formatUnderstanding(point.understanding)}</td>
              <td className="px-3 py-2">{point?.unitName?.trim() || '—'}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
