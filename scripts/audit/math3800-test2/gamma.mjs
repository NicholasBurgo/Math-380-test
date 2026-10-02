// Independent checkers for the Test 2 'gamma' topic. See ../../verify.mjs.
//
// Every value comes from integrating the displayed integrand numerically, never
// from Γ formulas: ∫_0^∞ x^p e^(-x/b) dx by Simpson's rule after x = u², which
// keeps the integrand smooth even for half-integer p (u^(2p+1) is then a whole
// power). The tail past u² = b(2p + 90) is far below double precision.
import { integrate } from './_lib.mjs'

function weightedIntegral(p, b) {
  return integrate(u => 2 * Math.pow(u, 2 * p + 1) * Math.exp(-(u * u) / b), 0, Math.sqrt(b * (2 * p + 90)), 6000)
}
const gammaFn = a => weightedIntegral(a - 1, 1)

// A numerical value pinned to the exact multiple of 1/den it has to be; throws
// when it is not one (then the displayed problem has no clean answer).
function exact(v, den = 1024) {
  const r = Math.round(v * den) / den
  if (Math.abs(v - r) > 1e-7 * Math.max(1, Math.abs(v))) throw new Error(`${v} is not a multiple of 1/${den}`)
  return r
}

// Γ arguments in order of appearance, written 2.5 or \tfrac{5}{2}
const ARG = /\\Gamma(?:\\left)?\((?:\\tfrac\{(\d+)\}\{(\d+)\}|(\d+(?:\.\d+)?))(?:\\right)?\)/g
const gammaArgs = latex => [...latex.matchAll(ARG)].map(m => (m[3] !== undefined ? Number(m[3]) : Number(m[1]) / Number(m[2])))

// The integrand x^m e^(-x/b) as displayed: x or x^{m}; e^{-x/b}, e^{-x}, or e^{-kx}
function power(latex) {
  const m = latex.match(/x\^\{(\d+)\}\\,e\^/)
  if (m) return Number(m[1])
  if (/[ ,]x\\,e\^/.test(latex)) return 1
  throw new Error(`no power of x in ${latex}`)
}
function scale(latex) {
  let m
  if ((m = latex.match(/e\^\{-x\/(\d+(?:\.\d+)?)\}/))) return Number(m[1])
  if ((m = latex.match(/e\^\{-(\d+)x\}/))) return 1 / Number(m[1])
  if (/e\^\{-x\}/.test(latex)) return 1
  throw new Error(`no exponential in ${latex}`)
}

// Mean and variance of the density proportional to x^p e^(-x/b), by integration.
function moments(p, b) {
  const m0 = weightedIntegral(p, b)
  const mean = exact(weightedIntegral(p + 1, b) / m0)
  const variance = exact(weightedIntegral(p + 2, b) / m0 - mean * mean)
  return { mean, variance }
}
// chi-squared with g degrees of freedom: density proportional to x^(g/2 - 1) e^(-x/2)
const chiMoments = new Map()
function chi(g) {
  if (!chiMoments.has(g)) chiMoments.set(g, moments(g / 2 - 1, 2))
  return chiMoments.get(g)
}

export const derive = {
  'gamma/factorial'(p) {
    const m = p.latex.match(/z\^\{(\d+)\}e\^\{-z\}/)
    if (m) return exact(weightedIntegral(Number(m[1]), 1), 1)
    const args = gammaArgs(p.latex)
    if (args.length !== 1) throw new Error(`unrecognized ${p.latex}`)
    return exact(gammaFn(args[0]), 1)
  },
  'gamma/integral': p => exact(weightedIntegral(power(p.latex), scale(p.latex))),
  'gamma/constant': p => 1 / exact(weightedIntegral(power(p.latex), scale(p.latex))),
  'gamma/mean-var'(p) {
    let pw
    let b
    const t = p.text.match(/α = (\d+(?:\.\d+)?) and β = (\d+(?:\.\d+)?)/)
    if (t) {
      pw = Number(t[1]) - 1
      b = Number(t[2])
    } else {
      pw = power(p.latex)
      b = scale(p.latex)
      const D = p.latex.match(/\\frac\{1\}\{(\d+)\}/)
      if (!D || Math.abs(weightedIntegral(pw, b) / Number(D[1]) - 1) > 1e-9) throw new Error('the constant does not make f a pdf')
    }
    const { mean, variance } = moments(pw, b)
    if (p.latex.includes('E[X]')) return mean
    if (p.latex.includes('\\operatorname{Var}')) return variance
    if (p.latex.includes('\\sigma_X')) return Math.sqrt(variance)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'gamma/chi-squared'(p) {
    const g = p.text.match(/γ = (\d+) degrees/)
    if (g) {
      const { mean, variance } = chi(Number(g[1]))
      // a gamma density has mean αβ and variance αβ², so α = mean²/variance and β = variance/mean
      if (p.latex.startsWith('\\alpha')) return exact((mean * mean) / variance)
      if (p.latex.startsWith('\\beta')) return exact(variance / mean)
      if (p.latex.startsWith('E[X]')) return mean
      if (p.latex.includes('\\operatorname{Var}')) return variance
      throw new Error(`unrecognized ask ${p.latex}`)
    }
    // a gamma variable named by α and β: the chi-squared whose moments match it
    const t = p.text.match(/α = (\d+(?:\.\d+)?) and β = (\d+(?:\.\d+)?)/)
    if (!t || !p.latex.startsWith('\\gamma')) throw new Error(`unrecognized problem ${p.text}`)
    const target = moments(Number(t[1]) - 1, Number(t[2]))
    const hits = []
    for (let df = 1; df <= 60; df++) {
      const c = chi(df)
      if (c.mean === target.mean && c.variance === target.variance) hits.push(df)
    }
    if (hits.length !== 1) throw new Error(`${hits.length} chi-squared distributions match`)
    return hits[0]
  },
}

export const SAMPLES = {
  'gamma/factorial': 500,
  'gamma/integral': 400,
  'gamma/constant': 400,
  'gamma/mean-var': 400,
  'gamma/chi-squared': 500,
}
