// Independent checkers for the Test 2 'continuous-cdf' topic. See ../../verify.mjs.
//
// F from f: integrate the displayed pdf numerically. f from F: differentiate
// the displayed cdf by central differences.
import { confirmFormula } from './_lib.mjs'
import { afterCases, area, casesOf, densityOf, eventOf, near, prob, supportOf, texFn, validPdf } from './continuous-pdf.mjs'

// A row condition of a piecewise F as a test on x.
function condTest(cond) {
  let m
  if ((m = cond.match(/^(-?[\d.]+) \\le x \\le (-?[\d.]+)$/))) return x => x >= +m[1] && x <= +m[2]
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
}

export const SAMPLES = {
  'continuous-cdf/derive': 400,
  'continuous-cdf/value': 400,
  'continuous-cdf/pdf': 400,
  'continuous-cdf/pdf-value': 400,
  'continuous-cdf/interval': 400,
}
