import { WarpLink } from '../../components/ui/WarpTransition'
import type { PoolSubject } from './videoMaterials'
import './SubjectMenuPage.css'

const SUBJECTS: { subject: PoolSubject; label: string; description: string }[] = [
  { subject: 'math', label: '数学', description: '単元を選んで解説と演習問題に取り組もう' },
  { subject: 'science', label: '理科', description: '動画と要約でしっかり理解しよう' },
  { subject: 'japanese', label: '国語', description: '動画と要約でしっかり理解しよう' },
  { subject: 'english', label: '英語', description: '動画と要約でしっかり理解しよう' },
  { subject: 'social', label: '社会', description: '動画と要約でしっかり理解しよう' },
]

export function SubjectMenuPage() {
  return <div className="subject-menu">
    <p className="eyebrow">学習メニュー</p>
    <h1>教科を選ぼう</h1>
    <p>教科を選ぶと、単元一覧（カタログ）に進みます。</p>
    <ul className="subject-cards">
      {SUBJECTS.map(({ subject, label, description }) => (
        <li key={subject}>
          <WarpLink to={`/materials/${subject}`} className="subject-card">
            <span className="subject-card-label">{label}</span>
            <span className="subject-card-description">{description}</span>
          </WarpLink>
        </li>
      ))}
    </ul>
  </div>
}
