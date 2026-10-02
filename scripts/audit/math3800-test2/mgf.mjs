// Independent checkers for the Test 2 'mgf' topic. See ../../verify.mjs.
//
// The MGF is read back out of the displayed LaTeX and differentiated at t = 0
// by truncated Taylor-series arithmetic (exact up to rounding, which the 1e-9
// comparison needs), cross-checked against central differences. A finite MGF
// is also read term by term. A named distribution is checked by computing
// E[e^{tX}] straight from its pmf or pdf (sums, numeric integrals) and
// comparing it with the displayed MGF at a few values of t.
import { parseExpr, evalExpr } from '../../../src/engine/expr.js'
import { integrate } from './_lib.mjs'

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b))

// ---------- the displayed LaTeX as a typed expression ----------

// The contents of the {...} group starting at s[i], and the index after it.
function group(s, i) {
  while (s[i] === ' ') i++
  if (s[i] !== '{') throw new Error(`expected { in ${s}`)
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1]
  }
  throw new Error(`unbalanced braces in ${s}`)
}

// \frac{a}{b} -> ((a)/(b)), {..} -> (..); spacing commands dropped.
function texToExpr(s) {
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s.startsWith('\\frac', i)) {
      const [a, j] = group(s, i + 5)
      const [b, k] = group(s, j)
      out += `((${texToExpr(a)})/(${texToExpr(b)}))`
      i = k
    } else if (s[i] === '{') {
      const [a, j] = group(s, i)
      out += `(${texToExpr(a)})`
      i = j
    } else if (s[i] === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i))
      if (!['left', 'right', ',', ';', '!', 'quad'].includes(m[1])) throw new Error(`unexpected \\${m[1]} in ${s}`)
      i += m[0].length
    } else {
      out += s[i]
      i++
    }
  }
  return out
}

const mgfAst = tex => parseExpr(texToExpr(tex), ['t'])

// "m_X(t) &= ... \\ <quantity> &= ?" -> the MGF and the quantity asked for
function readProblem(latex) {
  const body = latex.replace('\\begin{aligned}', '').replace('\\end{aligned}', '')
  const lines = body.split('\\\\').map(l => l.trim())
  if (lines.length !== 2) throw new Error(`expected two lines in ${latex}`)
  const top = lines[0].match(/^m_X\(t\) &= (.+)$/)
  const bottom = lines[1].match(/^(.+) &= \\,\?$/)
  if (!top || !bottom) throw new Error(`unreadable problem ${latex}`)
  return { mgf: top[1], ask: bottom[1] }
}

// ---------- derivatives by Taylor-series arithmetic ----------
// A jet is [c0, c1, c2, c3]: f(t0 + h) = c0 + c1 h + c2 h^2 + c3 h^3 + ...

const K = 4
const J = v => [v, 0, 0, 0]
const add = (a, b) => a.map((v, i) => v + b[i])
const sub = (a, b) => a.map((v, i) => v - b[i])
const mul = (a, b) =>
  a.map((_, k) => {
    let s = 0
    for (let j = 0; j <= k; j++) s += a[j] * b[k - j]
    return s
  })
function div(a, b) {
  const c = []
  for (let k = 0; k < K; k++) {
    let s = a[k]
    for (let j = 1; j <= k; j++) s -= b[j] * c[k - j]
    c.push(s / b[0])
  }
  return c
}
// (e^a)' = a' e^a
function jexp(a) {
  const e = [Math.exp(a[0])]
  for (let k = 1; k < K; k++) {
    let s = 0
    for (let j = 1; j <= k; j++) s += j * a[j] * e[k - j]
    e.push(s / k)
  }
  return e
}
// a' = a (ln a)'
function jlog(a) {
  if (!(a[0] > 0)) throw new Error(`log of ${a[0]}`)
  const l = [Math.log(a[0])]
  for (let k = 1; k < K; k++) {
    let s = a[k]
    for (let j = 1; j < k; j++) s -= (j / k) * l[j] * a[k - j]
    l.push(s / a[0])
  }
  return l
}
function jpow(a, b) {
  const constant = b.slice(1).every(v => v === 0)
  if (constant && Number.isInteger(b[0]) && Math.abs(b[0]) <= 64) {
    let r = J(1)
    for (let i = 0; i < Math.abs(b[0]); i++) r = mul(r, a)
    return b[0] < 0 ? div(J(1), r) : r
  }
  return jexp(mul(b, jlog(a)))
}

function jet(node, t0) {
  switch (node.t) {
    case 'num':
      return J(parseFloat(node.v))
    case 'var':
      if (node.n !== 't') throw new Error(`unexpected variable ${node.n}`)
      return [t0, 1, 0, 0]
    case 'const':
      return J(node.n === 'e' ? Math.E : Math.PI)
    case 'group':
      return jet(node.a, t0)
    case 'neg':
      return jet(node.a, t0).map(v => -v)
    case 'call': {
      const a = jet(node.args[0], t0)
      if (node.f === 'exp') return jexp(a)
      if (node.f === 'ln') return jlog(a)
      if (node.f === 'sqrt') return jpow(a, J(0.5))
      break
    }
    case 'bin': {
      const a = jet(node.a, t0)
      const b = jet(node.b, t0)
      if (node.op === '+') return add(a, b)
      if (node.op === '-') return sub(a, b)
      if (node.op === '*') return mul(a, b)
      if (node.op === '/') return div(a, b)
      if (node.op === '^') return jpow(a, b)
    }
  }
  throw new Error(`cannot differentiate a ${node.t} node`)
}

// [m(t0), m'(t0), m''(t0), m'''(t0)]
function derivsAt(ast, t0) {
  const c = jet(ast, t0)
  return [c[0], c[1], 2 * c[2], 6 * c[3]]
}

// Derivatives of the displayed MGF at 0, checked against finite differences.
function derivatives(tex) {
  const ast = mgfAst(tex)
  const d = derivsAt(ast, 0)
  if (!near(d[0], 1, 1e-12)) throw new Error(`m(0) = ${d[0]}, so this is not an MGF`)
  const m = t => evalExpr(ast, { t })
  const h = 1e-4
  const fd1 = (m(h) - m(-h)) / (2 * h)
  const fd2 = (m(h) - 2 * m(0) + m(-h)) / (h * h)
  if (!near(fd1, d[1], 1e-5) || !near(fd2, d[2], 1e-4)) {
    throw new Error(`series derivatives ${d[1]}, ${d[2]} disagree with differences ${fd1}, ${fd2}`)
  }
  return d
}

function moment(ask, d) {
  if (ask === 'E[X]') return d[1]
  if (ask === 'E[X^2]') return d[2]
  if (ask === '\\operatorname{Var}X') return d[2] - d[1] * d[1]
  throw new Error(`unrecognized quantity ${ask}`)
}

const fromDerivatives = p => {
  const { mgf, ask } = readProblem(p.latex)
  return moment(ask, derivatives(mgf))
}

// ---------- a finite MGF, term by term ----------

// "0.2 + 0.5e^{t} + 0.3e^{2t}" -> Map(value -> probability)
function finiteTerms(tex) {
  const pmf = new Map()
  for (const term of tex.split(' + ')) {
    const m = term.trim().match(/^(\d*\.\d+|\d+)(?:e\^\{(-?\d*)t\})?$/)
    if (!m) throw new Error(`unreadable term "${term}"`)
    const x = m[2] === undefined ? 0 : m[2] === '' ? 1 : m[2] === '-' ? -1 : parseInt(m[2], 10)
    if (pmf.has(x)) throw new Error(`the value ${x} appears twice`)
    pmf.set(x, parseFloat(m[1]))
  }
  const total = [...pmf.values()].reduce((a, b) => a + b, 0)
  if (!near(total, 1, 1e-12)) throw new Error(`the probabilities add to ${total}`)
  return pmf
}

// ---------- E[e^{tX}] straight from a pmf or pdf ----------

function geometricMgf(p, t) {
  if ((1 - p) * Math.exp(t) >= 1) return Infinity
  let s = 0
  let alive = 1 // P(first x - 1 trials fail)
  for (let x = 1; x < 1e6; x++) {
    const term = Math.exp(t * x) * alive * p
    s += term
    alive *= 1 - p
    if (term < 1e-18 * s) break
  }
  return s
}

// density proportional to x^(a-1) e^(-x/b) on x > 0. Both integrals numeric,
// with x = u^m so the integrand is finite at 0.
function gammaMgf(a, b, t) {
  const m = Math.max(2, Math.ceil(1 / a))
  const part = lam => {
    const U = Math.pow((4 * a + 120) / lam, 1 / m)
    return integrate(u => m * Math.pow(u, m * a - 1) * Math.exp(-lam * Math.pow(u, m)), 0, U, 8000)
  }
  if (1 / b - t <= 0) return Infinity
  return part(1 / b - t) / part(1 / b)
}

function normalMgf(mu, s2, t) {
  const s = Math.sqrt(s2)
  const dens = x => Math.exp(-((x - mu) ** 2) / (2 * s2))
  const c = mu + t * s2 // where e^{tx} times the density peaks
  const top = integrate(x => Math.exp(t * x) * dens(x), c - 14 * s, c + 14 * s, 8000)
  return top / integrate(dens, mu - 14 * s, mu + 14 * s, 8000)
}

// "gamma with α = 4 and β = 3" -> t => E[e^{tX}]
function optionMgf(text) {
  const val = name => {
    const m = text.match(new RegExp(`${name} = ([-−]?[\\d.]+)`))
    if (!m) throw new Error(`no ${name} in "${text}"`)
    return parseFloat(m[1].replace('−', '-'))
  }
  if (text.startsWith('geometric with')) return t => geometricMgf(val('p'), t)
  if (text.startsWith('gamma with')) return t => gammaMgf(val('α'), val('β'), t)
  if (text.startsWith('exponential with')) return t => gammaMgf(1, val('β'), t)
  if (text.startsWith('chi-squared with')) return t => gammaMgf(val('γ') / 2, 2, t)
  if (text.startsWith('normal with')) return t => normalMgf(val('μ'), val('σ²'), t)
  throw new Error(`unrecognized option "${text}"`)
}

const T = [-0.5, -0.2, 0.01]
const sameValue = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-6 * Math.max(Math.abs(a), Math.abs(b))

// ---------- which expression gives which quantity ----------

// Small distributions to test each candidate expression on.
const TESTS = [
  [
    [0, 0.2],
    [1, 0.5],
    [3, 0.3],
  ],
  [
    [-1, 0.3],
    [2, 0.3],
    [5, 0.4],
  ],
  [
    [1, 0.6],
    [4, 0.4],
  ],
].map(pmf => {
  const ast = parseExpr(pmf.map(([x, w]) => `${w}*e^(${x}*t)`).join(' + '), ['t'])
  const E = g => pmf.reduce((s, [x, w]) => s + g(x) * w, 0)
  const mu = E(x => x)
  const v = E(x => (x - mu) ** 2)
  return {
    d: derivsAt(ast, 0),
    d1: derivsAt(ast, 1),
    mean: mu,
    target: {
      'E[X]': mu,
      'E[X^2]': E(x => x * x),
      'E[X^3]': E(x => x ** 3),
      '\\operatorname{Var}X': v,
      '\\sigma': Math.sqrt(v),
      'm_X(0)': E(() => 1),
    },
  }
})

const FORMS = {
  'm_X(0)': c => c.d[0],
  "m_X'(0)": c => c.d[1],
  "m_X''(0)": c => c.d[2],
  "m_X'''(0)": c => c.d[3],
  "m_X'(1)": c => c.d1[1],
  "[m_X'(0)]^2": c => c.d[1] ** 2,
  "[m_X'(0)]^3": c => c.d[1] ** 3,
  "m_X''(0) - [m_X'(0)]^2": c => c.d[2] - c.d[1] ** 2,
  "[m_X'(0)]^2 - m_X''(0)": c => c.d[1] ** 2 - c.d[2],
  "m_X''(0) - m_X'(0)": c => c.d[2] - c.d[1],
  "m_X''(0)\\,m_X'(0)": c => c.d[2] * c.d[1],
  "3m_X'(0)": c => 3 * c.d[1],
  "\\sqrt{m_X''(0) - [m_X'(0)]^2}": c => Math.sqrt(c.d[2] - c.d[1] ** 2),
  "\\sqrt{m_X''(0)} - m_X'(0)": c => Math.sqrt(c.d[2]) - c.d[1],
  "\\sqrt{m_X''(0)}": c => Math.sqrt(c.d[2]),
  1: () => 1,
  0: () => 0,
  e: () => Math.E,
  'E[X]': c => c.mean,
}

const onlyOne = hits => {
  const right = hits.filter(Boolean)
  if (right.length !== 1) throw new Error(`${right.length} options are right`)
  return right[0]
}

export const derive = {
  'mgf/geometric': fromDerivatives,
  'mgf/continuous': fromDerivatives,
  'mgf/finite'(p) {
    const { mgf, ask } = readProblem(p.latex)
    const pmf = finiteTerms(mgf)
    const E = g => [...pmf].reduce((s, [x, w]) => s + g(x) * w, 0)
    const mu = E(x => x)
    // the derivatives of the whole expression must agree with the terms
    const d = derivatives(mgf)
    if (!near(d[1], mu) || !near(d[2], E(x => x * x))) throw new Error('derivatives and terms disagree')
    if (ask === 'E[X]') return mu
    if (ask === 'E[X^2]') return E(x => x * x)
    if (ask === '\\operatorname{Var}X') return E(x => (x - mu) ** 2)
    const m = ask.match(/^P\(X = (-?\d+)\)$/)
    if (m) return pmf.get(parseInt(m[1], 10)) ?? 0
    throw new Error(`unrecognized quantity ${ask}`)
  },
  'mgf/identify'(p) {
    const m = p.latex.match(/^m_X\(t\) = (.+)$/)
    if (!m) throw new Error(`unreadable ${p.latex}`)
    const ast = mgfAst(m[1])
    const shown = T.map(t => evalExpr(ast, { t }))
    return onlyOne(
      p.options.map((o, i) => {
        const mgf = optionMgf(o)
        return T.every((t, j) => sameValue(mgf(t), shown[j])) ? 'abcd'[i] : null
      }),
    )
  },
  'mgf/which'(p) {
    const q = p.latex.match(/^(.+) = \\,\?$/)
    if (!q) throw new Error(`unreadable ${p.latex}`)
    if (!(q[1] in TESTS[0].target)) throw new Error(`unrecognized quantity ${q[1]}`)
    return onlyOne(
      p.options.map((o, i) => {
        const form = FORMS[o.latex]
        if (!form) throw new Error(`unrecognized option ${o.latex}`)
        return TESTS.every(c => near(form(c), c.target[q[1]], 1e-9)) ? 'abcd'[i] : null
      }),
    )
  },
}

export const SAMPLES = { 'mgf/identify': 1000 }
