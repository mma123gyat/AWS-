import type { ApiSupportReport } from '../../../types/api';

export function LearningReportCard({ report }: { report: ApiSupportReport }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-medium text-gray-700">{report.studentName ?? '対象の生徒'}さんの学習状況</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-400">直近7日間の学習時間</p>
          <p className="text-xl font-semibold text-gray-900">{report.recentStudyMinutes}分</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">直近7日間の学習記録</p>
          <p className="text-xl font-semibold text-gray-900">{report.recentRecordCount}件</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">出席情報</p>
          <p className="text-sm text-gray-500">{report.attendanceNote}</p>
        </div>
      </div>
    </div>
  );
}
