import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { isCorrectChoice, pickRandomPracticeQuestion, shuffle } from './videoMaterials'
import type { PoolSubject } from './videoMaterials'
import type { PracticeQuestion } from './types'
import './PracticePage.css'

const SUBJECT_LABEL: Record<PoolSubject, string> = { math: '数学', science: '理科', japanese: '国語', english: '英語', social: '社会' }

function Card({ question, onNext }: { question: PracticeQuestion; onNext: (correct: boolean) => void }) {
  const formId = useId()
  const [choices] = useState(() => shuffle(question.options))
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [hints, setHints] = useState(0)
  const correct = checked && isCorrectChoice(choices, selected)

  return <section className="surface-card practice-question" aria-labelledby={`${formId}-title`}>
    <h2 id={`${formId}-title`}>{question.label}</h2>
    <fieldset>
      <legend>{question.prompt}</legend>
      {choices.map(choice => (
        <label key={choice.id} className="practice-choice">
          <input type="radio" name={formId} value={choice.id} checked={selected === choice.id}
            disabled={checked} onChange={() => setSelected(choice.id)} />
          <span>{choice.text}</span>
        </label>
      ))}
    </fieldset>
    <div className="practice-actions">
      {!checked && <button type="button" className="primary-button" disabled={!selected} onClick={() => setChecked(true)}>答えを確かめる</button>}
      {!checked && hints < question.hints.length && (
        <button type="button" className="secondary" onClick={() => setHints(value => value + 1)}>ヒントを見る</button>
      )}
      {checked && <button type="button" className="primary-button" onClick={() => onNext(correct)}>次の問題へ</button>}
    </div>
    {!checked && hints > 0 && <ol className="practice-hints">{question.hints.slice(0, hints).map((hint, index) => <li key={index}>{hint}</li>)}</ol>}
    {checked && <div className="practice-feedback" role="status">
      <p>{correct ? '正解です！' : '残念、不正解です。'}</p>
      <p>{question.explanation.replace(/^正解[！!]\s*/, '')}</p>
    </div>}
  </section>
}

export function PracticePage({ subject }: { subject: PoolSubject }) {
  const label = SUBJECT_LABEL[subject]
  const materialsUrl = subject === 'math' ? '/materials/math' : `/materials/${subject}`
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [questionKey, setQuestionKey] = useState(0)
  const [current, setCurrent] = useState(() => pickRandomPracticeQuestion(subject))

  function handleNext(correct: boolean) {
    setAnswered(value => value + 1)
    if (correct) setScore(value => value + 1)
    setCurrent(previous => pickRandomPracticeQuestion(subject, previous?.id))
    setQuestionKey(value => value + 1)
  }

  return <div className="practice-page">
    <Link className="text-link" to={materialsUrl}>{`← ${label}の単元一覧へ`}</Link>
    <p className="eyebrow">{label}の演習</p>
    <h1>ひたすら演習する</h1>
    <div className="practice-score surface-card" role="status">
      <span>解いた問題数：{answered}</span>
      <span>スコア：{score}</span>
    </div>
    {current
      ? <Card key={questionKey} question={current} onNext={handleNext} />
      : <section className="surface-card practice-question"><p>この教科の演習問題はまだありません。</p></section>}
    <p className="muted">スコアはこの画面を開いている間だけ記録されます。ページを離れたり閉じたりすると0に戻ります。いつでもやめて大丈夫です。</p>
    <Link className="text-link" to={materialsUrl}>やめてメニューに戻る</Link>
  </div>
}
