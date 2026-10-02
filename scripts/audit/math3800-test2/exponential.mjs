// Independent checkers for the Test 2 'exponential' topic. See ../../verify.mjs.
//
// The rate is read back out of the story ("3 per hour" or "1 every 5 hours")
// and converted to the unit W is measured in. Probabilities then come from
// integrating the exponential density numerically, and "W > t" from the chance
// that a Poisson count is 0, summed as a series. Moments are integrals too.
// A typed cdf must match 1 − P(no events by x), and a typed pdf the slope of that.
import { confirmFormula, integrate } from './_lib.mjs'

const SECONDS = { second: 1, minute: 60, hour: 3600, day: 86400 }

// Simpson's rule with one Richardson step: accurate to ~1e-14 relative here.
const precise = (f, a, b, n = 4000) => (16 * integrate(f, a, b, 2 * n) - integrate(f, a, b, n)) / 15

// The mean wait β, in the unit W is measured in.
function meanWait(text) {
  const w = text.match(/W is the wait, in (second|minute|hour|day)s,/)
  if (!w) throw new Error(`no unit for W in "${text}"`)
  const wUnit = SECONDS[w[1]]
  let m
  if ((m = text.match(/1 every (\d+(?:\.\d+)?) (second|minute|hour|day)s?\b/))) return (Number(m[1]) * SECONDS[m[2]]) / wUnit
  if ((m = text.match(/rate of (\d+(?:\.\d+)?) per (second|minute|hour|day)\b/))) {
    const perW = (Number(m[1]) * wUnit) / SECONDS[m[2]] // events per unit of W
    return 1 / perW
  }
  throw new Error(`no rate in "${text}"`)
}

const density = beta => x => Math.exp(-x / beta) / beta
const below = (beta, t) => precise(density(beta), 0, t, 1000)
const between = (beta, a, b) => precise(density(beta), a, b, 1000)
// P(no events by t): the Poisson count has mean t/β, and P(0) = 1/e^(t/β), with
// e^(t/β) summed from its Maclaurin series.
function noEvents(beta, t) {
  const mu = t / beta
  let term = 1
  let sum = 1
  for (let k = 1; k < 80; k++) {
    term *= mu / k
    sum += term
  }
  return 1 / sum
}
function moments(beta) {
  const f = density(beta)
  const L = 45 * beta
  const mean = precise(x => x * f(x), 0, L)
  const second = precise(x => x * x * f(x), 0, L)
  return { mean, variance: second - mean * mean }
}

// central difference, accurate to ~1e-10 relative on these smooth curves
const slope = (g, x) => {
  const h = 1e-5 * x
  return (g(x + h) - g(x - h)) / (2 * h)
}

const num = '(\\d+(?:\\.\\d+)?)'

export const derive = {
  'exponential/at-most'(p) {
    const m = p.latex.match(new RegExp(`P\\(W (?:<|\\\\le) ${num}\\)`))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return below(meanWait(p.text), Number(m[1]))
  },
  'exponential/units'(p) {
    const beta = meanWait(p.text)
    const m = p.latex.match(new RegExp(`P\\(W (>|\\\\le) ${num}\\)`))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return m[1] === '>' ? noEvents(beta, Number(m[2])) : below(beta, Number(m[2]))
  },
  'exponential/more-than'(p) {
    const m = p.latex.match(new RegExp(`P\\(W > ${num}\\)`))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return noEvents(meanWait(p.text), Number(m[1]))
  },
  'exponential/between'(p) {
    const m = p.latex.match(new RegExp(`P\\(${num} < W < ${num}\\)`))
    if (!m || Number(m[1]) >= Number(m[2])) throw new Error(`unrecognized ${p.latex}`)
    return between(meanWait(p.text), Number(m[1]), Number(m[2]))
  },
  'exponential/pdf'(p) {
    const beta = meanWait(p.text)
    const F = x => 1 - noEvents(beta, x)
    const pts = [0.2, 0.75, 1.4, 3.1].map(r => ({ x: r * beta }))
    if (p.latex.startsWith('F(x) = P(W \\le x)')) return confirmFormula(p, e => F(e.x), pts)
    if (p.latex.startsWith('f(x)')) return confirmFormula(p, e => slope(F, e.x), pts)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'exponential/mean-var'(p) {
    const beta = meanWait(p.text)
    const { mean, variance } = moments(beta)
    if (p.latex.startsWith('E[W]')) return mean
    if (p.latex.includes('\\operatorname{Var}')) return variance
    if (p.latex.startsWith('\\sigma_W')) return Math.sqrt(variance)
    const r = p.latex.match(/\\lambda = \\,\? \\text\{ per (second|minute|hour|day)\}/)
    if (r) {
      // events per unit of W is 1/E[W]; restate it per the unit asked for
      const w = p.text.match(/W is the wait, in (second|minute|hour|day)s,/)
      return (1 / mean) * (SECONDS[r[1]] / SECONDS[w[1]])
    }
    throw new Error(`unrecognized ask ${p.latex}`)
  },
}

export const SAMPLES = {
  'exponential/at-most': 600,
  'exponential/units': 600,
  'exponential/more-than': 600,
  'exponential/between': 600,
  'exponential/pdf': 600,
  'exponential/mean-var': 500,
}
