// Independent checkers for the Test 2 'continuous-cdf' topic. See ../../verify.mjs.
//
// F from f: integrate the displayed pdf numerically. f from F: differentiate
// the displayed cdf by central differences. Discrete: add up the displayed
// pdf's values, or read each jump of the displayed step cdf as F(x) minus F
// just left of x.
import { confirmFormula, decimals } from './_lib.mjs'
import { afterCases, area, casesOf, densityOf, eventOf, near, prob, supportOf, texFn, validPdf } from './continuous-pdf.mjs'
import { arrayRows, discreteOf } from './continuous-expectation.mjs'

// A row condition of a piecewise F as a test on x.
function condTest(cond) {
  let m
  if ((m = cond.match(/^(-?[\d.]+) \\le x \\le (-?[\d.]+)$/))) return x => x >= +m[1] && x <= +m[2]
  if ((m = cond.match(/^(-?[\d.]+) \\le x < (-?[\d.]+)$/))) return x => x >= +m[1] && x < +m[2]
  if ((m = cond.match(/^x < (-?[\d.]+)$/))) return x => x < +m[1]
  if ((m = cond.match(/^x \\le (-?[\d.]+)$/))) return x => x <= +m[1]
  if ((m = cond.match(/^x > (-?[\d.]+)$/))) return x => x > +m[1]
  if ((m = cond.match(/^x \\ge (-?[\d.]+)$/))) return x => x >= +m[1]
  throw new Error(`unrecognized condition ${cond}`)
}

const slope = (g, x) => {
  const h = 1e-5 * Math.max(1, Math.abs(x))
  return (g(x + h) - g(x - h)) / (2 * h)
}

// The cdf shown as F(x) = \begin{cases} ... \end{cases}: F everywhere, and the
// support of its nonconstant piece. Throws unless it really is a cdf.
function cdfOf(latex) {
  const rows = casesOf(latex, 'F(x)').map(r => ({ ...r, test: condTest(r.cond), g: texFn(r.expr) }))
  const F = x => {
    const hit = rows.filter(r => r.test(x))
    if (hit.length !== 1) throw new Error(`${hit.length} pieces of F cover x = ${x}`)
    return hit[0].g(x)
  }
  const mid = rows.filter(r => r.expr !== '0' && r.expr !== '1')
  if (mid.length !== 1) throw new Error('expected one nonconstant piece')
  const [lo, hi] = supportOf(mid[0].cond)
  const top = hi === Infinity ? mid[0].g(1e6) : mid[0].g(hi)
  if (Math.abs(mid[0].g(lo)) > 1e-9 || Math.abs(top - 1) > 1e-6) throw new Error('F does not run from 0 to 1')
  for (const x of insidePoints(lo, hi)) if (slope(F, x) < 0) throw new Error('F decreases')
  return { F, lo, hi }
}

// A discrete cdf as printed (a step function in cases form, or a table of F
// values) as the probability at each x where F jumps: [{ x, p }], with p = F(x)
// minus F just left of x. Throws unless the cases cover every x exactly once
// and F climbs from 0 to 1 without stepping down.
function jumpsOf(latex) {
  let F
  let at
  const rows = arrayRows(latex)
  if (rows) {
    if (rows[1][0] !== 'F(x)') throw new Error(`expected an F(x) row, got ${rows[1][0]}`)
    const listed = rows[0].slice(1).map((s, i) => ({ x: Number(s), F: texFn(rows[1][i + 1])(0) }))
    if (listed.some((t, i) => i > 0 && t.x <= listed[i - 1].x)) throw new Error('the x row is not increasing')
    // F holds its last listed value until the next listed x
    F = x => listed.reduce((v, t) => (t.x <= x ? t.F : v), 0)
    at = listed.map(t => t.x)
  } else {
    const pieces = casesOf(latex, 'F(x)').map(r => ({ test: condTest(r.cond), v: texFn(r.expr)(0) }))
    F = x => {
      const hit = pieces.filter(r => r.test(x))
      if (hit.length !== 1) throw new Error(`${hit.length} pieces of F cover x = ${x}`)
      return hit[0].v
    }
    at = [...new Set(casesOf(latex, 'F(x)').flatMap(r => decimals(r.cond)))].sort((a, b) => a - b)
  }
  const eps = 1e-9
  const probes = [at[0] - 100, ...at.flatMap((x, i) => [x - eps, x, x + eps, (x + (at[i + 1] ?? x + 2)) / 2]), at[at.length - 1] + 100]
  const Fs = probes.map(F)
  if (Fs.some((v, i) => i > 0 && v < Fs[i - 1] - 1e-12)) throw new Error('F steps down')
  if (Math.abs(Fs[0]) > 1e-12 || Math.abs(Fs[Fs.length - 1] - 1) > 1e-12) throw new Error('F does not run from 0 to 1')
  return at.map(x => ({ x, p: F(x) - F(x - eps) })).filter(t => t.p > 1e-12)
}

const insidePoints = (lo, hi) => (hi === Infinity ? [0.35, 1.4, 3.3].map(r => lo + r) : [0.17, 0.43, 0.71, 0.93].map(r => lo + r * (hi - lo)))
const asked = (latex, name) => {
  const m = latex.match(new RegExp(`${name}\\((-?[\\d.]+)\\) = \\\\,\\?`))
  if (!m) throw new Error(`no ${name}(x0) asked in ${latex}`)
  return +m[1]
}

export const derive = {
  'continuous-cdf/derive'(p) {
    const d = validPdf(densityOf(p.latex))
    const pts = insidePoints(d.lo, d.hi).map(x => ({ x }))
    return confirmFormula(p, e => area(d.g, d.lo, e.x), pts)
  },
  'continuous-cdf/value'(p) {
    const d = validPdf(densityOf(p.latex))
    return near(prob(d, -Infinity, asked(p.latex, 'F')), p)
  },
  'continuous-cdf/pdf'(p) {
    const c = cdfOf(p.latex)
    return confirmFormula(p, e => slope(c.F, e.x), insidePoints(c.lo, c.hi).map(x => ({ x })))
  },
  'continuous-cdf/pdf-value'(p) {
    const c = cdfOf(p.latex)
    return near(slope(c.F, asked(p.latex, 'f')), p, 1e-6)
  },
  'continuous-cdf/interval'(p) {
    const c = cdfOf(p.latex)
    const [a, b] = eventOf(afterCases(p.latex))
    return near(c.F(b) - c.F(a), p)
  },
  'continuous-cdf/discrete-cdf'(p) {
    const x0 = asked(p.latex, 'F')
    return near(discreteOf(p.latex).reduce((s, t) => s + (t.x <= x0 ? t.p : 0), 0), p)
  },
  'continuous-cdf/discrete-pdf'(p) {
    const pts = jumpsOf(p.latex)
    const row = p.latex.slice(p.latex.lastIndexOf('\\\\'))
    let m
    if ((m = row.match(/f\((-?[\d.]+)\) = \\,\?/))) return near(pts.reduce((s, t) => s + (t.x === +m[1] ? t.p : 0), 0), p)
    if ((m = row.match(/P\((-?[\d.]+) (<|\\le) X (<|\\le) (-?[\d.]+)\) = \\,\?/))) {
      const [a, b] = [+m[1], +m[4]]
      const inside = x => (m[2] === '<' ? x > a : x >= a) && (m[3] === '<' ? x < b : x <= b)
      return near(pts.reduce((s, t) => s + (inside(t.x) ? t.p : 0), 0), p)
    }
    throw new Error(`unrecognized ask ${row}`)
  },
}

export const SAMPLES = {
  'continuous-cdf/derive': 400,
  'continuous-cdf/value': 400,
  'continuous-cdf/pdf': 400,
  'continuous-cdf/pdf-value': 400,
  'continuous-cdf/interval': 400,
}
