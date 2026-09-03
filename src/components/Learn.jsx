import { useEffect, useState } from 'react'
import MathText from './MathText.jsx'

function answerDisplay(p) {
  return p.answerLatex ?? String(p.answer)
}

export default function Learn({ cls, topic, onExit, onDrill }) {
  const [examples, setExamples] = useState(() => topic.templates.map(t => t.generate()))
  const [shown, setShown] = useState({})

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  function reroll() {
    setExamples(topic.templates.map(t => t.generate()))
    setShown({})
  }

  const learn = topic.learn

  return (
    <div className="sheet learn-sheet">
      <header className="drill-head">
        <button className="btn ghost" onClick={onExit}>
          ← {cls.name}
        </button>
        <span className="drill-title mathx">Learn · {topic.name}</span>
        <span className="drill-rep">
          <button className="btn" onClick={onDrill}>
            Drill this
          </button>
        </span>
      </header>

      {learn?.formulas?.length > 0 && (
        <section className="learn-section">
          <h3>Formulas</h3>
          <div className="formula-grid">
            {learn.formulas.map(f => (
              <div key={f.label} className="formula-card">
                <p className="formula-label">{f.label}</p>
                <MathText latex={f.latex} display />
              </div>
            ))}
          </div>
        </section>
      )}

      {learn?.how?.length > 0 && (
        <section className="learn-section">
          <h3>How to attack it</h3>
          <ul className="how-list">
            {learn.how.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="learn-section">
        <div className="examples-head">
          <h3>Worked examples</h3>
          <button className="btn ghost" onClick={reroll}>
            New numbers
          </button>
        </div>
        <div className="example-list">
          {examples.map((ex, i) => (
            <div key={i} className="example-card">
              {ex.ask && <p className="ask mathx">{ex.ask}</p>}
              {ex.text && <p className="example-text">{ex.text}</p>}
              <div className={ex.size === 'small' ? 'problem problem-small' : 'problem'}>
                <MathText latex={ex.latex} display />
              </div>
              {shown[i] ? (
                <div className="example-solution">
                  <p className="solution-line">
                    <MathText latex={answerDisplay(ex)} />
                  </p>
                  {ex.hint && (
                    <div className="hint-card">
                      {ex.hint.latex && <MathText latex={ex.hint.latex} />}
                      <p>{ex.hint.text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn ghost" onClick={() => setShown(s => ({ ...s, [i]: true }))}>
                  Show solution
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
