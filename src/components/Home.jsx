import { classes } from '../classes/index.js'
import { getSkill, heatOf, reviewDue, getPages } from '../engine/stats.js'

export default function Home({ onDrill }) {
  return (
    <div className="sheet">
      <header className="home-head">
        <h1 className="mathx">MathReps</h1>
        <p className="sub">Reps build mastery. Pick a topic, run a set of 20.</p>
      </header>

      {classes.map(cls => (
        <ClassBlock key={cls.id} cls={cls} onDrill={onDrill} />
      ))}
    </div>
  )
}

function ClassBlock({ cls, onDrill }) {
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
        <div key={unit.id} className="unit">
          <div className="unit-head">
            <div>
              <h3 className="mathx">{unit.name}</h3>
              {unit.detail && <p className="unit-detail">{unit.detail}</p>}
            </div>
            <button className="btn" onClick={() => onDrill(cls, null, unit)}>
              Mixed set
            </button>
          </div>

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
                  <button className="btn ghost" onClick={() => onDrill(cls, t, unit)}>
                    Drill
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
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
