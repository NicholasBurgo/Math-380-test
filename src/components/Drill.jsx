import { useEffect, useMemo, useRef, useState } from 'react'
import MathText from './MathText.jsx'
import { createSession } from '../engine/drill.js'
import { checkAnswer } from '../engine/check.js'
import { recordAnswer, recordPage } from '../engine/stats.js'
import { pickWeightedTopic, randomTemplate } from '../engine/pick.js'

const SET_SIZE = 20

function answerDisplay(p) {
  return p.answerLatex ?? String(p.answer)
}

export default function Drill({ cls, topic, onExit }) {
  const session = useMemo(
    () =>
      createSession(() => {
        const t = topic ?? pickWeightedTopic(cls)
        return { topicId: t.id, topicName: t.name, ...randomTemplate(t).generate() }
      }),
    [cls, topic],
  )

  const [current, setCurrent] = useState(() => session.next())
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [set, setSet] = useState({ n: 1, reps: 0, correct: 0, streak: 0, best: 0, misses: {} })
  const [summary, setSummary] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!summary) inputRef.current?.focus()
  }, [current, feedback, summary])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const problem = current.problem
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const acc = set.reps ? Math.round((100 * set.correct) / set.reps) : null

  function handleSubmit(e) {
    e.preventDefault()
    if (feedback !== null) {
      advance()
      return
    }
    if (!input.trim()) return
    const ok = checkAnswer(input, problem)
    session.answer(ok)
    recordAnswer(cls.id, problem.topicId, ok)
    setFeedback(ok ? 'correct' : 'wrong')
    setSet(s => {
      const streak = ok ? s.streak + 1 : 0
      const misses = { ...s.misses }
      if (!ok) {
        const k = problem.latex
        misses[k] = {
          latex: problem.latex,
          answerLatex: answerDisplay(problem),
          count: (misses[k]?.count ?? 0) + 1,
        }
      }
      return {
        ...s,
        reps: s.reps + 1,
        correct: s.correct + (ok ? 1 : 0),
        streak,
        best: Math.max(s.best, streak),
        misses,
      }
    })
  }

  function advance() {
    setFeedback(null)
    setInput('')
    if (set.reps >= SET_SIZE) {
      const topMisses = Object.values(set.misses)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
      const page = {
        date: new Date().toISOString(),
        topicId: topic?.id ?? 'mixed',
        topicName: topic?.name ?? 'Mixed set',
        setNumber: set.n,
        reps: set.reps,
        correct: set.correct,
        best: set.best,
        topMisses,
      }
      recordPage(cls.id, page)
      setSummary(page)
    } else {
      setCurrent(session.next())
    }
  }

  function nextSet() {
    setSummary(null)
    setSet(s => ({ n: s.n + 1, reps: 0, correct: 0, streak: 0, best: 0, misses: {} }))
    setCurrent(session.next())
  }

  if (summary) {
    return (
      <div className="sheet drill-sheet">
        <header className="drill-head">
          <button className="btn ghost" onClick={onExit}>
            ← {cls.name}
          </button>
          <span className="drill-title mathx">{dateStr}</span>
          <span />
        </header>
        <div className="page-card">
          <h2 className="mathx">
            Set {summary.setNumber} — {summary.topicName}
          </h2>
          <dl className="summary-stats">
            <div>
              <dt>Reps</dt>
              <dd>{summary.reps}</dd>
            </div>
            <div>
              <dt>Correct</dt>
              <dd>
                {summary.correct} ({Math.round((100 * summary.correct) / summary.reps)}%)
              </dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd>{summary.best}</dd>
            </div>
          </dl>
          {summary.topMisses.length > 0 ? (
            <div className="summary-misses">
              <h3>Cost you the most</h3>
              <ul>
                {summary.topMisses.map(m => (
                  <li key={m.latex}>
                    <MathText latex={m.latex} />
                    <span className="miss-ans">
                      <MathText latex={m.answerLatex} /> · missed ×{m.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="summary-clean">Clean set — nothing missed.</p>
          )}
          <div className="summary-actions">
            <button className="btn" onClick={nextSet}>
              Next set
            </button>
            <button className="btn ghost" onClick={onExit}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sheet drill-sheet ${feedback ?? ''}`}>
      <header className="drill-head">
        <button className="btn ghost" onClick={onExit}>
          ← {cls.name}
        </button>
        <span className="drill-title mathx">
          {topic ? topic.name : 'Mixed set'} — {dateStr}
        </span>
        <span className="drill-rep">
          set {set.n} · rep {Math.min(set.reps + (feedback === null ? 1 : 0), SET_SIZE)}/{SET_SIZE}
        </span>
      </header>

      <main className="drill-main">
        <div className="problem-meta">
          {current.retry && <span className="retry-chip">missed earlier — rep it again</span>}
          {!topic && <span className="topic-tag">{problem.topicName}</span>}
        </div>
        {problem.ask && <p className="ask mathx">{problem.ask}</p>}
        {problem.text && <p className="problem-text">{problem.text}</p>}
        <div className={problem.size === 'small' ? 'problem problem-small' : 'problem'}>
          <MathText latex={problem.latex} display />
        </div>

        <form className="answer-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="answer-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={problem.placeholder ?? 'answer'}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="answer"
          />
          <button className="btn" type="submit">
            {feedback === null ? 'Check' : 'Next'}
          </button>
        </form>

        <div className="feedback">
          {feedback === 'correct' && <p className="fb ok">✓ correct — Enter for next rep</p>}
          {feedback === 'wrong' && (
            <p className="fb bad">
              ✗ <MathText latex={answerDisplay(problem)} /> — comes back in 2 reps
            </p>
          )}
        </div>
      </main>

      <footer className="drill-foot">
        <span>streak {set.streak}</span>
        <span>{acc === null ? '— %' : `${acc} %`}</span>
        <span>{session.pending} queued from misses</span>
      </footer>
    </div>
  )
}
