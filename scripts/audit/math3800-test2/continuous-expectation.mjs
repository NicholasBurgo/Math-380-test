// Independent checkers for the Test 2 'continuous-expectation' topic. See ../../verify.mjs.
//
// A continuous moment is a numerical integral of x^k·f(x) for the displayed f.
// A discrete one reads the pdf back off the problem (a table, or a formula
// evaluated at each listed x) and adds x^k·f(x) directly.
import { afterCases, area, densityOf, near, texFn, validPdf } from './continuous-pdf.mjs'

const pdfChecked = latex => validPdf(densityOf(latex))

// E[H(X)] = ∫ H(x) f(x) dx over the support.
const expect = (d, H) => area(x => H(x) * d.g(x), d.lo, d.hi)

// ---------- discrete (shared with continuous-cdf.mjs) ----------

// The two rows of a displayed \begin{array}: [[label, ...cells], [label, ...cells]].
export function arrayRows(latex) {
  const m = latex.match(/\\begin\{array\}\{[^}]*\}(.*?)\\end\{array\}/)
  if (!m) return null
  const rows = m[1].split('\\\\').map(r => r.replace('\\hline', '').split('&').map(s => s.trim()))
  if (rows.length !== 2 || rows[0].length !== rows[1].length || rows[0][0] !== 'x') throw new Error(`unrecognized table ${m[0]}`)
  return rows
}

// The displayed discrete pdf as [{ x, p }]: a table with an f(x) row, or
// "f(x) = formula, \quad x = 1, 2, 3" with the formula evaluated at each x.
// Throws unless the x values are distinct, every p ≥ 0, and they add to 1.
export function discreteOf(latex) {
  let pts
  const rows = arrayRows(latex)
  if (rows) {
    if (rows[1][0] !== 'f(x)') throw new Error(`expected an f(x) row, got ${rows[1][0]}`)
    pts = rows[0].slice(1).map((s, i) => ({ x: Number(s), p: Number(rows[1][i + 1]) }))
  } else {
    const m = latex.match(/f\(x\) = (.+?), \\quad x = (-?\d+(?:, -?\d+)*)/)
    if (!m) throw new Error(`no discrete pdf in ${latex}`)
    const f = texFn(m[1])
    pts = m[2].split(', ').map(s => ({ x: Number(s), p: f(Number(s)) }))
  }
  if (pts.some(t => !Number.isFinite(t.x) || !(t.p >= 0))) throw new Error('a value or probability is unreadable or negative')
  if (new Set(pts.map(t => t.x)).size !== pts.length) throw new Error('an x value repeats')
  const sum = pts.reduce((s, t) => s + t.p, 0)
  if (Math.abs(sum - 1) > 1e-9) throw new Error(`the probabilities add to ${sum}, not 1`)
  return pts
}

// E(X^k) = Σ x^k f(x)
const moment = (pts, k) => pts.reduce((s, t) => s + t.x ** k * t.p, 0)

// What the problem asks, on the last line of the stack.
const lastRow = latex => latex.slice(latex.lastIndexOf('\\\\'))

export const derive = {
  'continuous-expectation/mean'(p) {
    return near(expect(pdfChecked(p.latex), x => x), p)
  },
  'continuous-expectation/second-moment'(p) {
    return near(expect(pdfChecked(p.latex), x => x * x), p)
  },
  'continuous-expectation/variance'(p) {
    const d = pdfChecked(p.latex)
    const v = expect(d, x => x * x) - expect(d, x => x) ** 2
    const asked = afterCases(p.latex)
    if (asked.includes('\\operatorname{Var}')) return near(v, p)
    if (/\\\\ \\sigma = /.test(asked)) return near(Math.sqrt(v), p)
    throw new Error(`unrecognized ask ${asked}`)
  },
  'continuous-expectation/discrete-mean'(p) {
    if (!/E\(X\) = \\,\?/.test(lastRow(p.latex))) throw new Error('E(X) not asked')
    return near(moment(discreteOf(p.latex), 1), p)
  },
  'continuous-expectation/discrete-var'(p) {
    const pts = discreteOf(p.latex)
    const asked = lastRow(p.latex)
    const v = moment(pts, 2) - moment(pts, 1) ** 2
    if (asked.includes('E(X^{2})')) return near(moment(pts, 2), p)
    if (asked.includes('\\operatorname{Var}')) return near(v, p)
    if (/\\\\ \\sigma = /.test(asked)) return near(Math.sqrt(v), p)
    throw new Error(`unrecognized ask ${asked}`)
  },
}

export const SAMPLES = {
  'continuous-expectation/mean': 400,
  'continuous-expectation/second-moment': 400,
  'continuous-expectation/variance': 400,
}
