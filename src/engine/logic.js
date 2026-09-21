// Propositional logic: parse typed formulas, evaluate over every truth
// assignment, render to KaTeX/unicode, and compare for logical equivalence.
//
// AST: { t: 'var', name } | { t: 'not', a } | { t: 'and'|'or'|'imp'|'iff', a, b }

export const V = name => ({ t: 'var', name })
export const NOT = a => ({ t: 'not', a })
export const AND = (a, b) => ({ t: 'and', a, b })
export const OR = (a, b) => ({ t: 'or', a, b })
export const IMP = (a, b) => ({ t: 'imp', a, b })
export const IFF = (a, b) => ({ t: 'iff', a, b })

const isOperand = tok => tok === ')' || (tok && typeof tok === 'object')

// Accepts ~ ¬ ! not, ∧ ^ & and, ∨ | v or, ⇒ → => -> implies, ⇔ ↔ <=> <-> iff.
export function tokenize(src) {
  const out = []
  let s = src
  while (s.length) {
    let m
    if ((m = s.match(/^\s+/))) {
      s = s.slice(m[0].length)
      continue
    }
    if ((m = s.match(/^(<=>|<->|↔|⇔)/))) out.push('iff')
    else if ((m = s.match(/^(=>|->|→|⇒|⊃)/))) out.push('imp')
    else if ((m = s.match(/^(∧|\^|&&|&|\/\\|·)/))) out.push('and')
    else if ((m = s.match(/^(∨|\|\||\||\\\/)/))) out.push('or')
    else if ((m = s.match(/^(~|¬|!)/))) out.push('not')
    else if ((m = s.match(/^(iff|implies|then|and|or|not)(?![a-z])/i))) {
      const w = m[1].toLowerCase()
      out.push(w === 'implies' || w === 'then' ? 'imp' : w)
    } else if ((m = s.match(/^[vV](?=\s*[A-Za-z(~¬!])/)) && isOperand(out[out.length - 1])) {
      out.push('or') // "P v Q": a lone v between operands is a vee
    } else if ((m = s.match(/^[A-Za-z]/))) out.push({ v: m[0].toUpperCase() })
    else if ((m = s.match(/^[()]/))) out.push(m[0])
    else throw new Error(`unexpected "${s[0]}"`)
    s = s.slice(m[0].length)
  }
  return out
}

// Precedence: not > and > or > imp (right-assoc) > iff.
export function parse(src) {
  const toks = tokenize(src)
  let i = 0
  const peek = () => toks[i]
  const take = () => toks[i++]
  function pIff() {
    let a = pImp()
    while (peek() === 'iff') {
      take()
      a = IFF(a, pImp())
    }
    return a
  }
  function pImp() {
    const a = pOr()
    if (peek() === 'imp') {
      take()
      return IMP(a, pImp())
    }
    return a
  }
  function pOr() {
    let a = pAnd()
    while (peek() === 'or') {
      take()
      a = OR(a, pAnd())
    }
    return a
  }
  function pAnd() {
    let a = pNot()
    while (peek() === 'and') {
      take()
      a = AND(a, pNot())
    }
    return a
  }
  function pNot() {
    if (peek() === 'not') {
      take()
      return NOT(pNot())
    }
    return pAtom()
  }
  function pAtom() {
    const t = take()
    if (t === '(') {
      const a = pIff()
      if (take() !== ')') throw new Error('missing )')
      return a
    }
    if (t && t.v) return V(t.v)
    throw new Error('expected a statement')
  }
  const ast = pIff()
  if (i !== toks.length) throw new Error('trailing input')
  return ast
}

export function tryParse(src) {
  try {
    return parse(src)
  } catch {
    return null
  }
}

export function evaluate(ast, env) {
  switch (ast.t) {
    case 'var':
      return !!env[ast.name]
    case 'not':
      return !evaluate(ast.a, env)
    case 'and':
      return evaluate(ast.a, env) && evaluate(ast.b, env)
    case 'or':
      return evaluate(ast.a, env) || evaluate(ast.b, env)
    case 'imp':
      return !evaluate(ast.a, env) || evaluate(ast.b, env)
    case 'iff':
      return evaluate(ast.a, env) === evaluate(ast.b, env)
    default:
      throw new Error('bad node')
  }
}

export function varsOf(ast, acc = new Set()) {
  if (ast.t === 'var') acc.add(ast.name)
  else if (ast.t === 'not') varsOf(ast.a, acc)
  else {
    varsOf(ast.a, acc)
    varsOf(ast.b, acc)
  }
  return [...acc].sort()
}

// Rows in textbook order: all T first, last variable flips fastest
// (TT, TF, FT, FF).
export function assignments(vars) {
  const rows = []
  const n = vars.length
  for (let i = 0; i < 1 << n; i++) {
    const env = {}
    vars.forEach((v, j) => {
      env[v] = !((i >> (n - 1 - j)) & 1)
    })
    rows.push(env)
  }
  return rows
}

export function column(ast, vars = varsOf(ast)) {
  return assignments(vars).map(env => evaluate(ast, env))
}

export const colString = bools => bools.map(b => (b ? 'T' : 'F')).join('')

export function equivalent(a, b) {
  const vars = [...new Set([...varsOf(a), ...varsOf(b)])].sort()
  return assignments(vars).every(env => evaluate(a, env) === evaluate(b, env))
}

export const isTautology = ast => column(ast).every(Boolean)
export const isContradiction = ast => column(ast).every(v => !v)

// True when every ~ sits directly on a variable (no ~(compound), no ~~P).
export function negationsAtomic(ast) {
  if (ast.t === 'var') return true
  if (ast.t === 'not') return ast.a.t === 'var'
  return negationsAtomic(ast.a) && negationsAtomic(ast.b)
}

// Simplified negation: push ~ inward with De Morgan / Theorem 2.25.
export function negate(ast) {
  switch (ast.t) {
    case 'var':
      return NOT(ast)
    case 'not':
      return ast.a
    case 'and':
      return OR(negate(ast.a), negate(ast.b))
    case 'or':
      return AND(negate(ast.a), negate(ast.b))
    case 'imp':
      return AND(ast.a, negate(ast.b))
    case 'iff':
      return IFF(ast.a, negate(ast.b))
    default:
      throw new Error('bad node')
  }
}

const SYM = {
  latex: { not: '\\sim ', and: ' \\wedge ', or: ' \\vee ', imp: ' \\Rightarrow ', iff: ' \\Leftrightarrow ' },
  text: { not: '~', and: ' ∧ ', or: ' ∨ ', imp: ' ⇒ ', iff: ' ⇔ ' },
}

// Class convention: ∧ and ∨ mixes are always parenthesized; ⇒ and ⇔ are done
// last, so their and/or children go bare.
function needsParens(parent, child) {
  if (child.t === 'var' || child.t === 'not') return false
  if (parent === 'and' || parent === 'or') return true
  return child.t === 'imp' || child.t === 'iff'
}

function render(ast, sym) {
  if (ast.t === 'var') return ast.name
  if (ast.t === 'not') {
    const inner = render(ast.a, sym)
    return sym.not + (ast.a.t === 'var' ? inner : `(${inner})`)
  }
  const wrap = child => {
    const r = render(child, sym)
    return needsParens(ast.t, child) ? `(${r})` : r
  }
  return wrap(ast.a) + sym[ast.t] + wrap(ast.b)
}

export const toLatex = ast => render(ast, SYM.latex)
export const toText = ast => render(ast, SYM.text)

// KaTeX truth table: one column per variable, then a "?" column for the formula.
export function truthTableLatex(vars, formulaLatex) {
  const head = [...vars, formulaLatex].join(' & ')
  const rows = assignments(vars)
    .map(env => [...vars.map(v => (env[v] ? 'T' : 'F')), '?'].join(' & '))
    .join(' \\\\ ')
  return `\\begin{array}{${'c'.repeat(vars.length)}|c} ${head} \\\\ \\hline ${rows} \\end{array}`
}

// Replace variables by formulas: map is { P: ast, ... }; unmapped variables
// stay. A ~ sitting directly on a variable that maps to a negation cancels,
// so substituting literals never manufactures a double negative.
export function substitute(ast, map) {
  if (ast.t === 'var') return map[ast.name] ?? ast
  if (ast.t === 'not') {
    const inner = substitute(ast.a, map)
    return ast.a.t === 'var' && inner.t === 'not' ? inner.a : NOT(inner)
  }
  return { t: ast.t, a: substitute(ast.a, map), b: substitute(ast.b, map) }
}

export function randomFormula(rng, vars, ops, depth) {
  const pick = arr => arr[Math.floor(rng() * arr.length)]
  function build(d) {
    if (d === 0 || rng() < 0.25) {
      const v = V(pick(vars))
      return rng() < 0.35 ? NOT(v) : v
    }
    const op = pick(ops)
    if (op === 'not') return NOT(build(d - 1))
    const node = { t: op, a: build(d - 1), b: build(d - 1) }
    return node
  }
  return build(depth)
}
