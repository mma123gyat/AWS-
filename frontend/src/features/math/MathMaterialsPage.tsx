import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getStudentDashboard } from '../../api/studentApi'
import { useFetch } from '../../hooks/useFetch'
import { StudyTaskCard } from '../student/components/StudyTaskCard'
import { mathSteps } from './catalog'
import { mathLessons } from './lessons'
import { drawMathAnimation } from './mathCanvas.js'
import { getMathStepsForTask, isCorrectChoice, mathMaterialUrl, parseMathStep, shuffleChoices } from './mathMaterials'
import type { MathAnimation, MathLesson, MathQuestion, MathStep } from './types'
import './MathMaterialsPage.css'

function Question({ question }: { question: MathQuestion }) {
  const formId = useId()
  const [choices] = useState(() => shuffleChoices(question.options))
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [hints, setHints] = useState(0)
  const correct = checked && isCorrectChoice(choices, selected)

  return (
    <section className="math-question" aria-labelledby={`${formId}-title`}>
      <h3 id={`${formId}-title`}>{question.label}</h3>
      <fieldset>
        <legend>{question.prompt}</legend>
        {choices.map(choice => (
          <label key={choice.id} className="math-choice">
            <input type="radio" name={formId} value={choice.id} checked={selected === choice.id}
              disabled={correct} onChange={() => { setSelected(choice.id); setChecked(false) }} />
            <span>{choice.text}</span>
          </label>
        ))}
      </fieldset>
      <div className="math-actions">
        <button type="button" className="primary-button" disabled={!selected || correct} onClick={() => setChecked(true)}>
          {correct ? '正解を確認しました' : '答えを確かめる'}
        </button>
        {hints < question.hints.length && (
          <button type="button" className="secondary" onClick={() => setHints(value => value + 1)}>ヒントを見る</button>
        )}
      </div>
      {hints > 0 && <ol className="math-hints">{question.hints.slice(0, hints).map((hint, index) => <li key={index}>{hint}</li>)}</ol>}
      {checked && <div className="math-feedback" role="status">
        <p>{correct ? '正解です。' : '答えと解説を確認して、もう一度考えてみましょう。'}</p>
        <p>{question.explanation.replace(/^正解[！!]\s*/, '')}</p>
      </div>}
    </section>
  )
}

function Animation({ animation, title }: { animation: MathAnimation; title: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const prefix = useId()
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(animation.controls.map(control => [control.id, control.def])))
  useEffect(() => {
    if (canvas.current) drawMathAnimation(canvas.current, animation, values)
  }, [animation, values])
  return <div className="math-animation">
    <canvas ref={canvas} width={380} height={210} role="img" aria-label={`${title}の図`} />
    {animation.controls.map(control => <div className="math-control" key={control.id}>
      <label htmlFor={`${prefix}-${control.id}`}>{control.label}：{values[control.id]}</label>
      <input id={`${prefix}-${control.id}`} type="range" min={control.min} max={control.max} step={control.step ?? 1}
        value={values[control.id]} onChange={event => setValues(previous => ({ ...previous, [control.id]: Number(event.target.value) }))} />
    </div>)}
  </div>
}

function Lesson({ content }: { content: MathLesson }) {
  return <>
    <section className="surface-card math-section">
      <h2>{content.title}</h2>
      <ol className="math-explanation">{content.narration.map((line, index) => <li key={index}>{line}</li>)}</ol>
      <Animation animation={content.animation} title={content.title} />
      <Question key={content.check.id} question={content.check} />
    </section>
    <section className="surface-card math-section">
      <h2>問題を解いてみよう</h2>
      <p className="muted">取り組めそうな問題を選んでください。全部解かなくても大丈夫です。</p>
      {content.practice.map(question => <Question key={question.id} question={question} />)}
    </section>
  </>
}

function Catalog({ steps, taskId }: { steps: readonly MathStep[]; taskId?: string }) {
  const [search, setSearch] = useState('')
  const id = useId()
  const visible = steps.filter(step => `${step.grade} ${step.unit}`.normalize('NFKC').includes(search.trim().normalize('NFKC')))
  return <section className="surface-card math-section">
    <label htmlFor={id}>単元を探す</label>
    <input id={id} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="例：比例、方程式" />
    <p className="muted">{visible.length}単元</p>
    <ul className="math-catalog">{visible.map(step => <li key={step.id}>
      <Link to={mathMaterialUrl(step.id, taskId)}><span>{step.grade}</span> {step.unit}</Link>
    </li>)}</ul>
    {visible.length === 0 && <p>条件に合う単元がありません。</p>}
  </section>
}

export function MathMaterialsPage() {
  const { stepId } = useParams()
  const [query] = useSearchParams()
  const hasTask = query.has('taskId')
  const taskId = query.get('taskId') ?? ''
  const load = useCallback(() => hasTask && taskId ? getStudentDashboard() : Promise.resolve(null), [hasTask, taskId])
  const { state, refetch } = useFetch(load)
  const step = parseMathStep(stepId)

  if (stepId !== undefined && step === null) return <section className="surface-card math-section"><h1>教材が見つかりません</h1><Link to="/materials/math">数学の単元一覧へ</Link></section>
  if (hasTask && state.status === 'loading') return <p role="status">学習課題を確認しています…</p>
  if (hasTask && state.status === 'error') return <section className="surface-card math-section"><p role="alert">{state.message}</p><button className="secondary" onClick={refetch}>再読み込み</button></section>
  const task = state.status === 'success' ? state.data?.todayPlan?.tasks.find(candidate => candidate.task_id === taskId) : undefined
  const allowed = task ? getMathStepsForTask(task) : []
  if (hasTask && (!task || !allowed.length || (step !== null && !allowed.some(candidate => candidate.id === step)))) {
    return <section className="surface-card math-section"><h1>対応する数学の課題を確認できませんでした</h1>
      <p>今日の学習プランから、教材を開き直してください。</p><Link to="/dashboard">ダッシュボードへ戻る</Link></section>
  }
  const meta = mathSteps.find(candidate => candidate.id === step)
  const content = mathLessons.find(candidate => candidate.step === step)
  const catalogUrl = hasTask ? `/materials/math?taskId=${encodeURIComponent(taskId)}` : '/materials/math'
  return <div className="math-materials">
    <Link className="text-link" to={stepId ? catalogUrl : '/dashboard'}>{stepId ? '← 数学の単元一覧へ' : '← ダッシュボードへ'}</Link>
    <p className="eyebrow">数学教材</p>
    <h1>{meta ? meta.unit : hasTask ? '今日の課題に対応する教材' : '数学を学ぼう'}</h1>
    {meta && <p className="muted">{meta.grade} ／ 自作教材</p>}
    <p>{hasTask ? '取り組み終わったら、下の「今日の課題の記録」から学習時間と理解度を保存できます。' : '単元を自由に選んで練習できます。学習時間・理解度の保存は、ダッシュボードの今日の課題から教材を開いた場合に利用できます。'}</p>
    {content ? <Lesson key={`${content.step}:${taskId}`} content={content} /> : <Catalog steps={hasTask ? allowed : mathSteps} taskId={hasTask ? taskId : undefined} />}
    {task && content && <section className="surface-card math-section">
      <h2>今日の課題の記録</h2>
      <p>同じ課題に複数の教材がある場合は、取り組んだ時間をまとめて一度記録してください。</p>
      <ul className="study-task-list"><StudyTaskCard key={task.task_id} task={task} showMaterialLinks={false} /></ul>
      <Link className="text-link" to="/dashboard">ダッシュボードへ戻る</Link>
    </section>}
    <p className="muted">解答はこの画面で練習するためのものです。正誤を理解度1〜5や成績に自動変換しません。画面を閉じると途中の解答はリセットされます。</p>
  </div>
}
