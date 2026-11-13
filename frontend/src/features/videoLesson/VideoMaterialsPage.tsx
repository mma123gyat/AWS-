import { useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WarpLink } from '../../components/ui/WarpTransition'
import { stepsForSubject } from './catalog'
import { videoLessons } from './lessons'
import { checkBlankAnswer, isCorrectChoice, parseVideoStep, shuffle, videoMaterialUrl } from './videoMaterials'
import type { PracticeQuestion, Subject, VideoLesson, VideoStep } from './types'
import './VideoMaterialsPage.css'

const SUBJECT_LABEL: Record<Subject, string> = { science: '理科', japanese: '国語', english: '英語', social: '社会' }

function Question({ question }: { question: PracticeQuestion }) {
  const formId = useId()
  const [choices] = useState(() => shuffle(question.options))
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [hints, setHints] = useState(0)
  const correct = checked && isCorrectChoice(choices, selected)

  return (
    <section className="video-question" aria-labelledby={`${formId}-title`}>
      <h3 id={`${formId}-title`}>{question.label}</h3>
      <fieldset>
        <legend>{question.prompt}</legend>
        {choices.map(choice => (
          <label key={choice.id} className="video-choice">
            <input type="radio" name={formId} value={choice.id} checked={selected === choice.id}
              disabled={correct} onChange={() => { setSelected(choice.id); setChecked(false) }} />
            <span>{choice.text}</span>
          </label>
        ))}
      </fieldset>
      <div className="video-actions">
        <button type="button" className="primary-button" disabled={!selected || correct} onClick={() => setChecked(true)}>
          {correct ? '正解を確認しました' : '答えを確かめる'}
        </button>
        {hints < question.hints.length && (
          <button type="button" className="secondary" onClick={() => setHints(value => value + 1)}>ヒントを見る</button>
        )}
      </div>
      {hints > 0 && <ol className="video-hints">{question.hints.slice(0, hints).map((hint, index) => <li key={index}>{hint}</li>)}</ol>}
      {checked && <div className="video-feedback" role="status">
        <p>{correct ? '正解です。' : '答えと解説を確認して、もう一度考えてみましょう。'}</p>
        <p>{question.explanation.replace(/^正解[！!]\s*/, '')}</p>
      </div>}
    </section>
  )
}

function VideoAndSummary({ lesson, onNext }: { lesson: VideoLesson; onNext: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [choiceOrder] = useState(() => Object.fromEntries(lesson.blanks.map(blank => [blank.id, shuffle(blank.choices)])))
  const allFilled = lesson.blanks.every(blank => answers[blank.id])
  const allCorrect = checked && lesson.blanks.every(blank => checkBlankAnswer(blank.answer, answers[blank.id] ?? ''))

  return <section className="surface-card video-section">
    <div className="video-embed">
      <iframe
        src={`https://www.youtube.com/embed/${lesson.videoId}`}
        title={lesson.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
    <h2>要約（空欄を埋めよう）</h2>
    <p className="video-summary">
      {lesson.summary.map((part, index) => {
        if (part.kind === 'text') return <span key={index}>{part.text}</span>
        const blank = lesson.blanks.find(candidate => candidate.id === part.blankId)
        const correctBlank = checked && !!blank && checkBlankAnswer(blank.answer, answers[part.blankId] ?? '')
        return <select
          key={index}
          aria-label={`空欄${index + 1}`}
          className={checked ? (correctBlank ? 'is-correct' : 'is-wrong') : ''}
          value={answers[part.blankId] ?? ''}
          disabled={allCorrect}
          onChange={event => { setAnswers(previous => ({ ...previous, [part.blankId]: event.target.value })); setChecked(false) }}
        >
          <option value="">選ぶ</option>
          {(choiceOrder[part.blankId] ?? []).map((choice: string) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      })}
    </p>
    <div className="video-actions">
      <button type="button" className="primary-button" disabled={!allFilled || allCorrect} onClick={() => setChecked(true)}>
        {allCorrect ? '正解を確認しました' : '答えを確認する'}
      </button>
      <button type="button" className="primary-button" disabled={!allCorrect} onClick={onNext}>次へ：演習問題</button>
    </div>
    {checked && <div className="video-feedback" role="status">
      <p>{allCorrect ? '全問正解です。次へ進みましょう。' : '間違っている空欄があります。もう一度確認してみましょう。'}</p>
    </div>}
  </section>
}

function Lesson({ lesson, catalogUrl, catalogLabel }: { lesson: VideoLesson; catalogUrl: string; catalogLabel: string }) {
  const [phase, setPhase] = useState<'video' | 'practice'>('video')
  if (phase === 'video') return <VideoAndSummary lesson={lesson} onNext={() => setPhase('practice')} />
  return <>
    <section className="surface-card video-section">
      <h2>問題を解いてみよう</h2>
      <p className="muted">取り組めそうな問題を選んでください。全部解かなくても大丈夫です。</p>
      {lesson.practice.map(question => <Question key={question.id} question={question} />)}
    </section>
    <Link className="text-link" to={catalogUrl}>{catalogLabel}</Link>
  </>
}

function Catalog({ subject, steps }: { subject: Subject; steps: readonly VideoStep[] }) {
  const [search, setSearch] = useState('')
  const id = useId()
  const visible = steps.filter(step => `${step.grade} ${step.unit}`.normalize('NFKC').includes(search.trim().normalize('NFKC')))
  return <section className="surface-card video-section">
    <label htmlFor={id}>単元を探す</label>
    <input id={id} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="例：花のつくり、be動詞" />
    <p className="muted">{visible.length}単元</p>
    <ul className="video-catalog">
      {visible.map(step => {
        const hasContent = videoLessons.some(lesson => lesson.subject === subject && lesson.step === step.id)
        return <li key={step.id}>
          <WarpLink to={videoMaterialUrl(subject, step.id)} className={hasContent ? undefined : 'is-pending'}>
            <span>{step.grade}</span> {step.unit}
            {!hasContent && <span className="pending-badge">準備中</span>}
          </WarpLink>
        </li>
      })}
    </ul>
    {visible.length === 0 && <p>条件に合う単元がありません。</p>}
    <WarpLink to={`/practice/${subject}`} className="practice-entry">ひたすら演習する →</WarpLink>
  </section>
}

export function VideoMaterialsPage({ subject }: { subject: Subject }) {
  const { stepId } = useParams()
  const steps = stepsForSubject(subject)
  const label = SUBJECT_LABEL[subject]
  const catalogUrl = `/materials/${subject}`
  const catalogLabel = `← ${label}の単元一覧へ`

  if (stepId !== undefined) {
    const step = parseVideoStep(subject, stepId)
    if (step === null) {
      return <section className="surface-card video-section"><h1>教材が見つかりません</h1><Link className="text-link" to={catalogUrl}>{catalogLabel}</Link></section>
    }
    const meta = steps.find(candidate => candidate.id === step)
    const lesson = videoLessons.find(candidate => candidate.subject === subject && candidate.step === step)
    return <div className="video-materials">
      <Link className="text-link" to={catalogUrl}>{catalogLabel}</Link>
      <p className="eyebrow">{label}教材</p>
      <h1>{meta ? meta.unit : '教材'}</h1>
      {meta && <p className="muted">{meta.grade}</p>}
      {lesson
        ? <Lesson key={`${lesson.subject}:${lesson.step}`} lesson={lesson} catalogUrl={catalogUrl} catalogLabel={catalogLabel} />
        : <section className="surface-card video-section">
          <p>この単元の教材は準備中です。別の単元を選んでください。</p>
          <Link className="text-link" to={catalogUrl}>{catalogLabel}</Link>
        </section>}
    </div>
  }

  return <div className="video-materials">
    <Link className="text-link" to="/materials">← 教科一覧へ</Link>
    <p className="eyebrow">{label}教材</p>
    <h1>{label}を学ぼう</h1>
    <p>単元を自由に選んで練習できます。</p>
    <Catalog subject={subject} steps={steps} />
  </div>
}
