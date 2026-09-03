import { useEffect, useMemo, useRef, useState } from 'react'
import MathText from './MathText.jsx'
import ScratchPad from './ScratchPad.jsx'
import { createSession } from '../engine/drill.js'
import { checkAnswer } from '../engine/check.js'
import { buildChoices } from '../engine/choices.js'
import { recordAnswer, recordPage } from '../engine/stats.js'
import { pickWeightedTopic, randomTemplate } from '../engine/pick.js'

const SET_SIZE = 20

function answerDisplay(p) {
  return p.answerLatex ?? String(p.answer)
}

function loadPref(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function savePref(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // fine, preference just won't stick
  }
}

export default function Drill({ cls, topic, unit, onExit }) {
  const session = useMemo(
    () =>
      createSession(() => {
        const pool = topic ? [topic] : unit ? unit.topics : cls.units.flatMap(u => u.topics)
        const t = topic ?? pickWeightedTopic(cls.id, pool)
        return { topicId: t.id, topicName: t.name, ...randomTemplate(t).generate() }
      }),
    [cls, topic, unit],
  )

  const [current, setCurrent] = useState(() => session.next())
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [picked, setPicked] = useState(null)
  const [mode, setModeState] = useState(() => loadPref('mathreps.answerMode', 'typed'))
  const [scratch, setScratchState] = useState(() => loadPref('mathreps.scratch', '0') === '1')
  const [set, setSet] = useState({ n: 1, reps: 0, correct: 0, streak: 0, best: 0, misses: {} })
  const [summary, setSummary] = useState(null)
  const inputRef = useRef(null)

  const problem = current.problem

  const choices = useMemo(() => {
    if (mode !== 'choices' || summary) return null
    problem._choices ??= buildChoices(problem)
    return problem._choices
  }, [mode, problem, summary])

  useEffect(() => {
    if (!summary && mode === 'typed') inputRef.current?.focus()
  }, [current, feedback, summary, mode])

  function setMode(m) {
    setModeState(m)
    savePref('mathreps.answerMode', m)
  }

  function toggleScratch() {
    setScratchState(s => {
      savePref('mathreps.scratch', s ? '0' : '1')
      return !s
    })
  }

  function applyAnswer(ok) {
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

  function handleSubmit(e) {
    e.preventDefault()
    if (feedback !== null) {
      advance()
      return
    }
    if (!input.trim()) return
    applyAnswer(checkAnswer(input, problem))
  }

  function submitChoice(choice, index) {
    if (feedback !== null) return
    setPicked(index)
    applyAnswer(choice.correct)
  }

  function advance() {
    setFeedback(null)
    setPicked(null)
    setInput('')
    if (set.reps >= SET_SIZE) {
      const topMisses = Object.values(set.misses)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
      const page = {
        date: new Date().toISOString(),
        topicId: topic?.id ?? `${unit?.id ?? 'class'}-mixed`,
        topicName: topic?.name ?? `${unit?.name ?? cls.name} mixed`,
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

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        onExit()
        return
      }
      if (mode !== 'choices' || summary) return
      if (feedback === null && ['1', '2', '3', '4'].includes(e.key)) {
        const c = choices?.[Number(e.key) - 1]
        if (c) submitChoice(c, Number(e.key) - 1)
      } else if (feedback !== null && e.key === 'Enter') {
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const acc = set.reps ? Math.round((100 * set.correct) / set.reps) : null

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
            Set {summary.setNumber}: {summary.topicName}
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
            <p className="summary-clean">Clean set. Nothing missed.</p>
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
          {topic ? topic.name : `${unit?.name ?? cls.name} mixed`} · {dateStr}
        </span>
        <span className="drill-rep">
          set {set.n} · rep {Math.min(set.reps + (feedback === null ? 1 : 0), SET_SIZE)}/{SET_SIZE}
        </span>
      </header>

      <div className="drill-tools">
        <div
          className="mode-toggle"
          role="group"
          aria-label="answer mode"
          title={set.reps > 0 ? 'Answer mode is locked until the set ends' : undefined}
        >
          <button
            className={mode === 'typed' ? 'on' : ''}
            disabled={set.reps > 0 || feedback !== null}
            onClick={() => setMode('typed')}
          >
            Typed
          </button>
          <button
            className={mode === 'choices' ? 'on' : ''}
            disabled={set.reps > 0 || feedback !== null}
            onClick={() => setMode('choices')}
          >
            Choices
          </button>
        </div>
        <button className={`tool-btn ${scratch ? 'on' : ''}`} onClick={toggleScratch}>
          ✎ Scratch
        </button>
      </div>

      <main className="drill-main">
        <div className="problem-meta">
          {current.retry && <span className="retry-chip">missed earlier · rep it again</span>}
          {!topic && <span className="topic-tag">{problem.topicName}</span>}
        </div>
        {problem.ask && <p className="ask mathx">{problem.ask}</p>}
        {problem.text && <p className="problem-text">{problem.text}</p>}
        <div className={problem.size === 'small' ? 'problem problem-small' : 'problem'}>
          <MathText latex={problem.latex} display />
        </div>

        {mode === 'typed' ? (
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
        ) : (
          <div className="choices-zone">
            <div className={`choices ${choices?.length === 2 ? 'two' : ''}`}>
              {choices?.map((c, i) => {
                let cls2 = 'choice'
                if (feedback !== null && c.correct) cls2 += ' right'
                else if (feedback !== null && picked === i) cls2 += ' picked-wrong'
                return (
                  <button
                    key={i}
                    className={cls2}
                    onClick={() => submitChoice(c, i)}
                    disabled={feedback !== null}
                  >
                    <span className="choice-key">{i + 1}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
            {feedback !== null && (
              <button className="btn choices-next" onClick={advance}>
                Next
              </button>
            )}
          </div>
        )}

        <div className="feedback">
          {feedback === 'correct' && <p className="fb ok">✓ correct · Enter for next rep</p>}
          {feedback === 'wrong' && (
            <p className="fb bad">
              ✗ <MathText latex={answerDisplay(problem)} /> · comes back in 2 reps
            </p>
          )}
          {feedback === 'wrong' && problem.hint && (
            <div className="hint-card">
              {problem.hint.latex && <MathText latex={problem.hint.latex} />}
              <p>{problem.hint.text}</p>
            </div>
          )}
        </div>

        {scratch && <ScratchPad clearKey={current} />}
      </main>

      <footer className="drill-foot">
        <span>streak {set.streak}</span>
        <span>{acc === null ? '- %' : `${acc} %`}</span>
        <span>{session.pending} queued from misses</span>
      </footer>
    </div>
  )
}
