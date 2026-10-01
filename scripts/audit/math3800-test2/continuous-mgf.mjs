// Independent checkers for the Test 2 'continuous-mgf' topic. See ../../verify.mjs.
//
// The derivations are read off the screen: every displayed line is evaluated
// numerically (integrals included, Γ(α) integrated too) and must equal the
// first line, the definition ∫ e^(tx) f(x) dx. The box then gets its value
// from its own line. No closed-form MGF is used anywhere. Where an MGF exists
// is decided by watching the integrand die off (or not).
import { confirmFormula, integrate } from './_lib.mjs'
import { area, densityOf, exprValue, halfLine, letterOf, rowsOf, texFormula, validPdf } from './continuous-pdf.mjs'
import { parseExpr, evalExpr } from '../../../src/engine/expr.js'

const gammaFn = al => halfLine(z => z ** (al - 1) * Math.exp(-z))
const flatHeight = (a, b) => 1 / integrate(() => 1, a, b, 2)

const VARS = ['t', 'x', 'z', 'beta', 'lambda', 'alpha', 'a', 'b']
// every integral converges here (t below 1, 1/β and λ), and t ≠ 0 for the uniform
const ENVS = [
  { t: 0.15, x: 0.9, beta: 2.5, lambda: 2, alpha: 2.5, a: 0.5, b: 2.5 },
  { t: -0.4, x: 1.6, beta: 0.8, lambda: 0.7, alpha: 2, a: 1, b: 3 },
  { t: 0.1, x: 3.2, beta: 3, lambda: 1.2, alpha: 3, a: -1, b: 0.5 },
].map(e => ({ ...e, G: gammaFn(e.alpha) }))

const BOX = '\\boxed{\\;?\\;}'
// t values for a specific density: below every limit used (1/10 is the smallest), and t ≠ 0
const NUMBER_TS = [{ t: -0.9 }, { t: -0.25 }, { t: 0.04 }]
const close = (u, v) => Math.abs(u - v) <= 1e-7 * Math.max(1, Math.abs(u), Math.abs(v))

// The right side of a row: no "m_X(t) &=", no "E[e^{tX}] =", no trailing ", \quad t < ...".
function rhsOf(row) {
  let s = row.includes('&') ? row.slice(row.indexOf('&') + 1) : row
  s = s.trim().replace(/^= /, '').replace(/^E\[e\^\{tX\}\] = /, '')
  return s.replace(/,\s*\\quad t .*$/, '').trim()
}

// A substitution row "\text{let } z = A: \; x = B, \; dx = C\,dz": the pieces.
function substitution(row) {
  const m = row.match(/z = (.+?): \\; x = (.+?), \\; dx = (.+?)\\,dz/)
  if (!m) throw new Error(`unrecognized substitution ${row}`)
  return { z: texFormula(m[1], VARS), x: texFormula(m[2], VARS), dx: m[3] }
}

// Every displayed line equals the first; a substitution line really inverts z.
function checkLines(rows) {
  for (const env of ENVS) {
    const m0 = rows[0].includes('\\boxed') ? null : exprValue(rhsOf(rows[0]), env, VARS)
    rows.slice(1).forEach((row, k) => {
      if (row.includes('\\boxed')) return
      if (row.includes('\\text{let }')) {
        const sub = substitution(row)
        const zx = sub.z(env)
        const back = sub.x({ ...env, z: zx })
        const h = 1e-5
        const slope = (sub.x({ ...env, z: zx + h }) - sub.x({ ...env, z: zx - h })) / (2 * h)
        const dx = texFormula(sub.dx, VARS)(env)
        if (!close(back, env.x) || !close(slope, dx)) throw new Error(`the substitution on line ${k + 2} is wrong`)
        return
      }
      if (m0 === null) return
      const v = exprValue(rhsOf(row), env, VARS)
      if (!close(v, m0)) throw new Error(`line ${k + 2} gives ${v}, but the definition gives ${m0}`)
    })
  }
}

// The box's value at env, from its own line, the value m of the definition,
// the definition's integrand f0 and its line `first`.
function boxValue(row, env, m, f0, first) {
  const rhs = rhsOf(row)
  // PREFIX ∫ e^{-(c)x} dx = PREFIX/c must equal m
  if (rhs.includes(`e^{-\\left(${BOX}\\right)x}`)) return exprValue(rhs.slice(0, rhs.indexOf('\\int')) || '1', env, VARS) / m
  // e^{box} inside the integrand: the integrands agree point by point
  if (rhs.includes(`e^{${BOX}}`)) {
    const integrand = r => r.match(/\\int_\S+\^\S+ (.+?)\\,dx/)[1]
    const limits = r => r.match(/\\int_\S+\^\S+/)[0]
    if (limits(rhs) !== limits(first)) throw new Error('the combined integral has different limits')
    const scope = { ...env }
    const here = texFormula(integrand(rhs).replace(BOX, '0'), [...VARS, 'G'])(scope)
    const pre = rhs.slice(0, rhs.indexOf('\\int')).trim()
    const factor = pre ? exprValue(pre, env, VARS) : 1
    return Math.log(f0(env) / (factor * here))
  }
  // otherwise the box multiplies its line: line(box = 1) · box = m
  return m / exprValue(rhs.replace(BOX, '1'), env, VARS)
}

// The same few derivations come up again and again: do the numerical work once
// per distinct displayed problem (every sample is still graded in full).
const linesChecked = new Set()
const references = new Map()
function checkLinesOnce(latex) {
  if (linesChecked.has(latex)) return
  checkLines(rowsOf(latex))
  linesChecked.add(latex)
}
function remembered(key, compute) {
  if (!references.has(key)) references.set(key, new Map())
  const seen = references.get(key)
  return env => {
    if (!seen.has(env)) seen.set(env, compute(env))
    return seen.get(env)
  }
}

// A derivation box: the lines must check out, then the box is read off its line.
// `special(env)` covers boxes that are not an equation with the definition.
function derivationBox(p, special) {
  checkLinesOnce(p.latex)
  const key = `${p.ask}|${p.latex}`
  if (special) return confirmFormula(p, remembered(key, special), ENVS)
  const rows = rowsOf(p.latex)
  const boxRow = rows.find(r => r.includes('\\boxed'))
  const first = rhsOf(rows[0])
  const integrand = first.match(/\\int_\S+\^\S+ (.+?)\\,dx/)[1]
  const f0 = texFormula(integrand.replaceAll('\\Gamma(\\alpha)', ' G '), [...VARS, 'G'])
  return confirmFormula(p, remembered(key, env => boxValue(boxRow, env, exprValue(first, env, VARS), f0, first)), ENVS)
}

// f(x) as the ask states it ("f(x) = e^(−x) for x > 0"), in the typed grammar.
function askedDensity(ask) {
  const m = ask.match(/f\(x\) = (.+?) for x > 0/)
  if (!m) throw new Error(`no density in ${ask}`)
  const ast = parseExpr(m[1], ['x'])
  return x => evalExpr(ast, { x })
}

// ---------- where does the MGF exist? ----------

const PARAMS = ['beta', 'lambda', 'a', 'b']

// The first line's integral: limits and integrand as a function of { t, x, beta, lambda, a, b }.
function firstIntegral(latex) {
  const m = latex.match(/\\int_(0|a)\^(\{\\infty\}|b) (.+?)\\,dx/)
  if (!m) throw new Error(`no integral in ${latex}`)
  return { finite: m[2] === 'b', h: texFormula(m[3], ['t', 'x', ...PARAMS]) }
}

// Finite? A finite interval always is; on (0, ∞) the integrand must decay.
function converges(I, env) {
  if (I.finite) return Number.isFinite(integrate(x => I.h({ ...env, x }), env.a, env.b, 200))
  const near = I.h({ ...env, x: 20 })
  const far = I.h({ ...env, x: 40 })
  return far / near < 1 - 1e-9
}

// An option like "t < \frac{1}{\beta}" or "\text{every } t" as a test.
function predicate(opt) {
  if (/^\\text\{every \} t$/.test(opt)) return () => true
  const m = opt.match(/^t (<|>|\\ne) (.+)$/)
  if (!m) throw new Error(`unrecognized option ${opt}`)
  const rhs = texFormula(m[2], PARAMS)
  return env => {
    const r = rhs(env)
    return m[1] === '<' ? env.t < r : m[1] === '>' ? env.t > r : env.t !== r
  }
}

function domainLetter(p) {
  const I = firstIntegral(p.latex)
  const tests = p.options.map(o => predicate(o.latex))
  const envs = []
  for (const [beta, lambda, a, b] of [
    [0.5, 2, 0, 1],
    [2, 0.5, 1, 4],
    [4, 3, -2, 3],
  ]) {
    const base = { beta, lambda, a, b }
    // t on both sides of every boundary any option names, and at it
    const marks = [0, ...p.options.map(o => o.latex.match(/^t \S+ (.+)$/)).filter(Boolean).map(m => texFormula(m[1], PARAMS)(base))]
    for (const r of marks) for (const d of [-1, -0.3, 0, 0.3, 1]) envs.push({ ...base, t: r + d })
  }
  const hits = tests.map((test, i) => (envs.every(env => test(env) === converges(I, env)) ? i : -1)).filter(i => i >= 0)
  if (hits.length !== 1) throw new Error(`${hits.length} options describe where the integral is finite`)
  return 'abcd'[hits[0]]
}

// ---------- why is this step true? ----------

// Algebraic and integral steps are also checked numerically before naming the reason.
function stepHolds(step) {
  const [lhs, rhs] = step.split(' = ')
  if (step.startsWith('e^{tx}e^{-x}')) {
    const L = texFormula(lhs, ['t', 'x'])
    const R = texFormula(rhs, ['t', 'x'])
    return ENVS.every(e => Math.abs(L(e) - R(e)) < 1e-12 * Math.max(1, Math.abs(R(e))))
  }
  if (step.includes('1/\\beta - t')) {
    const L = texFormula(lhs, ['t', 'beta'])
    const R = texFormula(rhs, ['t', 'beta'])
    return ENVS.every(e => Math.abs(L(e) - R(e)) < 1e-12 * Math.max(1, Math.abs(R(e))))
  }
  if (step.startsWith('\\int_0^{\\infty} e^{-(1-t)x}')) {
    const g = texFormula(lhs.slice('\\int_0^{\\infty} '.length).replace('\\,dx', ''), ['t', 'x'])
    const R = texFormula(rhs, ['t'])
    return ENVS.every(e => Math.abs(area(x => g({ t: e.t, x }), 0, Infinity) - R(e)) < 1e-8)
  }
  if (step.startsWith('\\int_a^b e^{tx}')) {
    const R = texFormula(rhs, ['t', 'a', 'b'])
    return ENVS.every(e => Math.abs(integrate(x => Math.exp(e.t * x), e.a, e.b, 2000) - R(e)) < 1e-8)
  }
  return true
}

function reasonFor(step) {
  if (step.startsWith('e^{tx}e^{-x}')) return /add the exponents/
  if (step.startsWith('\\int_0^{\\infty} e^{-(1-t)x}')) return /needs t < 1/
  if (step.includes('z^{\\alpha-1}e^{-z}')) return /gamma function/
  if (step.startsWith('m_X(t) =')) return /Definition of the MGF/
  if (step.includes('1/\\beta - t')) return /Multiply the top and bottom by β/
  if (step.startsWith('\\int_a^b e^{tx}')) return /e\^\(tx\)\/t/
  if (step.startsWith('x = ')) return /Substitute z/
  throw new Error(`unrecognized step ${step}`)
}

export const derive = {
  'continuous-mgf/combine'(p) {
    // the definition with its integrand boxed: e^(tx) times the f(x) the ask states
    if (p.latex.includes(`\\int_0^{\\infty} ${BOX}`)) {
      const f = askedDensity(p.ask)
      return derivationBox(p, e => Math.exp(e.t * e.x) * f(e.x))
    }
    return derivationBox(p)
  },
  'continuous-mgf/integral': p => derivationBox(p),
  'continuous-mgf/domain'(p) {
    checkLinesOnce(p.latex)
    return domainLetter(p)
  },
  'continuous-mgf/exponential': p => derivationBox(p),
  'continuous-mgf/uniform'(p) {
    // the definition with its integrand boxed: e^(tx) times the flat density on [a, b]
    if (p.latex.includes(`= \\int_a^b ${BOX}`)) return derivationBox(p, e => Math.exp(e.t * e.x) * flatHeight(e.a, e.b))
    return derivationBox(p)
  },
  'continuous-mgf/gamma'(p) {
    // dx in the substitution: differentiate the displayed z(x) numerically and invert
    if (p.latex.includes(`dx = ${BOX}`)) {
      const m = p.latex.match(/z = (.+?): \\; x = (.+?), \\; dx = /)
      const z = texFormula(m[1], VARS)
      const x = texFormula(m[2], VARS)
      return derivationBox(p, e => {
        if (!close(x({ ...e, z: z(e) }), e.x)) throw new Error('x = ... does not invert z = ...')
        const h = 1e-5
        return (2 * h) / (z({ ...e, x: e.x + h }) - z({ ...e, x: e.x - h }))
      })
    }
    return derivationBox(p)
  },
  'continuous-mgf/numbers'(p) {
    const d = validPdf(densityOf(p.latex))
    return confirmFormula(p, remembered(p.latex, e => area(x => Math.exp(e.t * x) * d.g(x), d.lo, d.hi)), NUMBER_TS)
  },
  'continuous-mgf/why'(p) {
    if (!stepHolds(p.latex)) throw new Error(`the step ${p.latex} is false`)
    return letterOf(p.options, reasonFor(p.latex))
  },
}

export const SAMPLES = {
  'continuous-mgf/combine': 300,
  'continuous-mgf/integral': 200,
  'continuous-mgf/domain': 400,
  'continuous-mgf/exponential': 300,
  'continuous-mgf/uniform': 300,
  'continuous-mgf/gamma': 300,
  'continuous-mgf/numbers': 400,
  'continuous-mgf/why': 400,
}
