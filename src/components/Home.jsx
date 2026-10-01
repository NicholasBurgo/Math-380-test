import { useState } from 'react'
import { classes } from '../classes/index.js'
import { getSkill, heatOf, reviewDue, getPages } from '../engine/stats.js'
import { useStudyAids } from './Tables.jsx'

const HEAT_ORDER = ['cold', 'warm', 'hot', 'mastered']

export default function Home({ onDrill, onLearn, onTest }) {
  return (
    <div className="sheet">
      <header className="home-head">
        <h1 className="mathx">MathReps</h1>
        <p className="sub">Reps build mastery. Pick a topic, run a set of 20.</p>
      </header>

      {classes.map(cls => (
        <ClassBlock key={cls.id} cls={cls} onDrill={onDrill} onLearn={onLearn} onTest={onTest} />
      ))}

      <footer className="site-foot">
        Updated{' '}
        {new Date(__BUILD_DATE__).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}{' '}
        · made by Nicholas Burgo
      </footer>
    </div>
  )
}

function ClassBlock({ cls, onDrill, onLearn, onTest }) {
  const pages = getPages(cls.id).slice(0, 5)

  return (
    <section className="class-block">
      <div className="class-head">
        <div>
          <h2 className="mathx">{cls.name}</h2>
          <p className="class-term">{cls.term}</p>
        </div>
      </div>

      {cls.units.map(unit => (
        <UnitBlock key={unit.id} cls={cls} unit={unit} onDrill={onDrill} onLearn={onLearn} onTest={onTest} />
      ))}

      {pages.length > 0 && (
        <div className="pages">
          <h3>Recent pages</h3>
          <ul>
            {pages.map((p, i) => (
              <li key={i}>
                <span className="page-date">
                  {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="page-topic">{p.topicName}</span>
                <span className="page-score">
                  {p.correct}/{p.reps} · best {p.best}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function UnitBlock({ cls, unit, onDrill, onLearn, onTest }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="unit">
      <div className="unit-head">
        <button className="unit-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <span className={`chev ${open ? 'open' : ''}`}>▸</span>
          <span className="unit-name mathx">{unit.name}</span>
          {unit.detail && <span className="unit-detail">{unit.detail}</span>}
          <span className="unit-count">{unit.topics.length} topics</span>
        </button>
        <button className="btn" onClick={() => onDrill(cls, null, unit)}>
          Mixed set
        </button>
      </div>

      {open && unit.guide && <Guide cls={cls} unit={unit} onDrill={onDrill} onTest={onTest} />}

      {open && (
        <ul className="topic-list">
          {unit.topics.map(t => {
            const s = getSkill(cls.id, t.id)
            const heat = heatOf(s)
            const acc = s && s.attempts ? Math.round((100 * s.correct) / s.attempts) : null
            return (
              <li key={t.id} className="topic-row">
                <div className="topic-main">
                  <span className="topic-name">{t.name}</span>
                  <span className="topic-desc">{t.description}</span>
                </div>
                <span className={`pill ${heat}`}>{heat}</span>
                {reviewDue(s) && <span className="pill due">review due</span>}
                <span className="topic-stats">
                  {s ? `${s.attempts} reps · ${acc}% · best ${s.bestStreak}` : 'no reps yet'}
                </span>
                <button className="btn ghost" onClick={() => onLearn(cls, t)}>
                  Learn
                </button>
                <button className="btn ghost" onClick={() => onDrill(cls, t, unit)}>
                  Drill
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// The test's study guide as a checklist: each "be able to" line, how warm its
// topics are (the coldest one counts), and a mixed set of just those topics.
function Guide({ cls, unit, onDrill, onTest }) {
  const aids = useStudyAids(unit, { know: true })
  const byId = Object.fromEntries(unit.topics.map(t => [t.id, t]))
  return (
    <div className="guide">
      <div className="guide-head">
        <h3 className="mathx">Study guide: be able to</h3>
        <div className="guide-tools">
          {aids.buttons}
          <button className="tool-btn" onClick={() => onTest(cls, unit)}>
            Practice test
          </button>
        </div>
      </div>
      <ul className="guide-list">
        {unit.guide.map((g, i) => {
          const topics = g.topics.map(id => byId[id]).filter(t => t?.templates?.length)
          const heat = topics.length
            ? topics.map(t => heatOf(getSkill(cls.id, t.id))).sort((a, b) => HEAT_ORDER.indexOf(a) - HEAT_ORDER.indexOf(b))[0]
            : 'cold'
          return (
            <li key={i} className="guide-row">
              <span className={`guide-mark ${heat}`} title={heat} aria-label={heat} />
              <span className="guide-text">{g.text}</span>
              {topics.length > 0 && (
                <button
                  className="btn ghost"
                  onClick={() =>
                    onDrill(cls, topics.length === 1 ? topics[0] : null, { ...unit, id: `${unit.id}-guide-${i}`, name: g.short, topics })
                  }
                >
                  Drill
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {aids.overlay}
    </div>
  )
}
