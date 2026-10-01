// Independent checkers for the Test 2 'geometric-derive' topic. See ../../verify.mjs.
import { confirmFormula, decimals } from './_lib.mjs'

// P(first success on trial x), trial by trial
function f(p, x) {
  let alive = 1
  for (let t = 1; t < x; t++) alive *= 1 - p
  return alive * p
}
const series = (term, from = 1, to = 4000) => {
  let s = 0
  for (let x = from; x <= to; x++) s += term(x)
  return s
}
// E[e^{tX}] summed outcome by outcome: e^{tx} times P(X = x), both built up a
// trial at a time so nothing overflows
function mgfSum(p, t) {
  let s = 0
  let alive = 1 // P(first x - 1 trials fail)
  let w = 1 // e^{tx}
  for (let x = 1; x <= 4000; x++) {
    w *= Math.exp(t)
    s += w * alive * p
    alive *= 1 - p
    if (w * alive < 1e-300) break
  }
  return s
}

// q tied to p (a real geometric distribution), with qe^t < 1 so the series converge
const TIED = [
  { p: 0.35, q: 0.65, t: 0.2, x: 4, k: 3 },
  { p: 0.7, q: 0.3, t: -0.8, x: 2, k: 5 },
  { p: 0.12, q: 0.88, t: 0.05, x: 6, k: 2 },
]
// p and q as free letters
const FREE = [
  { p: 0.4, q: 0.25, t: 0, x: 3, k: 1 },
  { p: 0.15, q: 0.6, t: 0, x: 5, k: 1 },
]

// Which of the four lettered inequalities says "the ratio qe^t is below 1"?
function convergenceLetter(options) {
  const tests = { 't < -\\ln q': (q, t) => t < -Math.log(q), 't > -\\ln q': (q, t) => t > -Math.log(q), 't < \\ln q': (q, t) => t < Math.log(q), 't < q': (q, t) => t < q }
  const samples = []
  for (const q of [0.2, 0.5, 0.9]) for (const t of [-2, -0.5, 0.05, 0.3, 1.2]) samples.push([q, t])
  const hits = options.map((o, i) => {
    const test = tests[o.latex]
    if (!test) throw new Error(`unrecognized option ${o.latex}`)
    return samples.every(([q, t]) => test(q, t) === q * Math.exp(t) < 1) ? 'abcd'[i] : null
  })
  const right = hits.filter(Boolean)
  if (right.length !== 1) throw new Error(`${right.length} options describe convergence`)
  return right[0]
}

// The reason a derivation step holds, read off the step itself.
function reasonFor(step) {
  if (step.includes('\\cdots')) return /independent/
  if (step.includes('E[e^{tX}]')) return /Definition of the MGF/
  if (step.includes('\\sum_{k=1}^{x}')) return /finite geometric series/
  if (step.includes('\\sum_{x=1}^{\\infty} q^{x-1}p')) return /^It is a geometric series/
  if (step.includes('= 1 - q^x')) return /denominator 1 − q equals p/
  throw new Error(`unrecognized step ${step}`)
}

export const derive = {
  'geometric-derive/pdf-box': p => confirmFormula(p, e => f(e.p, e.x), TIED),
  'geometric-derive/show-pdf'(p) {
    if (p.ask.includes('first term')) return confirmFormula(p, e => f(e.p, 1), TIED)
    if (p.ask.includes('ratio')) return confirmFormula(p, e => f(e.p, e.x + 1) / f(e.p, e.x), TIED)
    // the series itself, with free p and q
    return confirmFormula(p, e => series(x => Math.pow(e.q, x - 1) * e.p), FREE)
  },
  'geometric-derive/cdf-series': p => confirmFormula(p, e => series(k => f(e.p, k), 1, e.x), TIED),
  'geometric-derive/cdf-result': p => confirmFormula(p, e => series(k => f(e.p, k), 1, e.x), TIED),
  'geometric-derive/mgf-sum': p => confirmFormula(p, e => Math.exp(e.t * e.x) * f(e.p, e.x), TIED),
  'geometric-derive/mgf-factor': p =>
    confirmFormula(
      p,
      e => mgfSum(e.p, e.t) / series(x => Math.pow(e.q * Math.exp(e.t), x)),
      TIED,
    ),
  'geometric-derive/mgf-series': p => confirmFormula(p, e => series(x => Math.pow(e.q * Math.exp(e.t), x)), TIED),
  'geometric-derive/mgf-result': p => confirmFormula(p, e => mgfSum(e.p, e.t), TIED),
  'geometric-derive/mgf-domain': p => convergenceLetter(p.options),
  'geometric-derive/why'(p) {
    const want = reasonFor(p.latex)
    const i = p.options.findIndex(o => want.test(o))
    if (i < 0 || p.options.filter(o => want.test(o)).length !== 1) throw new Error('no unique reason matches')
    return 'abcd'[i]
  },
  'geometric-derive/numbers'(p) {
    const pr = decimals(p.ask)[0]
    if (p.latex.startsWith('m_X')) {
      return confirmFormula(p, e => mgfSum(pr, e.t), [{ t: -0.7 }, { t: 0.02 }, { t: -2 }])
    }
    return confirmFormula(p, e => series(k => f(pr, k), 1, e.x), [{ x: 1 }, { x: 3 }, { x: 8 }])
  },
}

export const SAMPLES = {
  'geometric-derive/pdf-box': 200,
  'geometric-derive/show-pdf': 300,
  'geometric-derive/cdf-series': 200,
  'geometric-derive/cdf-result': 200,
  'geometric-derive/mgf-sum': 200,
  'geometric-derive/mgf-factor': 200,
  'geometric-derive/mgf-series': 200,
  'geometric-derive/mgf-result': 200,
  'geometric-derive/mgf-domain': 300,
  'geometric-derive/numbers': 400,
}
