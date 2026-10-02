import { useEffect, useMemo, useState } from 'react'
import MathText from './MathText.jsx'

const TAB_NAMES = { binomial19: 'Binomial (n = 19)', binomial: 'Binomial (n = 20)', normal: 'Normal (z)', chi2: 'χ²' }

// While an overlay is open it owns the keyboard: Escape closes it, and drill
// shortcuts (1-4, Enter) don't reach the problem underneath.
function useOverlayKeys(onClose) {
  useEffect(() => {
    function onKey(e) {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [onClose])
}

// Full-screen sheet with the printed tables a test hands out. Tap a cell to
// light up its row and column, the way you'd run a finger along the paper.
export default function Tables({ tables, which, onClose }) {
  const names = which.filter(w => tables[w])
  const [tab, setTab] = useState(names[0])

  useOverlayKeys(onClose)

  return (
    <div className="overlay-sheet" role="dialog" aria-modal="true" aria-label="Tables">
      <div className="overlay-head">
        <div className="overlay-tabs" role="tablist">
          {names.map(n => (
            <button key={n} role="tab" aria-selected={tab === n} className={tab === n ? 'on' : ''} onClick={() => setTab(n)}>
              {TAB_NAMES[n]}
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="overlay-body">{tab && <TableView key={tab} table={tables[tab]} />}</div>
    </div>
  )
}

function TableView({ table }) {
  const [at, setAt] = useState(null)
  return (
    <>
      <h3 className="mathx table-title">{table.title}</h3>
      <p className="table-note">{table.note}</p>
      <div className="table-scroll">
        <table className="ptable">
          <thead>
            <tr>
              <th className="corner">{table.corner}</th>
              {table.cols.map((c, j) => (
                <th key={c} className={at && at[1] === j ? 'hit' : ''}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={r.label}>
                <th className={at && at[0] === i ? 'hit' : ''}>{r.label}</th>
                {r.values.map((v, j) => {
                  const here = at && at[0] === i && at[1] === j
                  const line = at && (at[0] === i || at[1] === j)
                  return (
                    <td key={j} className={here ? 'here' : line ? 'line' : ''} onClick={() => setAt(here ? null : [i, j])}>
                      {v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// The formula sheet the test gives you, plus (on request) what it leaves out.
export function Sheet({ sheet, onClose, withKnow = false }) {
  const [shown, setShown] = useState({})
  useOverlayKeys(onClose)

  return (
    <div className="overlay-sheet" role="dialog" aria-modal="true" aria-label="Formula sheet">
      <div className="overlay-head">
        <h2 className="mathx">Formula sheet</h2>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="overlay-body">
        <FormulaGroup title="Given on the test" lines={sheet.given} />
        {sheet.maybe?.length > 0 && <FormulaGroup title="Possibly given" lines={sheet.maybe} />}
        <p className="table-note">Anything you are asked to derive will not be on the sheet. Tables are provided.</p>
        {withKnow && sheet.know?.length > 0 && (
          <section className="learn-section">
            <h3>Not on the sheet: know these cold</h3>
            <p className="table-note">Say each one first, then tap to check yourself.</p>
            <div className="formula-grid">
              {sheet.know.map((f, i) => (
                <button key={i} className="formula-card know-card" onClick={() => setShown(s => ({ ...s, [i]: !s[i] }))}>
                  <p className="formula-label">{f.label}</p>
                  {shown[i] ? <MathText latex={f.latex} display /> : <p className="know-hidden">tap to check</p>}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function FormulaGroup({ title, lines }) {
  return (
    <section className="learn-section">
      <h3>{title}</h3>
      <div className="formula-grid">
        {lines.map((f, i) => (
          <div key={i} className="formula-card">
            <p className="formula-label">{f.label}</p>
            <MathText latex={f.latex} display />
          </div>
        ))}
      </div>
    </section>
  )
}

// Tables and sheet buttons for a toolbar, plus the overlays they open. A unit
// opts in with `sheet` ({ given, maybe, know }) and `tables` (names) plus
// `printedTables()` (the data).
export function useStudyAids(unit, { know = false } = {}) {
  const [open, setOpen] = useState(null) // null | 'tables' | 'sheet'
  const tables = useMemo(() => (unit?.tables?.length && unit.printedTables ? unit.printedTables() : null), [unit])
  const buttons = (
    <>
      {unit?.sheet && (
        <button className={`tool-btn ${open === 'sheet' ? 'on' : ''}`} onClick={() => setOpen('sheet')}>
          Formula sheet
        </button>
      )}
      {tables && (
        <button className={`tool-btn ${open === 'tables' ? 'on' : ''}`} onClick={() => setOpen('tables')}>
          Tables
        </button>
      )}
    </>
  )
  const overlay =
    open === 'tables' && tables ? (
      <Tables tables={tables} which={unit.tables} onClose={() => setOpen(null)} />
    ) : open === 'sheet' && unit?.sheet ? (
      <Sheet sheet={unit.sheet} withKnow={know} onClose={() => setOpen(null)} />
    ) : null
  return { buttons, overlay, open: open !== null, has: Boolean(unit?.sheet || tables) }
}
