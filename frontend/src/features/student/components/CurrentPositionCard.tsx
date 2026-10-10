import type { ApiCurriculumItem, ApiStudentProgressItem } from '../../../types/api'
import { scoreFromUnderstanding } from '../../teacher/utils/progressScore'
import { ProgressBar } from '../../../components/ui/ProgressBar'
import { StatusPill } from './StatusPill'

export function CurrentPositionCard({
  schoolCurrentPosition,
  myCurrentPosition,
}: {
  schoolCurrentPosition: ApiCurriculumItem | null
  myCurrentPosition: ApiStudentProgressItem | null
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">学校の今の進み方</p>
        {schoolCurrentPosition === null ? (
          <p className="mt-4 text-sm text-gray-500">学校の授業進度がまだ登録されていません</p>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-gray-900">{schoolCurrentPosition.unit_name}</p>
            <p className="text-sm text-gray-500">教科書 {schoolCurrentPosition.textbook_page}ページ</p>
            <StatusPill status={schoolCurrentPosition.status} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">わたしの今の進み方</p>
        {myCurrentPosition === null ? (
          <p className="mt-4 text-sm text-gray-500">先生による現在地の設定を待っています</p>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-gray-900">{myCurrentPosition.unit_name}</p>
            <ProgressBar value={scoreFromUnderstanding(myCurrentPosition.understanding)} />
            <StatusPill status={myCurrentPosition.status} />
          </div>
        )}
      </div>
    </div>
  )
}
