// Typed formula answers: parse what the student types, evaluate it, render it.
//
// Used where the answer is a formula, not a number: a derived pdf (q^(x-1)p),
// a cdf (1 - q^x), an MGF (pe^t/(1 - qe^t)). Two formulas count as the same
// answer when they agree at a handful of sample points, so any algebraically
// equivalent form is right: pe^t/(1-qe^t), p*exp(t)/(1-(1-p)e^t), ...
//
// Grammar: numbers, the template's variables (single letters or Greek names
// like beta, lambda), e, pi, + - * / ^ (also **), parentheses, n!, and
// exp ln sqrt C(n,k). Letters typed together split into variables: "pe^t" is
// p * e^t, "nk" is n * k. Nothing is ever passed to eval.

const FUNCS = { exp: 1, ln: 1, log: 1, sqrt: 1, c: 2, binom: 2, choose: 2 }
const GREEK = ['alpha', 'beta', 'gamma', 'lambda', 'mu', 'sigma', 'theta']
const UNICODE = {
  '×': '*',
  '·': '*',
  '⋅': '*',
  '÷': '/',
  '−': '-',
  '–': '-',
  '²': '^2',
  '³': '^3',
  π: 'pi',
  α: ' alpha ',
  β: ' beta ',
  γ: ' gamma ',
  λ: ' lambda ',
  μ: ' mu ',
  σ: ' sigma ',
  θ: ' theta ',
}

export class ExprError extends Error {}

function tokenize(src) {
  let s = src
  for (const [k, v] of Object.entries(UNICODE)) s = s.split(k).join(v)
  s = s.replace(/\*\*/g, '^').trim()
  // a leading "f(x) =", "F(x)=", "m_X(t) =" or "y =" is fine
  s = s.replace(/^[A-Za-z_]+(\([A-Za-z]\))?\s*=\s*/, '')
  const toks = []
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z]+)|([-+*/^(),!]))/y
  let i = 0
  while (i < s.length) {
    re.lastIndex = i
    const m = re.exec(s)
    if (!m || m[0].length === 0) {
      if (/\s/.test(s[i])) {
        i++
        continue
      }
      throw new ExprError(`I don't understand "${s[i]}".`)
    }
    if (m[1] !== undefined) toks.push({ k: 'num', v: m[1] })
    else if (m[2] !== undefined) toks.push({ k: 'name', v: m[2] })
    else toks.push({ k: 'op', v: m[3] })
    i = re.lastIndex
  }
  toks.push({ k: 'end', v: '' })
  return toks
}

function parser(src, vars) {
  const toks = tokenize(src)
  const varSet = new Set(vars)
  let i = 0
  let depth = 0
  const tok = () => toks[i]
  const isOp = v => tok().k === 'op' && tok().v === v
  const take = () => toks[i++]
  const expect = v => {
    if (!isOp(v)) throw new ExprError(v === ')' ? 'Missing a closing parenthesis.' : `Expected "${v}".`)
    take()
  }
  const isFunc = t => t.k === 'name' && !varSet.has(t.v) && t.v.toLowerCase() in FUNCS
  const letter = ch => varSet.has(ch) || ch === 'e'

  // letters typed together: "pe" -> p e, "xexp(" -> x exp(
  function split(name) {
    if (name.length < 2 || name.toLowerCase() in FUNCS) return null
    if (isOp('(')) {
      for (let k = 1; k < name.length; k++) {
        const head = name.slice(0, k)
        const tail = name.slice(k)
        if (tail.toLowerCase() in FUNCS && !varSet.has(tail) && [...head].every(letter)) return [...head, tail]
      }
    }
    return [...name].every(letter) && [...name].some(ch => varSet.has(ch)) ? [...name] : null
  }

  function startsOperand() {
    const t = tok()
    return t.k === 'num' || t.k === 'name' || (t.k === 'op' && t.v === '(')
  }

  function expr() {
    let node = term()
    while (isOp('+') || isOp('-')) {
      const op = take().v
      node = { t: 'bin', op, a: node, b: term() }
    }
    return node
  }

  function term() {
    let node = unary()
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = take().v
        node = { t: 'bin', op, a: node, b: unary() }
      } else if (startsOperand()) {
        if (tok().k === 'num' && node.t === 'num') throw new ExprError(`Missing an operator between ${node.v} and ${tok().v}.`)
        node = { t: 'bin', op: '*', a: node, b: power(), imp: true }
      } else return node
    }
  }

  function unary() {
    if (isOp('-')) {
      take()
      return { t: 'neg', a: unary() }
    }
    if (isOp('+')) {
      take()
      return unary()
    }
    return power()
  }

  function power() {
    const base = postfix()
    if (isOp('^')) {
      take()
      if (++depth > 40) throw new ExprError('Too deeply nested.')
      const exp = unary()
      depth--
      return { t: 'bin', op: '^', a: base, b: exp }
    }
    return base
  }

  function postfix() {
    let node = atom()
    while (isOp('!')) {
      take()
      node = { t: 'fact', a: node }
    }
    return node
  }

  function atom() {
    const t = tok()
    if (t.k === 'num') {
      take()
      return { t: 'num', v: t.v }
    }
    if (t.k === 'op' && t.v === '(') {
      take()
      if (++depth > 40) throw new ExprError('Too deeply nested.')
      if (isOp(')')) throw new ExprError('Empty parentheses.')
      const inner = expr()
      depth--
      expect(')')
      return { t: 'group', a: inner }
    }
    if (t.k === 'name') {
      take()
      if (isFunc(t) && isOp('(')) return call(t.v.toLowerCase())
      if (varSet.has(t.v)) return { t: 'var', n: t.v }
      if (t.v === 'e' || t.v.toLowerCase() === 'pi') return { t: 'const', n: t.v.toLowerCase() }
      const pieces = split(t.v)
      if (pieces) {
        toks.splice(i, 0, ...pieces.slice(1).map(v => ({ k: 'name', v })))
        return varSet.has(pieces[0]) ? { t: 'var', n: pieces[0] } : { t: 'const', n: pieces[0] }
      }
      if (isFunc(t)) throw new ExprError(`${t.v} needs parentheses, like ${t.v}(x).`)
      throw new ExprError(`I don't know "${t.v}". Use ${vars.join(', ')}.`)
    }
    if (t.k === 'end') throw new ExprError('The answer ends too early.')
    throw new ExprError(`Unexpected "${t.v}".`)
  }

  function call(name) {
    const f = name === 'log' ? 'ln' : name === 'binom' || name === 'choose' ? 'c' : name
    expect('(')
    const args = [expr()]
    while (isOp(',')) {
      take()
      args.push(expr())
    }
    expect(')')
    if (args.length !== FUNCS[f]) throw new ExprError(f === 'c' ? 'C takes two inputs, like C(10,3).' : `${f} takes one input.`)
    return { t: 'call', f, args }
  }

  if (tok().k === 'end') throw new ExprError('Type an answer first.')
  const root = expr()
  if (tok().k !== 'end') {
    if (isOp(')')) throw new ExprError('There is an extra closing parenthesis.')
    throw new ExprError(`Unexpected "${tok().v}".`)
  }
  return root
}

export function parseExpr(src, vars = []) {
  if (String(src).length > 200) throw new ExprError('That is too long for an answer.')
  return parser(String(src), vars)
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN
  let f = 1
  for (let k = 2; k <= n; k++) f *= k
  return f
}

function choose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < 0) return NaN
  if (k > n) return 0
  let c = 1
  for (let j = 1; j <= Math.min(k, n - k); j++) c = (c * (n - Math.min(k, n - k) + j)) / j
  return Math.round(c) === c || c > 1e15 ? c : Math.round(c)
}

export function evalExpr(node, env) {
  const ev = n => evalExpr(n, env)
  switch (node.t) {
    case 'num':
      return parseFloat(node.v)
    case 'var':
      if (!(node.n in env)) throw new ExprError(`No value for ${node.n}.`)
      return env[node.n]
    case 'const':
      return node.n === 'e' ? Math.E : Math.PI
    case 'group':
      return ev(node.a)
    case 'neg':
      return -ev(node.a)
    case 'fact':
      return factorial(ev(node.a))
    case 'call': {
      const v = node.args.map(ev)
      if (node.f === 'exp') return Math.exp(v[0])
      if (node.f === 'ln') return Math.log(v[0])
      if (node.f === 'sqrt') return Math.sqrt(v[0])
      return choose(v[0], v[1])
    }
    case 'bin': {
      const a = ev(node.a)
      const b = ev(node.b)
      if (node.op === '+') return a + b
      if (node.op === '-') return a - b
      if (node.op === '*') return a * b
      if (node.op === '/') return a / b
      return Math.pow(a, b)
    }
  }
  throw new ExprError('I could not work that out.')
}

// ---------- LaTeX ----------

const strip = n => (n.t === 'group' ? strip(n.a) : n)
const letterish = n => {
  const m = n.t === 'bin' && n.op === '^' ? n.a : n
  return m.t === 'const' || (m.t === 'var' && (m.n.length === 1 || GREEK.includes(m.n)))
}
const rightmost = n => (n.t === 'bin' && n.op === '*' && n.imp ? rightmost(n.b) : n)

export function exprLatex(node) {
  const L = exprLatex
  switch (node.t) {
    case 'num':
      return node.v
    case 'var':
      return node.n.length === 1 ? node.n : GREEK.includes(node.n) ? `\\${node.n}` : `\\mathrm{${node.n}}`
    case 'const':
      return node.n === 'e' ? 'e' : '\\pi'
    case 'group':
      return `\\left(${L(node.a)}\\right)`
    case 'neg':
      return `-${L(node.a)}`
    case 'fact':
      return ['num', 'var', 'const', 'group'].includes(node.a.t) ? `${L(node.a)}!` : `\\left(${L(node.a)}\\right)!`
    case 'call':
      if (node.f === 'c') return `\\binom{${L(strip(node.args[0]))}}{${L(strip(node.args[1]))}}`
      if (node.f === 'sqrt') return `\\sqrt{${L(strip(node.args[0]))}}`
      if (node.f === 'exp') return `e^{${L(strip(node.args[0]))}}`
      return `\\ln\\left(${L(strip(node.args[0]))}\\right)`
    case 'bin':
      if (node.op === '/') return `\\frac{${L(strip(node.a))}}{${L(strip(node.b))}}`
      if (node.op === '^') {
        const base = ['num', 'var', 'const', 'group'].includes(node.a.t) ? L(node.a) : `{${L(node.a)}}`
        return `${base}^{${L(strip(node.b))}}`
      }
      if (node.op === '*') {
        if (!node.imp) return `${L(node.a)} \\cdot ${L(node.b)}`
        const left = rightmost(node.a)
        let sep = letterish(node.b) && (left.t === 'num' || letterish(left)) ? '' : '\\,'
        if (sep === '' && left.t === 'var' && GREEK.includes(left.n)) sep = ' '
        return `${L(node.a)}${sep}${L(node.b)}`
      }
      return `${L(node.a)} ${node.op} ${L(node.b)}`
  }
  return ''
}

// LaTeX of a typed formula, or null if it doesn't parse.
export function toLatex(src, vars) {
  try {
    return exprLatex(parseExpr(src, vars))
  } catch {
    return null
  }
}

// ---------- grading ----------

// Relative agreement: a wrong formula can't hide where the values are tiny
// (a pdf far out in its tail), only floating-point noise is forgiven.
function close(a, b, tol) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.isNaN(a) === Number.isNaN(b) && a === b
  return Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b)) + 1e-14
}

// Do two formulas agree at every sample point?
export function sameFormula(a, b, vars, points, tol = 1e-7) {
  const x = typeof a === 'string' ? parseExpr(a, vars) : a
  const y = typeof b === 'string' ? parseExpr(b, vars) : b
  return points.every(env => close(evalExpr(x, env), evalExpr(y, env), tol))
}

// An `accept(raw)` for a formula answer: right when it agrees with `answer`
// at every point. `points` are variable values where the formula is defined
// (and where wrong forms differ): [{ p: 0.3, q: 0.7, t: 0.2 }, ...].
export function formulaAnswer(answer, vars, points) {
  const target = parseExpr(answer, vars)
  const want = points.map(env => evalExpr(target, env))
  return raw => {
    let typed
    try {
      typed = parseExpr(raw, vars)
    } catch {
      return false
    }
    try {
      return points.every((env, i) => close(evalExpr(typed, env), want[i], 1e-7))
    } catch {
      return false
    }
  }
}
