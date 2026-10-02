import { useEffect, useMemo, useRef, useState } from 'react'
import MathText from './MathText.jsx'
import Options from './Options.jsx'
import ScratchOverlay from './ScratchOverlay.jsx'
import { checkAnswer } from '../engine/check.js'
import { createFreshPicker, pickWeightedTopic } from '../engine/pick.js'
import { guideTopics } from '../engine/guide.js'
import { recordAnswer, recordPage } from '../engine/stats.js'
import { toLatex } from '../engine/expr.js'
import { useStudyAids } from './Tables.jsx'
import { answerDisplay } from '../engine/display.js'
import AnswerText from './AnswerText.jsx'


function clock(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// One question per study-guide line, drawn from that line's topics (colder
// topics more often), in the guide's order.
function buildTest(cls, unit) {
  const fresh = createFreshPicker()
  return unit.guide
    .map(g => ({ g, topics: guideTopics(unit, g) }))
    .filter(({ topics }) => topics.length > 0)
    .map(({ g, topics }, i) => {
      const topic = pickWeightedTopic(cls.id, topics)
      return { n: i + 1, line: g.short, topicId: topic.id, topicName: topic.name, problem: fresh(topic) }
    })
}

// A practice test: the real test's conditions. No hints or right/wrong until
// you hand it in, the formula sheet and tables a tap away, a clock running.
// Handing it in grades every answer, counts them toward each topic's heat,
// and shows the worked answer for everything you missed.
export default function PracticeTest({ cls, unit, onExit, onDrill }) {
  const questions = useMemo(() => buildTest(cls, unit), [cls, unit])
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [scratch, setScratch] = useState(true)
  const aids = useStudyAids(unit)
  const inputRef = useRef(null)
  const q = questions[at]

  useEffect(() => {
    if (results) return
    const start = Date.now() - elapsed * 1000
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  useEffect(() => {
    if (!results) inputRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [at, results])

  useEffect(() => {
    function onKey(e) {
      if (aids.open) return
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function handIn() {
    const graded = questions.map(x => {
      const raw = (answers[x.n] ?? '').trim()
      const correct = raw ? checkAnswer(raw, x.problem) : null
      if (raw) recordAnswer(cls.id, x.topicId, correct)
      return { ...x, raw, correct }
    })
    const right = graded.filter(g => g.correct).length
    recordPage(cls.id, {
      date: new Date().toISOString(),
      topicId: `${unit.id}-practice-test`,
      topicName: `${unit.name} practice test`,
      setNumber: 1,
      reps: graded.length,
      correct: right,
      best: right,
      topMisses: graded
        .filter(g => g.correct === false)
        .slice(0, 3)
        .map(g => ({ latex: g.problem.latex, answerLatex: answerDisplay(g.problem), count: 1 })),
    })
    setResults({ graded, right, minutes: Math.max(1, Math.round(elapsed / 60)) })
    setConfirm(false)
  }

  if (results) {
    const missedTopics = [...new Set(results.graded.filter(g => g.correct !== true).map(g => g.topicId))]
    return (
      <div className="sheet drill-sheet">
        <header className="drill-head">
          <button className="btn ghost" onClick={onExit}>
            ← {cls.name}
          </button>
          <span className="drill-title mathx">{unit.name} practice test</span>
          <span />
        </header>
        <div className="page-card">
          <h2 className="mathx">
            {results.right} / {results.graded.length}
          </h2>
          <p className="table-note">
            {results.minutes} min · {results.graded.filter(g => g.raw).length} answered · every answered question counted
            toward its topic
          </p>
          <ol className="test-review">
            {results.graded.map(g => (
              <li key={g.n} className={g.correct === true ? 'ok' : g.correct === false ? 'bad' : 'skip'}>
                <p className="test-line">
                  <span className="test-mark">{g.correct === true ? '✓' : g.correct === false ? '✗' : '·'}</span>
                  {g.n}. {g.line} <span className="test-topic">({g.topicName})</span>
                </p>
                {g.correct !== true && (
                  <div className="test-detail">
                    {g.problem.ask && <p className="ask mathx">{g.problem.ask}</p>}
                    {g.problem.text && <p className="problem-text">{g.problem.text}</p>}
                    <div className={g.problem.size ? `problem problem-${g.problem.size}` : 'problem problem-small'}>
                      <MathText latex={g.problem.latex} display />
                    </div>
                    <Options options={g.problem.options} />
                    <p className="solution-line">
                      {g.raw ? <>You: {g.raw} · </> : <>Skipped · </>}
                      Answer: <AnswerText problem={g.problem} />
                    </p>
                    {g.problem.hint && (
                      <div className="hint-card">
                        {g.problem.hint.latex && <MathText latex={g.problem.hint.latex} />}
                        <p>{g.problem.hint.text}</p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="summary-actions">
            {missedTopics.length > 0 && (
              <button
                className="btn"
                onClick={() =>
                  onDrill(cls, null, {
                    ...unit,
                    id: `${unit.id}-missed`,
                    name: `${unit.name} misses`,
                    topics: unit.topics.filter(t => missedTopics.includes(t.id)),
                  })
                }
              >
                Drill what I missed
              </button>
            )}
            <button className="btn ghost" onClick={onExit}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const p = q.problem
  const value = answers[q.n] ?? ''
  const blank = questions.filter(x => !(answers[x.n] ?? '').trim()).length
  const target = questions.length * 3.5 * 60

  return (
    <div className="sheet drill-sheet">
      <header className="drill-head">
        <button className="btn ghost" onClick={onExit}>
          ← {cls.name}
        </button>
        <span className="drill-title mathx">{unit.name} practice test</span>
        <span className={`drill-rep ${elapsed > target ? 'over' : ''}`} title="About 3.5 minutes a question">
          {clock(elapsed)} / ~{Math.round(target / 60)} min
        </span>
      </header>

      <div className="drill-tools">
        <button className={`tool-btn ${scratch ? 'on' : ''}`} onClick={() => setScratch(s => !s)}>
          ✎ Scratch
        </button>
        {aids.buttons}
      </div>

      <nav className="test-nav" aria-label="questions">
        {questions.map((x, i) => (
          <button
            key={x.n}
            className={`${i === at ? 'here' : ''} ${(answers[x.n] ?? '').trim() ? 'done' : ''}`}
            onClick={() => setAt(i)}
            aria-label={`question ${x.n}`}
          >
            {x.n}
          </button>
        ))}
      </nav>

      <main className="drill-main">
        <div className="problem-meta">
          <span className="topic-tag">
            {q.n}. {q.line}
          </span>
        </div>
        {p.ask && <p className="ask mathx">{p.ask}</p>}
        {p.text && <p className="problem-text">{p.text}</p>}
        <div className={p.size ? `problem problem-${p.size}` : 'problem'}>
          <MathText latex={p.latex} display />
        </div>
        <Options options={p.options} />
        <form
          className="answer-form"
          onSubmit={e => {
            e.preventDefault()
            if (at < questions.length - 1) setAt(at + 1)
            else setConfirm(true)
          }}
        >
          <input
            ref={inputRef}
            className={`answer-input ${p.expr ? 'formula' : ''}`}
            value={value}
            onChange={e => setAnswers(a => ({ ...a, [q.n]: e.target.value }))}
            placeholder={p.placeholder ?? 'answer'}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-label="answer"
          />
          <button className="btn" type="submit">
            {at < questions.length - 1 ? 'Next' : 'Finish'}
          </button>
        </form>
        {p.expr && value.trim() && (
          <p className="expr-preview">
            {toLatex(value, p.expr.vars) ? <MathText latex={toLatex(value, p.expr.vars)} /> : 'keep typing…'}
          </p>
        )}
        {!p.expr && typeof p.answer === 'string' && !p.options && p.choices?.length > 0 && (
          <p className="table-note">Answer with one of: {[p.answer, ...p.choices].sort().join(', ')}</p>
        )}

        <div className="test-actions">
          <button className="btn ghost" disabled={at === 0} onClick={() => setAt(at - 1)}>
            Back
          </button>
          {confirm ? (
            <span className="test-confirm">
              {blank > 0 ? `${blank} blank. ` : ''}Hand it in?{' '}
              <button className="btn" onClick={handIn}>
                Hand it in
              </button>{' '}
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                Keep working
              </button>
            </span>
          ) : (
            <button className="btn ghost" onClick={() => setConfirm(true)}>
              Hand it in
            </button>
          )}
        </div>
      </main>

      {scratch && <ScratchOverlay repKey={q} clearSignal={0} erase={false} />}
      {aids.overlay}
    </div>
  )
}
