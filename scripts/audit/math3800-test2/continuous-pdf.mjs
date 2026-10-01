// Independent checkers for the Test 2 'continuous-pdf' topic. See ../../verify.mjs.
//
// Also home of the toolkit the other §4.1–4.3 checkers share (continuous-cdf,
// uniform, continuous-expectation, continuous-mgf): read the density back out
// of the displayed LaTeX, turn it into a function, and integrate numerically.
import { parseExpr } from '../../../src/engine/expr.js'
import { integrate } from './_lib.mjs'

// ---------- reading formulas off the problem ----------

const GREEK = ['alpha', 'beta', 'gamma', 'lambda', 'mu', 'sigma', 'theta', 'pi']

// LaTeX as the problems print it → the typed-formula grammar of src/engine/expr.js.
export function texToExpr(tex) {
  const s = String(tex)
  let i = 0
  const fail = msg => {
    throw new Error(`${msg} in "${s}"`)
  }
  function group() {
    if (s[i] !== '{') fail(`expected { at ${i}`)
    i++
    const inner = seq('}')
    if (s[i] !== '}') fail('unclosed {')
    i++
    return inner
  }
  function seq(stop) {
    let out = ''
    while (i < s.length && s[i] !== stop) {
      const ch = s[i]
      if (ch === '\\') {
        const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i))
        i += m[0].length
        const cmd = m[1]
        if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
          const a = group()
          const b = group()
          out += `((${a})/(${b}))`
        } else if (cmd === 'sqrt') out += `sqrt(${group()})`
        else if (['left', 'right', 'big', 'Big', 'bigl', 'bigr'].includes(cmd)) out += ''
        else if (cmd === 'cdot' || cmd === 'times') out += '*'
        else if ([',', ';', '!', ' ', 'quad', 'qquad'].includes(cmd)) out += ' '
        else if (GREEK.includes(cmd)) out += ` ${cmd} `
        else if (cmd === 'ln' || cmd === 'exp') out += cmd
        else fail(`unknown \\${cmd}`)
      } else if (ch === '{') out += `(${group()})`
      else if (ch === '^') {
        i++
        out += s[i] === '{' ? `^(${group()})` : `^${s[i++]}`
      } else {
        out += ch
        i++
      }
    }
    return out
  }
  return seq(undefined)
}

// A parsed formula as a plain function of an environment object (fast enough
// to integrate thousands of times per problem).
function compile(node) {
  switch (node.t) {
    case 'num': {
      const v = parseFloat(node.v)
      return () => v
    }
    case 'var': {
      const n = node.n
      return env => env[n]
    }
    case 'const': {
      const v = node.n === 'e' ? Math.E : Math.PI
      return () => v
    }
    case 'group':
      return compile(node.a)
    case 'neg': {
      const a = compile(node.a)
      return env => -a(env)
    }
    case 'call': {
      const a = compile(node.args[0])
      if (node.f === 'exp') return env => Math.exp(a(env))
      if (node.f === 'ln') return env => Math.log(a(env))
      if (node.f === 'sqrt') return env => Math.sqrt(a(env))
      break
    }
    case 'bin': {
      const a = compile(node.a)
      const b = compile(node.b)
      if (node.op === '+') return env => a(env) + b(env)
      if (node.op === '-') return env => a(env) - b(env)
      if (node.op === '*') return env => a(env) * b(env)
      if (node.op === '/') return env => a(env) / b(env)
      if (node.a.t === 'const' && node.a.n === 'e') return env => Math.exp(b(env))
      return env => Math.pow(a(env), b(env))
    }
  }
  throw new Error(`cannot compile a ${node.t}${node.f ? ` (${node.f})` : ''}`)
}

// The displayed formula as a function of several letters: g({ t, x, beta }).
export function texFormula(tex, vars) {
  return compile(parseExpr(texToExpr(tex), vars))
}

// The displayed formula as a function of x, any other letters fixed by `env`.
export function texFn(tex, env = {}) {
  const run = texFormula(tex, ['x', ...Object.keys(env)])
  const scope = { ...env }
  return x => {
    scope.x = x
    return run(scope)
  }
}

// The rows of the cases block after `name = `: [{ expr, cond }].
export function casesOf(latex, name = 'f(x)') {
  const head = `${name} = \\begin{cases}`
  const at = latex.indexOf(head)
  if (at < 0) throw new Error(`no ${name} cases in ${latex}`)
  const end = latex.indexOf('\\end{cases}', at)
  return latex
    .slice(at + head.length, end)
    .split('\\\\')
    .map(row => {
      const [expr, cond] = row.split('&')
      return { expr: expr.trim(), cond: (cond ?? '').trim() }
    })
}

// A support condition as [lo, hi]: "0.1 \le x \le 0.5", "x > 0", "x \ge 1".
export function supportOf(cond) {
  let m
  if ((m = cond.match(/^(-?[\d.]+) \\le x \\le (-?[\d.]+)$/))) return [+m[1], +m[2]]
  if ((m = cond.match(/^x (?:>|\\ge) (-?[\d.]+)$/))) return [+m[1], Infinity]
  if (/^-\\infty < x < \\infty$/.test(cond)) return [-Infinity, Infinity]
  throw new Error(`unrecognized support "${cond}"`)
}

// The pdf shown as f(x) = \begin{cases} ... \end{cases}: { lo, hi, g (the
// formula on the support), f (zero off it), tex }.
export function densityOf(latex, env = {}) {
  const rows = casesOf(latex, 'f(x)')
  if (rows.some(r => /otherwise/.test(r.cond) && r.expr !== '0')) throw new Error('f is not 0 off its support')
  const live = rows.filter(r => !/otherwise/.test(r.cond))
  if (live.length !== 1) throw new Error(`expected one nonzero piece, got ${live.length}`)
  const [lo, hi] = supportOf(live[0].cond)
  const g = texFn(live[0].expr, env)
  return { lo, hi, g, tex: live[0].expr, f: x => (x < lo || x > hi ? 0 : g(x)) }
}

// P(a < X < b), P(X > a), P(X \le b), P(X = a) → [a, b] (endpoints never matter).
export function eventOf(s) {
  let m
  if ((m = s.match(/P\((-?[\d.]+) (?:<|\\le) X (?:<|\\le) (-?[\d.]+)\)/))) return [+m[1], +m[2]]
  if ((m = s.match(/P\(X (?:>|\\ge) (-?[\d.]+)\)/))) return [+m[1], Infinity]
  if ((m = s.match(/P\(X (?:<|\\le) (-?[\d.]+)\)/))) return [-Infinity, +m[1]]
  if ((m = s.match(/P\(X = (-?[\d.]+)\)/))) return [+m[1], +m[1]]
  throw new Error(`unrecognized event ${s}`)
}

// What the problem asks, written after the density's cases block.
export const afterCases = latex => latex.slice(latex.lastIndexOf('\\end{cases}') + '\\end{cases}'.length)

// ---------- integrating ----------

// ∫ from L to ∞ of g, in pieces that double in length until they stop adding
// anything (g must die off, exponentially or like a power x^-p with p > 1).
export function tail(g, L) {
  let total = 0
  let a = L
  let len = 1
  for (let k = 0; k < 120; k++) {
    const piece = integrate(g, a, a + len, 1000)
    if (!Number.isFinite(piece)) throw new Error(`integrand blew up near x = ${a}`)
    total += piece
    if (k > 3 && Math.abs(piece) <= 1e-16 * Math.abs(total)) return total
    if (k > 3 && total === 0 && piece === 0) return 0
    a += len
    len *= 2
  }
  throw new Error('the tail never settles: the integral may diverge')
}

// ∫ from a to b of g; either limit may be infinite.
export function area(g, a, b) {
  if (a === b) return 0
  if (a > b) return -area(g, b, a)
  if (a === -Infinity && b === Infinity) return area(g, -Infinity, 0) + area(g, 0, Infinity)
  if (a === -Infinity) return area(x => g(-x), -b, Infinity)
  if (b === Infinity) return integrate(g, a, a + 1, 2000) + tail(g, a + 1)
  return integrate(g, a, b, 4000)
}

// ∫ from 0 to ∞ of g with x = u²: keeps powers like x^(α−1) smooth at 0.
export const halfLine = g => area(u => 2 * u * g(u * u), 0, Infinity)

// A limit as printed: 0, a, x, {\infty}.
function limitValue(tok, env, vars) {
  const s = tok.replace(/^\{|\}$/g, '')
  if (s === '\\infty') return Infinity
  if (s === '-\\infty') return -Infinity
  return texFormula(s, vars)(env)
}

// The value of a displayed expression at `env`: a plain formula, or
// [factor] \int_lo^hi integrand \,dv [factor], integrated numerically over v.
// \Gamma(\alpha) is read as the number env.G.
export function exprValue(tex, env, vars) {
  const s = tex.replaceAll('\\Gamma(\\alpha)', ' G ').trim()
  const V = [...vars, 'G']
  const m = s.match(/^(.*?)\\int_(\{[^}]*\}|[^\s^{])\^(\{[^}]*\}|[^\s{])\s*(.+?)\\,d([a-z])(.*)$/)
  if (!m) return texFormula(s, V)(env)
  const pre = m[1].replace(/\\cdot\s*$/, '').trim()
  const post = m[6].trim()
  const factor = (pre ? texFormula(pre, V)(env) : 1) * (post ? texFormula(post, V)(env) : 1)
  const g = texFormula(m[4], V)
  const scope = { ...env }
  const h = u => {
    scope[m[5]] = u
    return g(scope)
  }
  const lo = limitValue(m[2], env, V)
  const hi = limitValue(m[3], env, V)
  return factor * (lo === 0 && hi === Infinity ? halfLine(h) : area(h, lo, hi))
}

// The rows of an aligned derivation.
export const rowsOf = latex =>
  latex
    .replace(/^\\begin\{aligned\} /, '')
    .replace(/ \\end\{aligned\}$/, '')
    .split(' \\\\ ')

// P(a ≤ X ≤ b) for a density from densityOf: integrate only where f lives.
export function prob(d, a, b) {
  const lo = Math.max(a, d.lo)
  const hi = Math.min(b, d.hi)
  return hi <= lo ? 0 : area(d.g, lo, hi)
}

// The generator's number when ours agrees to integration accuracy; otherwise
// ours, so the harness reports the mismatch.
export const near = (value, p, tol = 1e-7) => (Math.abs(value - p.answer) <= tol * Math.max(1, Math.abs(value)) ? p.answer : value)

// The option whose text matches `re`, as a letter (exactly one must match).
export function letterOf(options, re) {
  const hits = options.map((o, i) => (re.test(typeof o === 'string' ? o : o.latex) ? i : -1)).filter(i => i >= 0)
  if (hits.length !== 1) throw new Error(`${hits.length} options match ${re}`)
  return 'abcdefgh'[hits[0]]
}

// Points to look for negative values: a fine grid on a finite support,
// log-spaced far out on an infinite one.
function samplePoints(lo, hi) {
  const xs = []
  if (hi < Infinity) {
    for (let k = 0; k <= 2000; k++) xs.push(lo + ((hi - lo) * k) / 2000)
    return xs
  }
  const from = lo === -Infinity ? 0 : lo
  xs.push(from)
  for (let s = -6; s <= 4; s += 0.005) {
    xs.push(from + 10 ** s)
    if (lo === -Infinity) xs.push(-(10 ** s))
  }
  return xs
}

// A density that really is a pdf: never negative, total area 1. Returns it.
export function validPdf(d) {
  if (Math.min(...samplePoints(d.lo, d.hi).map(d.g)) < -1e-9) throw new Error('the density goes negative')
  if (Math.abs(area(d.g, d.lo, d.hi) - 1) > 1e-8) throw new Error('the density does not integrate to 1')
  return d
}

// The value after "= " in "P(...) = 0.1875".
const givenValue = s => {
  const m = s.match(/= (-?[\d.]+)\s*$/)
  if (!m) throw new Error(`no value in ${s}`)
  return +m[1]
}

export const derive = {
  'continuous-pdf/is-pdf'(p) {
    const d = densityOf(p.latex)
    const total = area(d.g, d.lo, d.hi)
    const negative = Math.min(...samplePoints(d.lo, d.hi).map(d.g)) < -1e-9
    const areaOne = Math.abs(total - 1) < 1e-6
    if (negative && !areaOne) throw new Error('fails both ways: the options assume one reason')
    return letterOf(p.options, negative ? /negative/ : areaOne ? /^Yes/ : /area is not 1/)
  },
  'continuous-pdf/find-c'(p) {
    const d = densityOf(p.latex, { c: 1 })
    return near(1 / area(d.g, d.lo, d.hi), p)
  },
  'continuous-pdf/prob'(p) {
    const d = validPdf(densityOf(p.latex))
    const [a, b] = eventOf(afterCases(p.latex))
    return near(prob(d, a, b), p)
  },
  'continuous-pdf/find-c-prob'(p) {
    const d = densityOf(p.latex, { c: 1 })
    const c = 1 / area(d.g, d.lo, d.hi)
    const [a, b] = eventOf(afterCases(p.latex))
    return near(c * prob(d, a, b), p)
  },
  'continuous-pdf/point'(p) {
    const d = validPdf(densityOf(p.latex))
    const row = p.latex.split('\\end{cases}')[1]
    const parts = row.split('\\quad')
    const target = eventOf(parts[parts.length - 1])
    const want = prob(d, ...target)
    if (parts.length === 1) return near(want, p)
    // the given probability must be right, then the target follows from it
    const given = givenValue(parts[0].replace(/,\s*$/, ''))
    const have = prob(d, ...eventOf(parts[0]))
    if (Math.abs(have - given) > 1e-6) throw new Error(`given ${given} but the pdf gives ${have}`)
    if (Math.abs(want - have) < 1e-9) return given
    if (Math.abs(want + have - 1) < 1e-9) return 1 - given
    throw new Error('the target is neither the given event nor its complement')
  },
}

export const SAMPLES = {
  'continuous-pdf/is-pdf': 400,
  'continuous-pdf/find-c': 400,
  'continuous-pdf/prob': 400,
  'continuous-pdf/find-c-prob': 400,
  'continuous-pdf/point': 400,
}
