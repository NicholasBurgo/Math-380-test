// Independent checkers for the Test 2 'integration' topic. See ../../verify.mjs.
//
// No antiderivative formula is used anywhere. Integrands are read back off the
// problem and integrated numerically: Simpson with a Richardson step, and out
// to ∞ in doubling pieces until they stop adding anything. A typed
// antiderivative F is right when F(b) − F(a) matches the numerical integral on
// several intervals, and every wrong choice has to miss on one of them. In a
// derivation, every line shown so far is checked the same way before the box
// is read off its own line.
import { parseExpr, evalExpr } from '../../../src/engine/expr.js'
import { confirmFormula, integrate } from './_lib.mjs'
import { near, rowsOf, texFn } from './continuous-pdf.mjs'

const BOX = '\\boxed{\\;?\\;}'
const XS = [-1.1, -0.4, 0.3, 0.8, 1.5]
const POINTS = XS.map(x => ({ x }))
const INTERVALS = [
  [-1.2, -0.3],
  [-0.5, 0.4],
  [0.2, 0.9],
  [0.6, 1.7],
]
const close = (u, v, tol = 1e-8) => Math.abs(u - v) <= tol * Math.max(1, Math.abs(u), Math.abs(v))

// Simpson's rule with one Richardson step.
const precise = (f, a, b, n = 1000) => (16 * integrate(f, a, b, 2 * n) - integrate(f, a, b, n)) / 15

// ∫ from 0 to ∞ of g: [0, 1], then [1, 2], [2, 4], ... until a piece adds
// nothing and g has died off at its right end (the tail is then negligible).
function toInfinity(g) {
  let total = precise(g, 0, 1)
  for (let a = 1; a < 1e6; a *= 2) {
    const piece = precise(g, a, 2 * a)
    total += piece
    if (Math.abs(piece) <= 1e-17 * Math.abs(total) && Math.abs(g(2 * a)) * a <= 1e-17 * Math.abs(total)) return total
  }
  throw new Error('the integral never settles: it may diverge')
}

// The slope of g at x: a five-point central difference.
const slope = (g, x, h = 1e-3) => (8 * (g(x + h) - g(x - h)) - (g(x + 2 * h) - g(x - 2 * h))) / (12 * h)

// A typed formula as a function of x (with C, if it is there, some constant).
function typedFn(raw, vars) {
  const ast = parseExpr(raw, vars)
  return x => evalExpr(ast, { x, C: 1.9 })
}

// A typed antiderivative: F(b) − F(a) must equal delta(a, b), worked out
// numerically from the problem, on every interval. Each wrong choice must miss one.
function confirmAntiderivative(p, delta) {
  const want = INTERVALS.map(([a, b]) => delta(a, b))
  const fits = raw => {
    const F = typedFn(raw, p.expr.vars)
    return INTERVALS.every(([a, b], i) => close(F(b) - F(a), want[i]))
  }
  if (!fits(p.answer)) return `MISMATCH: ${p.answer} is not an antiderivative here`
  for (const c of p.choices ?? []) if (fits(c)) throw new Error(`wrong choice "${c}" is an antiderivative too`)
  return p.answer
}

// ---------- the derivation, line by line ----------

const LINES = [
  /^\\int (.+?)\\,dx &= uv - \\int v\\,du$/, // the integral
  /^u = (.+?), \\quad dv &= (.+?)\\,dx$/, // the split
  /^du = (.*?)dx, \\quad v &= (.+)$/, // du and v
  /^\\int (.+?)\\,dx &= (.+?) - \\int (.+?)\\,dx$/, // uv − ∫ v du
  /^&= (.+?) - \\boxed\{\\;\?\\;\} \+ C$/, // the last integral done
]

// The displayed lines as functions of x; a boxed piece is null.
function readParts(latex) {
  const m = rowsOf(latex).map((row, i) => {
    const hit = LINES[i]?.exec(row)
    if (!hit) throw new Error(`unrecognized line ${i + 1}: ${row}`)
    return hit
  })
  const fn = tex => (tex === BOX ? null : texFn(tex))
  return {
    g: texFn(m[0][1]),
    u: m[1] && texFn(m[1][1]),
    dv: m[1] && texFn(m[1][2]),
    du: m[2] && (m[2][1] ? texFn(m[2][1]) : () => 1),
    v: m[2] && fn(m[2][2]),
    parts: m[3] && { same: m[3][1] === m[0][1], uv: texFn(m[3][2]), inner: fn(m[3][3]) },
    finish: m[4] && texFn(m[4][1]),
  }
}

// Every line shown (no box in it) must be true.
function checkParts(d) {
  const everywhere = test => XS.every(test)
  if (d.u && !everywhere(x => close(d.u(x) * d.dv(x), d.g(x)))) throw new Error('u·dv is not the integrand')
  if (d.du && !everywhere(x => close(slope(d.u, x), d.du(x)))) throw new Error('du is not the derivative of u')
  if (d.v && !INTERVALS.every(([a, b]) => close(d.v(b) - d.v(a), precise(d.dv, a, b)))) throw new Error('v is not an antiderivative of dv')
  if (!d.parts) return
  if (!d.parts.same) throw new Error('the uv − ∫ v du line integrates something else')
  if (!everywhere(x => close(d.parts.uv(x), d.u(x) * d.v(x)))) throw new Error('the uv term is not u times v')
  if (d.parts.inner) {
    if (!everywhere(x => close(d.parts.inner(x), d.v(x) * d.du(x)))) throw new Error('the leftover integrand is not v du')
    // and the line itself: d/dx of the right side is the integrand
    if (!everywhere(x => close(slope(d.parts.uv, x) - d.parts.inner(x), d.g(x), 1e-7))) throw new Error('the uv − ∫ v du line is false')
  }
}

// The split that makes one round enough: u·dv is the integrand, and u
// differentiates to a nonzero constant, so ∫ v du is a multiple of ∫ v dx.
function splitLetter(p) {
  const m = p.latex.match(/^\\int (.+?)\\,dx = uv - \\int v\\,du$/)
  if (!m) throw new Error(`unrecognized ${p.latex}`)
  const g = texFn(m[1])
  const good = p.options.map(o => {
    const s = o.latex.match(/^u = (.+?),\\; dv = (.*?)(?:\\,)?dx$/)
    if (!s) throw new Error(`unrecognized option ${o.latex}`)
    const u = texFn(s[1])
    const dv = s[2] ? texFn(s[2]) : () => 1
    if (!XS.every(x => close(u(x) * dv(x), g(x)))) return false
    const du = XS.map(x => slope(u, x))
    return Math.abs(du[0]) > 1e-6 && du.every(k => close(k, du[0], 1e-7))
  })
  const hits = good.filter(Boolean).length
  if (hits !== 1) throw new Error(`${hits} options make one round enough`)
  return 'abcd'[good.indexOf(true)]
}

// ---------- E[X] asks ----------

// The density an E[X] ask names ("rate λ = 3", or "f(x) = (1/3)e^(−x/3)"):
// the integrand must be x times it, and it must integrate to 1.
function checkDensity(ask, g) {
  let named
  const r = ask.match(/rate λ = (\d+)/)
  const s = ask.match(/f\(x\) = (.+?), x > 0/)
  if (r) named = x => Number(r[1]) * Math.exp(-Number(r[1]) * x)
  else if (s) named = typedFn(s[1], ['x'])
  else throw new Error(`no density in ${ask}`)
  if (![0.3, 1, 2.5].every(x => close(g(x), x * named(x)))) throw new Error('the integrand is not x times the density named')
  if (!close(toInfinity(named), 1)) throw new Error('the density does not integrate to 1')
}

export const derive = {
  'integration/steps'(p) {
    if (p.options) return splitLetter(p)
    const d = readParts(p.latex)
    checkParts(d)
    // v = box: an antiderivative of dv
    if (!d.v) return confirmAntiderivative(p, (a, b) => precise(d.dv, a, b))
    // ∫ box dx: differentiate both sides, box = (uv)′ − integrand
    if (!d.parts.inner) return confirmFormula(p, e => slope(d.parts.uv, e.x) - d.g(e.x), POINTS)
    // = uv − box + C: box(b) − box(a) = [uv] from a to b, minus ∫ of the integrand
    return confirmAntiderivative(p, (a, b) => d.finish(b) - d.finish(a) - precise(d.g, a, b))
  },
  'integration/antiderivative'(p) {
    const m = p.latex.match(/^\\int (.+?)\\,dx = \\,\?$/)
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const g = texFn(m[1])
    return confirmAntiderivative(p, (a, b) => precise(g, a, b))
  },
  'integration/definite'(p) {
    const m = p.latex.match(/^(E\[X\] = )?\\int_0\^\{(\d+|\\infty)\} (.+?)\\,dx = \\,\?$/)
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const g = texFn(m[3])
    if (m[1]) checkDensity(p.ask, g)
    return near(m[2] === '\\infty' ? toInfinity(g) : precise(g, 0, Number(m[2])), p, 1e-9)
  },
  'integration/gamma-not-parts'(p) {
    const m = p.latex.match(/^\\int_0\^\{\\infty\} (.+?)\\,dx = \\,\?$/)
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const v = toInfinity(texFn(m[1]))
    if (!close(v, Math.round(v), 1e-10)) throw new Error(`${v} is not a whole number`)
    return Math.round(v)
  },
}
