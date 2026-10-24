import type { ApiCurriculumItem, ApiStudentProgressItem } from '../../../types/api'
import { StatusPill } from './StatusPill'

export function CurrentPositionCard({ schoolCurrentPosition, myCurrentPosition }: {
  schoolCurrentPosition: ApiCurriculumItem | null
  myCurrentPosition: ApiStudentProgressItem | null
}) {
  const score = myCurrentPosition?.understanding
  const level = typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 5 ? score : null

  return (
    <div className="position-grid">
      <section className="surface-card position-card" aria-label="学校の今の進み方">
        <h3 className="position-caption">学校の今の進み方</h3>
        {schoolCurrentPosition === null ? (
          <p className="position-note">学校の授業進度がまだ登録されていません</p>
        ) : (
          <>
            <p className="position-title">{schoolCurrentPosition.unit_name}</p>
            <p className="position-note">教科書 {schoolCurrentPosition.textbook_page}</p>
            <StatusPill status={schoolCurrentPosition.status} />
          </>
        )}
      </section>
      <section className="surface-card position-card" aria-label="わたしの今の進み方">
        <h3 className="position-caption">わたしの今の進み方</h3>
        {myCurrentPosition === null ? (
          <p className="position-note">先生による現在地の設定を待っています</p>
        ) : (
          <>
            <p className="position-title">{myCurrentPosition.unit_name}</p>
            <div className="understanding-level">
              <span>先生が登録した理解度：{level === null ? '未設定' : `${level}/5`}</span>
              {level !== null && <span className="understanding-level-dots" aria-hidden="true">
                {[1, 2, 3, 4, 5].map(value => <i key={value} className={value <= level ? 'is-filled' : ''} />)}
              </span>}
            </div>
            <StatusPill status={myCurrentPosition.status} />
          </>
        )}
      </section>
    </div>
  )
}
