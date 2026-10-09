export function LearningSummaryCard({
  studentName,
  weeklyStudyMinutes,
  studiedDays,
}: {
  studentName: string | null;
  weeklyStudyMinutes: number;
  studiedDays: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{studentName ?? 'お子さま'}さんの今週の学習</p>
      <div className="mt-4 flex gap-8">
        <div>
          <p className="text-xs text-gray-400">今週の学習時間</p>
          <p className="text-2xl font-semibold text-gray-900">{weeklyStudyMinutes}分</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">学習した日</p>
          <p className="text-2xl font-semibold text-gray-900">{studiedDays}日</p>
        </div>
      </div>
    </div>
  );
}
