// Independent re-derivations for every Math 223 generator. See verify.mjs.
//
// Nothing here imports the class files or the app's logic engine: the formula
// parser (shunting-yard over LaTeX/unicode), the structural set parser, the
// set-expression evaluator, and every predicate are separate implementations.
// English option banks are re-listed here so a miswired option or letter is
// caught, even though the English itself cannot be re-derived.

// ---------- small number theory ----------
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

// ---------- structural sets ----------
// A set is an array (deduplicated, order-free); leaves are numbers or strings.
const isSet = Array.isArray
function deepEq(a, b) {
  if (isSet(a) !== isSet(b)) return false
  if (!isSet(a)) return a === b
  return a.length === b.length && a.every(x => b.some(y => deepEq(x, y)))
}
const has = (S, x) => S.some(e => deepEq(e, x))
const subset = (X, S) => X.every(x => has(S, x))
const dedupe = arr => arr.filter((x, i) => arr.findIndex(y => deepEq(x, y)) === i)

function splitTop(s) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '{' || ch === '(') depth++
    if (ch === '}' || ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

// LaTeX / plain set notation -> plain braces.
const norm = s =>
  String(s)
    .replace(/\\left\||\\right\|/g, '')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\varnothing|∅/g, '{}')
    .trim()

function parseStruct(s) {
  s = s.trim()
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw new Error(`unbalanced set ${s}`)
    return dedupe(splitTop(s.slice(1, -1)).map(parseStruct))
  }
  if (/^-?\d+$/.test(s)) return Number(s)
  return s
}

// "A = {...}, B = {...}" with balanced (possibly nested) braces.
function namedSets(text) {
  const out = {}
  for (const m of text.matchAll(/\b([A-Z]) = ∅/g)) out[m[1]] = []
  const re = /\b([A-Z]) = (?=\{)/g
  let m
  while ((m = re.exec(text))) {
    const start = m.index + m[0].length
    let depth = 0
    let i = start
    for (; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}' && --depth === 0) break
    }
    out[m[1]] = parseStruct(norm(text.slice(start, i + 1)))
  }
  return out
}

const numeric = arr => arr.every(x => typeof x === 'number')
const sortEls = arr => [...arr].sort((a, b) => (numeric([a, b]) ? a - b : String(a).localeCompare(String(b))))
const setStr = arr => (arr.length ? `{${sortEls(arr).join(', ')}}` : '∅')

function subsetsOf(S) {
  const out = []
  for (let mask = 0; mask < 1 << S.length; mask++) out.push(S.filter((_, i) => mask & (1 << i)))
  return out
}

// ---------- propositional logic (shunting-yard) ----------
const PREC = { '~': 5, '∧': 4, '∨': 3, '⇒': 2, '⇔': 1 }
const RIGHT = { '~': true, '⇒': true }

function lexLogic(src) {
  const s = String(src)
    .replace(/\\sim/g, '~')
    .replace(/\\wedge/g, '∧')
    .replace(/\\vee/g, '∨')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\left|\\right/g, '')
    .replace(/\^/g, '∧')
    .replace(/(?<![A-Za-z])v(?![A-Za-z])/g, '∨')
    .replace(/<=>/g, '⇔')
    .replace(/=>/g, '⇒')
  const toks = []
  for (const ch of s) {
    if (/\s/.test(ch)) continue
    if ('~∧∨⇒⇔()'.includes(ch)) toks.push(ch)
    else if (/[A-Z]/.test(ch)) toks.push({ v: ch })
    else throw new Error(`cannot lex "${ch}" in ${src}`)
  }
  return toks
}

function compileLogic(src) {
  const out = []
  const ops = []
  const apply = op => {
    if (op === '~') {
      const a = out.pop()
      if (!a) throw new Error('dangling ~')
      out.push({ k: '~', a })
    } else {
      const b = out.pop()
      const a = out.pop()
      if (!a || !b) throw new Error(`missing operand for ${op}`)
      out.push({ k: op, a, b })
    }
  }
  for (const t of lexLogic(src)) {
    if (typeof t === 'object') out.push({ k: 'v', n: t.v })
    else if (t === '(') ops.push(t)
    else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply(ops.pop())
      if (!ops.length) throw new Error('unbalanced )')
      ops.pop()
    } else {
      while (ops.length) {
        const top = ops[ops.length - 1]
        if (top === '(') break
        if (PREC[top] > PREC[t] || (PREC[top] === PREC[t] && !RIGHT[t])) apply(ops.pop())
        else break
      }
      ops.push(t)
    }
  }
  while (ops.length) {
    const op = ops.pop()
    if (op === '(') throw new Error('unbalanced (')
    apply(op)
  }
  if (out.length !== 1) throw new Error(`malformed formula ${src}`)
  return out[0]
}

function ev(node, env) {
  switch (node.k) {
    case 'v':
      if (!(node.n in env)) throw new Error(`no value for ${node.n}`)
      return env[node.n]
    case '~':
      return !ev(node.a, env)
    case '∧':
      return ev(node.a, env) && ev(node.b, env)
    case '∨':
      return ev(node.a, env) || ev(node.b, env)
    case '⇒':
      return !ev(node.a, env) || ev(node.b, env)
    case '⇔':
      return ev(node.a, env) === ev(node.b, env)
    default:
      throw new Error('bad node')
  }
}
function varsIn(node, acc = new Set()) {
  if (node.k === 'v') acc.add(node.n)
  else {
    varsIn(node.a, acc)
    if (node.b) varsIn(node.b, acc)
  }
  return [...acc].sort()
}
function rows(vars) {
  const out = []
  for (let i = 0; i < 1 << vars.length; i++) {
    const env = {}
    vars.forEach((v, j) => (env[v] = !((i >> (vars.length - 1 - j)) & 1)))
    out.push(env)
  }
  return out
}
const colOf = (node, vars = varsIn(node)) => rows(vars).map(env => (ev(node, env) ? 'T' : 'F')).join('')
function equiv(a, b) {
  const vars = [...new Set([...varsIn(a), ...varsIn(b)])].sort()
  return rows(vars).every(env => ev(a, env) === ev(b, env))
}
function atomicNeg(node) {
  if (node.k === 'v') return true
  if (node.k === '~') return node.a.k === 'v'
  return atomicNeg(node.a) && atomicNeg(node.b)
}
const sameTree = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// text "P is true, Q is false, and R is true." -> env
function envFromText(text) {
  const env = {}
  for (const m of text.matchAll(/([PQR]) is (true|false)/g)) env[m[1]] = m[2] === 'true'
  return env
}
// last header cell of a KaTeX truth table
function tableFormula(latex) {
  const header = latex.split('\\\\')[0]
  const cells = header.replace(/\\begin\{array\}\{[^}]*\}/, '').split('&')
  return cells[cells.length - 1]
}
const truthTable = p => {
  const header = p.latex.split('\\\\')[0].replace(/\\begin\{array\}\{[^}]*\}/, '').split('&').map(c => c.trim())
  return colOf(compileLogic(header[header.length - 1]), header.slice(0, -1))
}
const evalAt = p => (ev(compileLogic(p.latex), envFromText(p.text)) ? 'true' : 'false')

// ---------- numbers written in LaTeX ----------
function parseNum(latex) {
  const s = latex.replace(/\s+/g, '')
  let m
  if ((m = s.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/))) {
    const v = ((m[1] ? -1 : 1) * m[2]) / m[3]
    return { v, int: Number.isInteger(v), rat: true, real: true, zero: v === 0 }
  }
  if (s === '\\sqrt{2}') return { v: Math.SQRT2, int: false, rat: false, real: true, zero: false }
  if (s === '\\pi') return { v: Math.PI, int: false, rat: false, real: true, zero: false }
  if (s === '-\\pi') return { v: -Math.PI, int: false, rat: false, real: true, zero: false }
  if (s === 'e') return { v: Math.E, int: false, rat: false, real: true, zero: false }
  if ((m = s.match(/^-?\d+(\.\d+)?$/))) {
    const v = Number(s)
    return { v, int: Number.isInteger(v), rat: true, real: true, zero: v === 0 }
  }
  if (/i$/.test(s)) return { v: NaN, int: false, rat: false, real: false, zero: false } // i, -2i, 1+i
  throw new Error(`cannot parse number ${latex}`)
}

// set-builder condition on x -> predicate on a real number
function parseCond(latex) {
  const c = latex.trim()
  let m
  if ((m = c.match(/^(.+?) < x < (.+)$/))) {
    const lo = parseNum(m[1]).v
    const hi = parseNum(m[2]).v
    return x => lo < x && x < hi
  }
  if ((m = c.match(/^x\^2 < (\d+)$/))) return x => x * x < +m[1]
  if ((m = c.match(/^\|x\| \\le (\d+)$/))) return x => Math.abs(x) <= +m[1]
  if ((m = c.match(/^x\^2 = (\d+)$/))) return x => x * x === +m[1]
  throw new Error(`unknown condition ${latex}`)
}

// ---------- set expressions over named sets ----------
function evalSetExpr(latex, sets) {
  const src = latex.replace(/\s+/g, ' ').trim()
  let pos = 0
  const peek = () => src.slice(pos)
  const eat = re => {
    const m = peek().match(re)
    if (!m || m.index !== 0) return null
    pos += m[0].length
    return m
  }
  const skip = () => eat(/^\s+/)
  const union = (X, Y) => dedupe([...X, ...Y])
  const inter = (X, Y) => X.filter(x => has(Y, x))
  const diff = (X, Y) => X.filter(x => !has(Y, x))
  function primary() {
    skip()
    if (eat(/^\\overline\{/)) {
      const inner = expr()
      skip()
      if (!eat(/^\}/)) throw new Error('overline }')
      return diff(sets.U, inner)
    }
    if (eat(/^\(/)) {
      const inner = expr()
      skip()
      if (!eat(/^\)/)) throw new Error(') expected')
      return inner
    }
    if (eat(/^\\varnothing/)) return []
    const m = eat(/^[UABC]/)
    if (!m) throw new Error(`bad set expression at "${peek()}"`)
    if (!sets[m[0]]) throw new Error(`no set ${m[0]}`)
    return sets[m[0]]
  }
  function expr() {
    let acc = primary()
    for (;;) {
      skip()
      const m = eat(/^(\\cup|\\cap|-)/)
      if (!m) return acc
      const rhs = primary()
      acc = m[1] === '\\cup' ? union(acc, rhs) : m[1] === '\\cap' ? inter(acc, rhs) : diff(acc, rhs)
    }
  }
  const v = expr()
  skip()
  if (pos !== src.length) throw new Error(`trailing "${peek()}" in ${latex}`)
  return v
}

// ---------- interval families ----------
function endpointFn(latexExpr) {
  let js = latexExpr
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '(($1)/($2))')
    .replace(/\s+/g, '')
  if (!/^[-+*/().\di]*$/.test(js)) throw new Error(`bad endpoint ${latexExpr}`)
  js = js.replace(/(\d)i/g, '$1*i')
  return new Function('i', `return ${js}`)
}

function intervalFamily(fam, wantUnion) {
  const s = fam.replace(/\\left|\\right/g, '').trim()
  const m = s.match(/^([[(])(.+),(.+)([\])])$/)
  if (!m) throw new Error(`bad family ${fam}`)
  const lo = endpointFn(m[2])
  const hi = endpointFn(m[3])
  const lc = m[1] === '['
  const hc = m[4] === ']'
  const eps = 1e-7
  const inA = (x, i) => (lc ? lo(i) <= x + eps : lo(i) < x) && (hc ? x <= hi(i) + eps : x < hi(i))
  const nonempty = i => lo(i) < hi(i) || (lo(i) === hi(i) && lc && hc)
  const N = 3000
  const idx = []
  for (let i = 1; i <= N; i++) if (nonempty(i)) idx.push(i)
  const bigs = [1e6, 1e7]
  const fmtNum = x => (Math.abs(x) > 1e5 ? (x > 0 ? '∞' : '-∞') : String(parseFloat(x.toFixed(6))))
  const fmt = (a, aClosed, b, bClosed) => {
    const A = fmtNum(a)
    const B = fmtNum(b)
    if (A === '-∞' && B === '∞') return 'R'
    return `${aClosed && A !== '-∞' ? '[' : '('}${A}, ${B}${bClosed && B !== '∞' ? ']' : ')'}`
  }
  if (wantUnion) {
    if (!idx.length) return '∅'
    const all = [...idx, ...bigs]
    const L = Math.min(...all.map(lo))
    const H = Math.max(...all.map(hi))
    const lClosed = lc && idx.some(i => Math.abs(lo(i) - L) < eps)
    const hClosed = hc && idx.some(i => Math.abs(hi(i) - H) < eps)
    return fmt(L, lClosed, H, hClosed)
  }
  if (idx.length !== N) return '∅' // some A_i is empty
  const all = [...idx, ...bigs]
  const L = Math.max(...all.map(lo))
  const H = Math.min(...all.map(hi))
  const inAll = x => all.every(i => inA(x, i))
  if (Math.abs(L - H) < 1e-5) {
    // the endpoints meet in the limit: only the limit point itself can survive
    const x = parseFloat(((L + H) / 2).toFixed(5))
    return inAll(x) ? `{${fmtNum(x)}}` : '∅'
  }
  if (L > H) return '∅'
  return fmt(L, inAll(L), H, inAll(H))
}

// ---------- English banks (second listing) ----------
const STATEMENT_YES = new Set([
  'All birds talk.', "Dr. Cannon's car is green.", 'The Albert Einstein Story is the Best Picture Oscar winner for 2035.',
  "John Smith is Dr. Hudson's favorite student.", 'The integer 7 is prime.', '2 + 2 = 5.', 'Every square is a rectangle.',
  'Paris is the capital of France.', 'There are infinitely many twin primes.', '√2 is a rational number.', '0 is a natural number.',
  'Every even integer greater than 2 is the sum of two primes.', 'Some prime number is even.', 'The number 15 is a multiple of 4.',
  'The sum of two even integers is even.', 'Every rectangle is a square.', 'Baton Rouge is the capital of Louisiana.', '3 is an even integer.',
  'There is a largest prime number.', 'The decimal expansion of π contains one million consecutive 7s.', '1 + 1 = 2 and 2 + 2 = 5.',
  'The empty set is a subset of every set.', 'For every real number x, x² ≥ 0.', 'There exists an integer n such that n² = 2.',
  'Louisiana has 64 parishes.', 'The 100th digit of π is 7.',
])
const STATEMENT_NO = new Set([
  'x > 2.', 'She received an A on her chemistry exam.', 'Is it raining?', 'Close the door.', 'n is a prime number.', 'x + 3 = 7.',
  'He is a math major.', 'What time is it?', 'Please pass the salt.', 'x² = 4.', 'They live in Hammond.', 'Study for the test!',
  'n and n + 2 are both prime.', 'Wow, what a game!',
  'This sentence is false.', '3x − 2 is positive.', 'The number m is even.', 'Do your homework.', 'How many primes are there?', 'It is a rectangle.',
  'Happy birthday!', 'May I borrow your pencil?', 'x is a rational number.', 'Let n be an integer.', '5x + 3.', 'A ⊆ B.',
])
// number-filled sentences: only specific numbers -> statement; a free letter -> open sentence
const NUMBER_SENTENCE = [
  [/^The integer \d+ is (prime|even|odd|a perfect square)\.$/, 'yes'],
  [/^The integer [a-z] is (prime|even|odd|a perfect square)\.$/, 'no'],
  [/^\d+ \+ \d+ = \d+\.$/, 'yes'],
  [/^[a-z] \+ \d+ = \d+\.$/, 'no'],
  [/^\d+ is a multiple of \d+\.$/, 'yes'],
  [/^[a-z] is a multiple of \d+\.$/, 'no'],
]

const NEGATIONS = {
  "Mary's car is not green.": "Mary's car is green.",
  'The solution to the equation 9x + 4 = 12 is negative.': 'The solution to the equation 9x + 4 = 12 is greater than or equal to 0.',
  "All of the professors at Southeastern have Ph.D.'s.": 'At least one professor at Southeastern does not have a Ph.D.',
  'Some students like math.': 'No student likes math.',
  'The integer n is even.': 'The integer n is odd.',
  'Every prime number is odd.': 'Some prime number is even.',
  'There is a real number x such that x² < 0.': 'For every real number x, x² ≥ 0.',
  "Mary's dog is at least 3 years old.": "Mary's dog is less than 3 years old.",
  'The number 10 is a multiple of 4.': 'The number 10 is not a multiple of 4.',
  'Everyone in the class passed.': 'Someone in the class did not pass.',
  'No cat can fly.': 'Some cat can fly.',
  'The function f is continuous at 0.': 'The function f is not continuous at 0.',
  'The real number r is at most √2.': 'The real number r is greater than √2.',
  'The absolute value of the real number a is less than 3.': 'The absolute value of the real number a is at least 3.',
  'Two angles of the triangle are 45°.': 'At most one angle of the triangle is 45°.',
  'The area of the circle is at least 9π.': 'The area of the circle is less than 9π.',
  'Two sides of the triangle have the same length.': 'The sides of the triangle have different lengths.',
  'The point P in the plane lies outside of the circle C.': 'The point P in the plane lies on or inside the circle C.',
  '√2 is a rational number.': '√2 is an irrational number.',
  '0 is not a negative integer.': '0 is a negative integer.',
  '111 is a prime number.': '111 is not a prime number.',
  'At least two of my library books are overdue.': 'At most one of my library books is overdue.',
  'No one expected that to happen.': 'Someone expected that to happen.',
  'The real number x is positive.': 'The real number x is less than or equal to 0.',
  'Every student in the class owns a laptop.': 'Some student in the class does not own a laptop.',
  'Some integers are perfect squares.': 'No integer is a perfect square.',
  'None of the doors are locked.': 'At least one of the doors is locked.',
  'The set A is empty.': 'The set A has at least one element.',
  'The integer k is greater than 7.': 'The integer k is at most 7.',
  'The sets A and B are disjoint.': 'The sets A and B have at least one element in common.',
  'A is a subset of B.': 'Some element of A is not in B.',
  // 2.9 De Morgan / implication negations
  'Either x = 0 or y = 0.': 'x ≠ 0 and y ≠ 0.',
  'The integers a and b are both even.': 'a is odd or b is odd.',
  'If John studies, then he will pass the exam.': 'John studies and he does not pass the exam.',
  'If x, y > 0, then x² > 0 and y² > 0.': 'x, y > 0, and x² ≤ 0 or y² ≤ 0.',
  'The number 7 is prime and 9 is odd.': '7 is not prime or 9 is even.',
  'It is raining or it is cold.': 'It is not raining and it is not cold.',
  'If n is even, then n² is even.': 'n is even and n² is odd.',
  'x ≥ 2 or x ≤ −2.': '−2 < x < 2.',
  'The function f is continuous and f is not differentiable.': 'f is not continuous or f is differentiable.',
  'If Ann is late, then she misses the bus.': 'Ann is late and she does not miss the bus.',
  'x > 0 and y < 0.': 'x ≤ 0 or y ≥ 0.',
  'The integer n is even or n is a multiple of 3.': 'n is odd and n is not a multiple of 3.',
  'If it snows, then school is closed.': 'It snows and school is not closed.',
  'If x² = 9, then x = 3.': 'x² = 9 and x ≠ 3.',
  'Sam plays guitar and Sam sings.': 'Sam does not play guitar or Sam does not sing.',
  'I will take calculus or I will take statistics.': 'I will not take calculus and I will not take statistics.',
  '0 < x < 1.': 'x ≤ 0 or x ≥ 1.',
  'If a and b are odd, then a + b is even.': 'a and b are odd, and a + b is odd.',
  'The set A is empty or the set B is empty.': 'A is nonempty and B is nonempty.',
  'If the triangle is equilateral, then it is isosceles.': 'The triangle is equilateral and it is not isosceles.',
  'The number x is rational and x² is irrational.': 'x is irrational or x² is rational.',
  'If n is prime, then n is odd or n = 2.': 'n is prime, n is even, and n ≠ 2.',
  // 2.10 quantified
  'For all real numbers x, x² ≥ 0.': 'There exists a real number x such that x² < 0.',
  'There exists a rectangle R such that no angle of R is a right angle.': 'Every rectangle has at least one right angle.',
  'All math professors are dorks.': 'Some math professor is not a dork.',
  'For all persons p, if p is blond, then p has blue eyes.': 'There is a blond person who does not have blue eyes.',
  'If a computer program has more than 100,000 lines, then it contains a bug.': 'There is a computer program with more than 100,000 lines that contains no bug.',
  'Every integer is either even or odd.': 'Some integer is neither even nor odd.',
  'There exists an integer n such that n² = 2.': 'For every integer n, n² ≠ 2.',
  'Some student in the class is left-handed.': 'No student in the class is left-handed.',
  'All cats have nine lives.': 'Some cat does not have nine lives.',
  'Every real number has a real square root.': 'Some real number does not have a real square root.',
  'There is a prime number greater than 100.': 'Every prime number is at most 100.',
  'For every integer n, n² + n is even.': 'There exists an integer n such that n² + n is odd.',
  'Some triangles have two right angles.': 'No triangle has two right angles.',
  'For all real numbers x, if x > 1, then x² > x.': 'There exists a real number x such that x > 1 and x² ≤ x.',
  'Every student in this class has taken calculus.': 'Some student in this class has not taken calculus.',
  'There exists a real number x such that x² = −1.': 'For every real number x, x² ≠ −1.',
  'No even integer is prime.': 'Some even integer is prime.',
  'Every rational number is a real number.': 'Some rational number is not a real number.',
  'If n is an odd integer, then 3n + 1 is even.': 'There is an odd integer n such that 3n + 1 is odd.',
}

const IF_THEN = {
  'Let C be a circle of diameter √(2/π). Then the area of C is 1/2.': 'If C is a circle of diameter √(2/π), then the area of C is 1/2.',
  'The 4th power of every odd integer is odd.': 'If n is an odd integer, then n⁴ is odd.',
  'Suppose that the slope of a line l is 2. Then the equation of l is y = 2x + b for some real number b.': 'If the slope of a line l is 2, then the equation of l is y = 2x + b for some real number b.',
  'Whenever a and b are nonzero rational numbers, a/b is a nonzero rational number.': 'If a and b are nonzero rational numbers, then a/b is a nonzero rational number.',
  'For every three integers, there exist two of them whose sum is even.': 'If a, b, and c are integers, then two of a, b, c have an even sum.',
  'The number √3 is irrational.': 'If x = √3, then x is irrational.',
  'Every multiple of 6 is even.': 'If n is a multiple of 6, then n is even.',
  'A square has four equal sides.': 'If a figure is a square, then it has four equal sides.',
  'Every even integer greater than 2 is composite.': 'If n is an even integer greater than 2, then n is composite.',
  'The sum of two odd integers is even.': 'If a and b are odd integers, then a + b is even.',
  'All differentiable functions are continuous.': 'If a function is differentiable, then it is continuous.',
  'The square of a real number is nonnegative.': 'If x is a real number, then x² ≥ 0.',
  'An integer is divisible by 9 whenever the sum of its digits is divisible by 9.': 'If the sum of the digits of an integer is divisible by 9, then the integer is divisible by 9.',
  'Every subset of a finite set is finite.': 'If A is a subset of a finite set, then A is finite.',
  'The empty set is a subset of every set.': 'If A is a set, then ∅ ⊆ A.',
  'A triangle with two equal angles is isosceles.': 'If a triangle has two equal angles, then it is isosceles.',
  'Let n be an integer. Then n² + n is even.': 'If n is an integer, then n² + n is even.',
  'Prime numbers greater than 2 are odd.': 'If p is a prime number greater than 2, then p is odd.',
  'No multiple of 4 is odd.': 'If n is a multiple of 4, then n is not odd.',
}

const NEG_SYMBOLIC = {
  '\\sim(\\forall x \\in D,\\ P(x))': '\\exists x \\in D \\text{ such that } \\sim P(x)',
  '\\sim(\\exists x \\in D \\text{ such that } P(x))': '\\forall x \\in D,\\ \\sim P(x)',
  '\\sim(\\forall x,\\ P(x) \\Rightarrow Q(x))': '\\exists x \\text{ such that } P(x) \\wedge \\sim Q(x)',
  '\\sim(\\forall x \\in D,\\ P(x) \\wedge Q(x))': '\\exists x \\in D \\text{ such that } \\sim P(x) \\vee \\sim Q(x)',
  '\\sim(\\exists x \\in D \\text{ such that } P(x) \\vee Q(x))': '\\forall x \\in D,\\ \\sim P(x) \\wedge \\sim Q(x)',
  '\\sim(\\exists x \\in D \\text{ such that } P(x) \\wedge Q(x))': '\\forall x \\in D,\\ \\sim P(x) \\vee \\sim Q(x)',
  '\\sim(\\forall x \\in D,\\ P(x) \\vee Q(x))': '\\exists x \\in D \\text{ such that } \\sim P(x) \\wedge \\sim Q(x)',
  '\\sim(\\exists x \\in D \\text{ such that } P(x) \\Rightarrow Q(x))': '\\forall x \\in D,\\ P(x) \\wedge \\sim Q(x)',
  '\\sim(\\forall x \\in D,\\ \\sim P(x))': '\\exists x \\in D \\text{ such that } P(x)',
  '\\sim(\\exists x \\in D \\text{ such that } \\sim P(x))': '\\forall x \\in D,\\ P(x)',
}

const quoted = text => {
  const m = text.match(/"([^"]+)"/)
  if (!m) throw new Error(`no quoted sentence in ${text}`)
  return m[1]
}
const optKey = o => (typeof o === 'string' ? o : o.latex)
// letter of the single option matching `pred`
function letterOf(p, pred) {
  const idx = p.options.map((o, i) => (pred(optKey(o), i) ? i : -1)).filter(i => i >= 0)
  if (idx.length !== 1) throw new Error(`${idx.length} options match`)
  return 'abcdefgh'[idx[0]]
}
const bankLetter = (p, bank, key) => {
  if (!(key in bank)) throw new Error(`unknown bank item "${key}"`)
  return letterOf(p, o => o === bank[key])
}

// ---------- predicates on integers / reals keyed by displayed LaTeX ----------
const OPEN_PRED = [
  [/n \\text\{ and \} n \+ 2 \\text\{ are both prime\}/, n => isPrime(n) && isPrime(n + 2)],
  [/^n \\text\{ is prime\}$/, n => isPrime(n)],
  [/^n\^2 > 20$/, n => n * n > 20],
  [/^n \\text\{ divides \} 24$/, n => 24 % n === 0],
  [/^2n \+ 1 \\text\{ is prime\}$/, n => isPrime(2 * n + 1)],
  [/^n \\text\{ is a perfect square\}$/, n => Number.isInteger(Math.sqrt(n))],
  [/^n\^2 - 1 \\text\{ is prime\}$/, n => isPrime(n * n - 1)],
  [/^n\^2 \+ 1 \\text\{ is prime\}$/, n => isPrime(n * n + 1)],
  [/n \\text\{ and \} 2n \+ 1 \\text\{ are both prime\}/, n => isPrime(n) && isPrime(2 * n + 1)],
  [/^3n - 1 \\text\{ is a multiple of \} 4$/, n => (3 * n - 1) % 4 === 0],
  [/^n\^2 \+ n \\text\{ is even\}$/, n => (n * n + n) % 2 === 0],
]
function openPred(latex) {
  const s = latex.trim().replace(/\.$/, '')
  for (const [re, f] of OPEN_PRED) if (re.test(s)) return f
  throw new Error(`unknown open sentence ${latex}`)
}

const X_PRED = {
  'x^2 > x': x => x * x > x,
  'x^2 - 4 \\ne 0': x => x * x - 4 !== 0,
  'x + 1 \\text{ is prime}': x => isPrime(x + 1),
  'x \\text{ is even}': x => x % 2 === 0,
  '|x| = x': x => Math.abs(x) === x,
  'x^3 \\ge x': x => x ** 3 >= x,
  'x^2 - 5x + 6 = 0': x => x * x - 5 * x + 6 === 0,
  'x^2 \\le 10': x => x * x <= 10,
  '2^x > x^2': x => 2 ** x > x * x,
  'x^2 + 2x + 3 = 0': x => x * x + 2 * x + 3 === 0,
  'x^2 + 1 > 0': x => x * x + 1 > 0,
}

// open-sentence pairs for implications, keyed by plain text
const PQ = {
  'x² + y² = 1': (x, y) => x * x + y * y === 1,
  'x + y = 1': (x, y) => x + y === 1,
  'x = y': (x, y) => x === y,
  'x² = y²': (x, y) => x * x === y * y,
  'n is prime': n => isPrime(n),
  'n is odd': n => n % 2 !== 0,
  'x > 3': x => x > 3,
  'x² > 9': x => x * x > 9,
  'n is even': n => n % 2 === 0,
  'n is a multiple of 4': n => n % 4 === 0,
  'xy = 0': (x, y) => x * y === 0,
  'x = 0': x => x === 0,
  'x < y': (x, y) => x < y,
  'x² < y²': (x, y) => x * x < y * y,
  'n is a multiple of 6': n => n % 6 === 0,
  'n is a multiple of 3': n => n % 3 === 0,
  '|x| = 3': x => x === 3 || x === -3,
  'x = 3': x => x === 3,
}

// biconditional predicates keyed by LaTeX
const IFF_PRED = {
  '\\frac{n^3 + n}{2} \\text{ is even}': n => ((n ** 3 + n) / 2) % 2 === 0,
  '\\frac{n^2 + n}{2} \\text{ is odd}': n => ((n * n + n) / 2) % 2 === 1,
  'n \\text{ is even}': n => n % 2 === 0,
  'n^2 + 1 \\text{ is odd}': n => (n * n + 1) % 2 === 1,
  'n \\text{ is prime}': n => isPrime(n),
  'n \\text{ is odd}': n => n % 2 === 1,
  'n^2 > 8': n => n * n > 8,
  'n \\ge 3': n => n >= 3,
  'n \\text{ is a multiple of } 3': n => n % 3 === 0,
  'n^2 \\text{ is a multiple of } 9': n => (n * n) % 9 === 0,
  'n \\text{ is a multiple of } 4': n => n % 4 === 0,
  '2n + 1 \\text{ is prime}': n => isPrime(2 * n + 1),
  'n^2 - n \\text{ is even}': n => (n * n - n) % 2 === 0,
  'n < 10': n => n < 10,
  'n^2 \\text{ is odd}': n => (n * n) % 2 === 1,
  'n^2 \\text{ is a multiple of } 4': n => (n * n) % 4 === 0,
  '3n + 1 \\text{ is even}': n => (3 * n + 1) % 2 === 0,
  'n \\text{ is a perfect square}': n => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100].includes(n),
}

// quantified statements over infinite domains: brute-force searches
const grid = (lo, hi, step) => {
  const out = []
  for (let x = lo; x <= hi + 1e-12; x += step) out.push(parseFloat(x.toFixed(6)))
  return out
}
const REALS = grid(-20, 20, 0.125)
const INTS = grid(-50, 50, 1)
const NATS = INTS.filter(n => n >= 1)
const RATS = (() => {
  const out = new Set()
  for (let d = 1; d <= 12; d++) for (let n = -60; n <= 60; n++) out.add(n / d)
  return [...out]
})()
const INFINITE = {
  '\\forall x \\in \\mathbb{R},\\ x^4 \\ge x': () => REALS.every(x => x ** 4 >= x),
  '\\forall A \\in \\mathcal{P}(\\{a, b\\}),\\ |A \\cup \\{c\\}| \\ge 1': () => subsetsOf(['a', 'b']).every(A => dedupe([...A, 'c']).length >= 1),
  '\\forall x \\in \\mathbb{R},\\ -x^2 + 5x - 2 < 5': () => grid(-50, 50, 0.01).every(x => -x * x + 5 * x - 2 < 5),
  '\\exists q \\in \\mathbb{Q} \\text{ such that } \\sqrt{q} \\in \\mathbb{Z}': () => RATS.some(q => q >= 0 && Number.isInteger(Math.sqrt(q))),
  '\\exists n \\in \\{0, 2, 3\\} \\text{ such that } n^2 + 2n + 3 = 0': () => [0, 2, 3].some(n => n * n + 2 * n + 3 === 0),
  '\\exists A \\in \\mathcal{P}(\\{1, 2, 3, 4\\}) \\text{ such that } A \\cup \\{2, 3\\} \\ne A': () => subsetsOf([1, 2, 3, 4]).some(A => !deepEq(dedupe([...A, 2, 3]), A)),
  '\\exists \\text{ sets } A, B \\text{ such that } |A \\times B| = 5': () => {
    for (let a = 0; a <= 6; a++) for (let b = 0; b <= 6; b++) if (a * b === 5) return true
    return false
  },
  '\\forall x \\in \\mathbb{R},\\ x^2 \\ge 0': () => REALS.every(x => x * x >= 0),
  '\\forall x \\in \\mathbb{R},\\ x^2 > 0': () => REALS.every(x => x * x > 0),
  '\\exists x \\in \\mathbb{Z} \\text{ such that } x^2 = 2': () => INTS.some(x => x * x === 2),
  '\\forall x \\in \\mathbb{Z},\\ x^2 \\ge x': () => INTS.every(x => x * x >= x),
  '\\forall x \\in \\mathbb{R},\\ x^2 \\ge x': () => REALS.every(x => x * x >= x),
  '\\exists x \\in \\mathbb{R} \\text{ such that } x^2 + 1 = 0': () => REALS.some(x => x * x + 1 === 0),
  '\\forall n \\in \\mathbb{N},\\ n + 1 > n': () => INTS.filter(n => n >= 1).every(n => n + 1 > n),
  '\\exists n \\in \\mathbb{N} \\text{ such that } n^2 = n': () => INTS.filter(n => n >= 1).some(n => n * n === n),
  '\\forall x \\in \\mathbb{R},\\ |x| = x': () => REALS.every(x => Math.abs(x) === x),
  '\\exists x \\in \\mathbb{R} \\text{ such that } |x| = -x': () => REALS.some(x => Math.abs(x) === -x),
  '\\forall n \\in \\mathbb{N},\\ n^2 + n + 41 \\text{ is prime}': () => INTS.filter(n => n >= 1).every(n => isPrime(n * n + n + 41)),
  '\\exists x \\in \\mathbb{Q} \\text{ such that } x^2 = 2': () => RATS.some(x => x * x === 2),
  '\\forall x \\in \\mathbb{R},\\ x^2 + x + 1 > 0': () => REALS.every(x => x * x + x + 1 > 0),
  '\\exists x \\in \\mathbb{R} \\text{ such that } x^2 < x': () => REALS.some(x => x * x < x),
  '\\exists n \\in \\mathbb{N} \\text{ such that } n^2 < n': () => NATS.some(n => n * n < n),
  '\\forall n \\in \\mathbb{N},\\ n^2 \\ge n': () => NATS.every(n => n * n >= n),
  '\\exists x \\in \\mathbb{Z} \\text{ such that } 2x = 7': () => INTS.some(x => 2 * x === 7),
  '\\exists x \\in \\mathbb{Q} \\text{ such that } 2x = 7': () => RATS.some(x => 2 * x === 7),
  '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = x': () => REALS.every(x => Math.sqrt(x * x) === x),
  '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = |x|': () => REALS.every(x => Math.sqrt(x * x) === Math.abs(x)),
  '\\exists n \\in \\mathbb{N} \\text{ such that } n + 5 = 2': () => NATS.some(n => n + 5 === 2),
  '\\exists n \\in \\mathbb{Z} \\text{ such that } n + 5 = 2': () => INTS.some(n => n + 5 === 2),
  '\\forall n \\in \\mathbb{Z},\\ n^2 + n \\text{ is even}': () => INTS.every(n => (n * n + n) % 2 === 0),
  '\\forall n \\in \\mathbb{Z},\\ n^2 \\text{ is even}': () => INTS.every(n => (n * n) % 2 === 0),
  '\\forall x \\in \\mathbb{R},\\ 2x > x': () => REALS.every(x => 2 * x > x),
  '\\forall n \\in \\mathbb{N},\\ 2n > n': () => NATS.every(n => 2 * n > n),
  '\\exists x \\in \\mathbb{R} \\text{ such that } x^3 = -8': () => REALS.some(x => x * x * x === -8),
  '\\exists x \\in \\mathbb{N} \\text{ such that } x^3 = -8': () => NATS.some(x => x * x * x === -8),
  '\\forall x \\in \\mathbb{R},\\ x^3 \\ge x^2': () => REALS.every(x => x * x * x >= x * x),
  '\\exists n \\in \\mathbb{N} \\text{ such that } n \\text{ is even and prime}': () => NATS.some(n => n % 2 === 0 && isPrime(n)),
  '\\forall A \\in \\mathcal{P}(\\{1, 2, 3\\}),\\ |A| \\le 3': () => subsetsOf([1, 2, 3]).every(A => A.length <= 3),
  '\\exists A \\in \\mathcal{P}(\\{1, 2\\}) \\text{ such that } |A| = 3': () => subsetsOf([1, 2]).some(A => A.length === 3),
  '\\forall A \\in \\mathcal{P}(\\{1, 2\\}),\\ \\varnothing \\subseteq A': () => subsetsOf([1, 2]).every(A => subset([], A)),
  '\\forall A \\in \\mathcal{P}(\\{1, 2\\}),\\ \\varnothing \\in A': () => subsetsOf([1, 2]).every(A => has(A, [])),
}

// counterexample statements: domain test + "breaks the claim" test
const COUNTER = {
  '\\forall x \\in \\mathbb{R},\\ x^4 \\ge x': [() => true, x => x ** 4 < x],
  '\\forall x \\in \\mathbb{R},\\ x^2 \\ge x': [() => true, x => x * x < x],
  '\\forall x \\in \\mathbb{R},\\ |x| = x': [() => true, x => Math.abs(x) !== x],
  '\\forall x \\in \\mathbb{R},\\ x^2 > 0': [() => true, x => !(x * x > 0)],
  '\\forall x \\in \\mathbb{R},\\ \\text{if } x^2 = 4 \\text{ then } x = 2': [() => true, x => x * x === 4 && x !== 2],
  '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is prime, then } n \\text{ is odd}': [n => Number.isInteger(n) && n >= 1, n => isPrime(n) && n % 2 === 0],
  '\\forall n \\in \\mathbb{N},\\ n^2 + n + 41 \\text{ is prime}': [n => Number.isInteger(n) && n >= 1, n => !isPrime(n * n + n + 41)],
  '\\forall n \\in \\mathbb{N},\\ 2^n + 1 \\text{ is prime}': [n => Number.isInteger(n) && n >= 1, n => !isPrime(2 ** n + 1)],
  '\\forall x \\in \\mathbb{R},\\ -x^2 + 5x - 2 < 4': [() => true, x => -x * x + 5 * x - 2 >= 4],
  '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is even, then } n \\text{ is a multiple of } 4': [n => Number.isInteger(n) && n >= 1, n => n % 2 === 0 && n % 4 !== 0],
  '\\forall x \\in \\mathbb{Z},\\ x^3 \\ge x': [x => Number.isInteger(x), x => x ** 3 < x],
  '\\forall x \\in \\mathbb{R},\\ 2x > x': [() => true, x => x + x <= x],
  '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = x': [() => true, x => Math.sqrt(x * x) !== x],
  '\\forall n \\in \\mathbb{Z},\\ n^2 > n': [n => Number.isInteger(n), n => n * n <= n],
  '\\forall x \\in \\mathbb{R},\\ x^3 \\ge x^2': [() => true, x => x * x * x < x * x],
  '\\forall x \\in \\mathbb{R},\\ \\text{if } x > 0 \\text{ then } x^2 \\ge x': [() => true, x => x > 0 && x * x < x],
  '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is odd, then } n \\text{ is prime}': [n => Number.isInteger(n) && n >= 1, n => n % 2 !== 0 && !isPrime(n)],
  '\\forall n \\in \\mathbb{N},\\ n^2 - n + 11 \\text{ is prime}': [n => Number.isInteger(n) && n >= 1, n => !isPrime(n * n - n + 11)],
  '\\forall x \\in \\mathbb{R},\\ x + 1 > x^2': [() => true, x => x + 1 <= x * x],
  '\\forall n \\in \\mathbb{N},\\ 3n + 1 \\text{ is even}': [n => Number.isInteger(n) && n >= 1, n => (3 * n + 1) % 2 === 1],
  '\\forall n \\in \\mathbb{Z},\\ \\text{if } n^2 \\text{ is a multiple of } 4 \\text{, then } n \\text{ is a multiple of } 4': [n => Number.isInteger(n), n => (n * n) % 4 === 0 && n % 4 !== 0],
}

// partition-of-Z block predicates
function zBlock(latex) {
  const s = latex.trim()
  let m
  if (s === '\\text{even integers}') return x => x % 2 === 0
  if (s === '\\text{odd integers}') return x => x % 2 !== 0
  if (s === '\\text{positive integers}' || s === '\\mathbb{Z}^+') return x => x > 0
  if (s === '\\text{negative integers}' || s === '\\mathbb{Z}^-') return x => x < 0
  if (s === '\\{0\\}') return x => x === 0
  if (s === '\\mathbb{N}') return x => x >= 1
  if (s === '\\mathbb{Z}') return () => true
  if (s === '\\varnothing') return () => false
  if (s === '\\text{primes}') return x => isPrime(x)
  if (s === '\\text{integers that are not prime}') return x => !isPrime(x)
  if ((m = s.match(/^\\text\{multiples of \} (\d+)$/))) return x => x % +m[1] === 0
  if ((m = s.match(/^\\text\{integers not divisible by \} (\d+)$/))) return x => x % +m[1] !== 0
  if ((m = s.match(/^\\\{x \\in \\mathbb\{Z\} \\mid (.+)\\\}$/))) {
    const c = m[1]
    let k
    if ((k = c.match(/^x (<|\\le|>|\\ge) (-?\d+)$/))) {
      const v = +k[2]
      return { '<': x => x < v, '\\le': x => x <= v, '>': x => x > v, '\\ge': x => x >= v }[k[1]]
    }
    if (c === 'x \\text{ is even}') return x => x % 2 === 0
    if (c === 'x \\text{ is odd}') return x => x % 2 !== 0
    if ((k = c.match(/^x \\text\{ is a multiple of \} (\d+)$/))) return x => x % +k[1] === 0
  }
  throw new Error(`unknown Z block ${latex}`)
}
function isPartitionOfZ(optionLatex) {
  const body = optionLatex.trim().replace(/^\\\{/, '').replace(/\\\}$/, '')
  const parts = splitTop(body)
  const other = parts.findIndex(s => s.trim() === '\\text{all other integers}')
  const preds = parts.filter((_, i) => i !== other).map(zBlock)
  if (other >= 0) {
    const named = [...preds]
    preds.push(x => !named.some(f => f(x)))
  }
  const sample = grid(-40, 40, 1)
  if (!preds.every(f => sample.some(f))) return false // empty block
  return sample.every(x => preds.filter(f => f(x)).length === 1)
}

// ---------- the checkers ----------
export const derive = {
  'describe/membership'(p) {
    if (p.text) {
      const { A } = namedSets(p.text)
      const probe = p.latex.match(/^\\text\{Is \} (.+) \\in A\?$/)[1]
      return has(A, parseStruct(norm(probe))) ? 'yes' : 'no'
    }
    const m = p.latex.match(/^\\text\{Is \} (.+?) \\in \\\{x \\in \\mathbb\{([ZNQR])\} \\mid (.+)\\\}\?$/)
    const num = parseNum(m[1])
    const D = m[2]
    const cond = parseCond(m[3])
    const inD = D === 'Z' ? num.int : D === 'N' ? num.int && num.v >= 1 : D === 'Q' ? num.rat : true
    return inD && cond(num.v) ? 'yes' : 'no'
  },
  'describe/roster'(p) {
    if (/\\mathbb\{R\} \\mid \|x\| = -\d+/.test(p.latex)) return '∅'
    const m = p.latex.match(/^\\\{x \\in \\mathbb\{([ZN])\} \\mid (.+)\\\} = \\,\?$/)
    const cond = parseCond(m[2])
    const out = []
    for (let x = m[1] === 'N' ? 1 : -40; x <= 40; x++) if (cond(x)) out.push(x)
    return setStr(out)
  },
  'describe/cardinality'(p) {
    const m = p.latex.match(/^\\left\|\\\{(.+)\\\}\\right\| = \\,\?$/)
    const inner = m[1]
    const b = inner.match(/^x \\in \\mathbb\{Z\} \\mid (-?\d+) (<|\\le) x (<|\\le) (-?\d+)$/)
    if (b) {
      let c = 0
      for (let x = -50; x <= 50; x++) if ((b[2] === '<' ? +b[1] < x : +b[1] <= x) && (b[3] === '<' ? x < +b[4] : x <= +b[4])) c++
      return c
    }
    return parseStruct(norm(`{${inner}}`)).length
  },
  'subsets/subset-tf'(p) {
    let m
    if ((m = p.latex.match(/^\\mathbb\{([NZQRIC])\} (\\subseteq|\\subset) \\mathbb\{([NZQRIC])\}$/))) {
      const idx = { N: 0, Z: 1, Q: 2, R: 3, C: 4 }
      const [, X, rel, Y] = m
      const sub = X === Y ? true : X === 'I' ? Y === 'R' || Y === 'C' : Y === 'I' ? false : idx[X] < idx[Y]
      return (rel === '\\subseteq' ? sub : sub && X !== Y) ? 'true' : 'false'
    }
    const sets = namedSets(p.text)
    m = p.latex.match(/^(.+?) (\\subseteq|\\subset|\\in|=) ([AB])$/)
    if (!m) throw new Error(`unrecognized statement ${p.latex}`)
    const lhs = /^[AB]$/.test(m[1]) ? sets[m[1]] : parseStruct(norm(m[1]))
    const rhs = sets[m[3]]
    let v
    if (m[2] === '\\in') v = has(rhs, lhs)
    else if (!isSet(lhs)) v = false
    else if (m[2] === '\\subseteq') v = subset(lhs, rhs)
    else if (m[2] === '\\subset') v = subset(lhs, rhs) && !subset(rhs, lhs)
    else v = subset(lhs, rhs) && subset(rhs, lhs)
    return v ? 'true' : 'false'
  },
  'subsets/power-set-size'(p) {
    let m
    if (p.latex === '|\\mathcal{P}(\\varnothing)| = \\,?') return subsetsOf([]).length
    if (p.latex === '|\\mathcal{P}(\\{\\varnothing\\})| = \\,?') return subsetsOf([[]]).length
    if ((m = p.latex.match(/^\|\\mathcal\{P\}\((\\\{.*\\\})\)\| = \\,\?$/))) return subsetsOf(parseStruct(norm(m[1]))).length
    if ((m = p.text?.match(/has (\d+) elements/))) return subsetsOf(Array.from({ length: +m[1] }, (_, i) => i)).length
    const { A } = namedSets(p.text)
    if (p.latex.startsWith('|\\mathcal{P}(\\mathcal{P}(A))|')) return subsetsOf(subsetsOf(A)).length
    if (p.latex.startsWith('\\#\\{X \\mid X \\subset A\\}')) return subsetsOf(A).filter(X => !subset(A, X)).length
    if (p.latex.startsWith('\\#\\{X \\subseteq A \\mid X \\ne \\varnothing\\}')) return subsetsOf(A).filter(X => X.length).length
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'subsets/power-set-member'(p) {
    const { A } = namedSets(p.text)
    const PA = subsetsOf(A)
    const m = p.latex.match(/^(.+?) (\\in|\\subseteq) \\mathcal\{P\}\(A\)$/)
    const lhs = m[1] === 'A' ? A : parseStruct(norm(m[1]))
    if (m[2] === '\\in') return has(PA, lhs) ? 'true' : 'false'
    if (!isSet(lhs)) return 'false'
    return lhs.every(x => has(PA, x)) ? 'true' : 'false'
  },
  'subsets/list-power-set'(p) {
    const m = p.latex.match(/^\\mathcal\{P\}\((.+)\) = \\,\?$/)
    const PA = subsetsOf(parseStruct(norm(m[1])))
    return letterOf(p, o => {
      const v = parseStruct(norm(o))
      return isSet(v) && deepEq(v, PA)
    })
  },
  'set-ops/compute'(p) {
    const sets = namedSets(p.text)
    return setStr(evalSetExpr(p.latex.replace(/ = \\,\?$/, ''), sets))
  },
  'set-ops/count'(p) {
    const sets = namedSets(p.text)
    const m = p.latex.match(/^\|(.+)\| = \\,\?$/)
    return evalSetExpr(m[1], sets).length
  },
  'set-ops/disjoint'(p) {
    const sets = namedSets(p.text)
    const m = p.latex.match(/^\\text\{Are \} (.+?) \\text\{ and \} (.+?) \\text\{ disjoint\?\}$/)
    const X = evalSetExpr(m[1], sets)
    const Y = evalSetExpr(m[2], sets)
    return X.some(x => has(Y, x)) ? 'no' : 'yes'
  },
  'indexed/interval-family'(p) {
    const m = p.latex.match(/^A_i = (.+), \\qquad \\(bigcup|bigcap)_\{i \\in \\mathbb\{N\}\} A_i = \\,\?$/)
    return intervalFamily(m[1], m[2] === 'bigcup')
  },
  'indexed/finite-family'(p) {
    const letters = /letter/.test(p.text)
    let k
    if (letters) k = /next two letters/.test(p.text) ? 2 : 1
    else k = p.text.match(/A_i = \{i, i \+ 1(, i \+ 2)?\}/)[1] ? 2 : 1
    const I = namedSets(p.text).I
    const wantUnion = /\\bigcup/.test(p.latex)
    const code = x => (letters ? x.charCodeAt(0) : x)
    const show = c => (letters ? String.fromCharCode(c) : c)
    const sets = I.map(i => Array.from({ length: k + 1 }, (_, j) => code(i) + j))
    const res = wantUnion ? dedupe(sets.flat()) : sets.reduce((acc, s) => acc.filter(x => s.includes(x)))
    return setStr(res.map(show))
  },
  'indexed/multiples'(p) {
    const ms = [...p.text.matchAll(/multiple of (\d+)/g)].map(m => +m[1])
    for (let x = 1; x < 1e6; x++) if (ms.every(m => x % m === 0)) return x
    throw new Error('no common multiple found')
  },
  'partitions/is-partition'(p) {
    const { A } = namedSets(p.text)
    const blocks = parseStruct(norm(p.latex))
    if (!blocks.every(isSet)) throw new Error('blocks are not sets')
    const nonempty = blocks.every(b => b.length > 0)
    const union = dedupe(blocks.flat())
    const covers = deepEq(union, A)
    let disjoint = true
    for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (blocks[i].some(x => has(blocks[j], x))) disjoint = false
    // a repeated block would have been merged by parseStruct; count the raw blocks
    const rawCount = splitTop(norm(p.latex).slice(1, -1)).length
    return nonempty && covers && disjoint && rawCount === blocks.length ? 'yes' : 'no'
  },
  'partitions/count-partitions'(p) {
    const n = namedSets(p.text).A.length
    const exact = p.ask.match(/exactly (\d+) block/)
    // restricted growth strings; `maxBlock + 1` blocks are in use at the end
    let count = 0
    const go = (i, maxBlock) => {
      if (i === n) {
        if (!exact || maxBlock + 1 === +exact[1]) count++
        return
      }
      for (let b = 0; b <= maxBlock + 1; b++) go(i + 1, Math.max(maxBlock, b))
    }
    if (n === 0) return 1
    go(1, 0)
    return count
  },
  'partitions/partition-of-Z'(p) {
    const wantYes = !/NOT/.test(p.ask)
    return letterOf(p, o => isPartitionOfZ(o) === wantYes)
  },
  'cartesian/product-size'(p) {
    const sets = namedSets(p.text)
    const m = p.latex.match(/^\|(.+)\| = \\,\?$/)
    const factors = m[1].split('\\times').map(f => {
      const s = f.trim()
      if (s === '\\varnothing') return []
      let k
      if ((k = s.match(/^\\mathcal\{P\}\(([ABC])\)$/))) return subsetsOf(sets[k[1]])
      if (/^[ABC]$/.test(s)) return sets[s]
      throw new Error(`bad factor ${s}`)
    })
    let tuples = [[]]
    for (const F of factors) tuples = tuples.flatMap(t => F.map(x => [...t, x]))
    return tuples.length
  },
  'cartesian/pair-member'(p) {
    let m
    if ((m = p.latex.match(/^\((.+)\) \\in \\mathbb\{Z\}\^- \\times \\mathbb\{Q\}\^\+ \\times \\mathbb\{C\}\^\*$/))) {
      const [a, b, c] = splitTop(m[1]).map(parseNum)
      const ok = a.int && a.v < 0 && b.rat && b.real && b.v > 0 && !c.zero
      return ok ? 'true' : 'false'
    }
    const sets = namedSets(p.text)
    m = p.latex.match(/^\((.+)\) \\in ([AB]) \\times ([AB])$/)
    const pair = splitTop(m[1]).map(parseStruct)
    const X = sets[m[2]]
    const Y = sets[m[3]]
    const tuples = X.flatMap(x => Y.map(y => [x, y]))
    return tuples.some(t => deepEq(t[0], pair[0]) && deepEq(t[1], pair[1])) ? 'true' : 'false'
  },
  'cartesian/list-product'(p) {
    const sets = namedSets(p.text)
    const m = p.latex.match(/^([AB]) \\times ([AB]) = \\,\?$/)
    const pairs = sets[m[1]].flatMap(x => sets[m[2]].map(y => `(${x}, ${y})`))
    return `{${pairs.join(', ')}}`
  },
  'cartesian/solve-size'(p) {
    let m
    if ((m = p.text.match(/\|A \\?× A\| = (\d+)/) || p.text.match(/\|A × A\| = (\d+)/))) {
      for (let n = 0; n <= 100; n++) if (n * n === +m[1]) return n
      throw new Error('not a square')
    }
    if ((m = p.text.match(/\|A\| = (\d+), \|B\| = (\d+), and \|A × B × C\| = (\d+)/))) {
      for (let c = 0; c <= 100; c++) if (+m[1] * +m[2] * c === +m[3]) return c
      throw new Error('no solution')
    }
    m = p.text.match(/\|A\| = (\d+) and \|A × B\| = (\d+)/)
    for (let b = 0; b <= 100; b++) if (+m[1] * b === +m[2]) return b
    throw new Error('no solution')
  },
  'statements/is-statement'(p) {
    const s = quoted(p.text)
    if (STATEMENT_YES.has(s)) return 'yes'
    if (STATEMENT_NO.has(s)) return 'no'
    for (const [re, verdict] of NUMBER_SENTENCE) if (re.test(s)) return verdict
    throw new Error(`unknown sentence ${s}`)
  },
  'statements/open-sentence-value'(p) {
    const m = p.latex.match(/^P\(n\): (.+)\. \\qquad P\((\d+)\) = \\,\?$/)
    return openPred(m[1])(+m[2]) ? 'true' : 'false'
  },
  'statements/find-true-values'(p) {
    const P = openPred(p.latex.replace(/^P\(n\): /, ''))
    let m
    if ((m = p.ask.match(/n in \{1, 2, \.\.\., (\d+)\}/))) {
      let c = 0
      for (let n = 1; n <= +m[1]; n++) if (P(n)) c++
      return c
    }
    m = p.ask.match(/smallest n ≥ (\d+)/)
    for (let n = +m[1]; n < 1000; n++) if (P(n)) return n
    throw new Error('no true value')
  },
  'negation/negate-english': p => bankLetter(p, NEGATIONS, quoted(p.text)),
  'negation/negate-inequality'(p) {
    const m = p.latex.match(/^\\sim\(x (<|\\le|>|\\ge|=|\\ne) (-?\d+)\)/)
    const NEG = { '<': '≥', '\\le': '>', '>': '≤', '\\ge': '<', '=': '≠', '\\ne': '=' }
    return `x ${NEG[m[1]]} ${m[2]}`
  },
  'negation/negate-quantity'(p) {
    const s = quoted(p.text)
    const m = s.match(/^(.+?) (at least|more than|at most|fewer than) (\d+) (.+)$/)
    const OPP = { 'at least': 'fewer than', 'more than': 'at most', 'at most': 'more than', 'fewer than': 'at least' }
    return letterOf(p, o => o === `${m[1]} ${OPP[m[2]]} ${m[3]} ${m[4]}`)
  },
  'connectives/truth-table': truthTable,
  'connectives/evaluate': evalAt,
  'connectives/to-symbols'(p) {
    const m = p.text.match(/^P: "(.+?) (is .+?)\."  Q: "\1 (is .+?)\."  Sentence: "(.+)"$/)
    if (!m) throw new Error(`cannot read ${p.text}`)
    const [, , P, Q, sentence] = m
    const negP = !sentence.includes(P)
    const negQ = !sentence.includes(Q)
    const or = /\bor\b/.test(sentence) || /^Either/.test(sentence)
    const and = /\band\b|\bbut\b|neither/.test(sentence)
    if (or === and) throw new Error(`ambiguous connective in "${sentence}"`)
    const lit = (n, neg) => (neg ? `~${n}` : n)
    const want = compileLogic(`${lit('P', negP)} ${or ? '∨' : '∧'} ${lit('Q', negQ)}`)
    return letterOf(p, o => equiv(compileLogic(o), want))
  },
  'connectives/to-english'(p) {
    const m = p.text.match(/^P: "(.+?) (is .+?)\."  Q: "\1 (is .+?)\."$/)
    if (!m) throw new Error(`cannot read ${p.text}`)
    const [, subj, Pdef, Qdef] = m
    const want = compileLogic(p.latex)
    return letterOf(p, o => {
      const s = o.match(/^(.+?) (is .+?) (and|or) (is .+?)\.$/)
      if (!s || s[1] !== subj) return false
      const lit = (n, sentencePred, def) => (sentencePred === def ? n : `~${n}`)
      const f = compileLogic(`${lit('P', s[2], Pdef)} ${s[3] === 'and' ? '∧' : '∨'} ${lit('Q', s[4], Qdef)}`)
      return equiv(f, want)
    })
  },
  'implications/evaluate-imp'(p) {
    if (/Promise:/.test(p.text)) {
      const m = p.text.match(/What happens: you give me (.+?) and I give you (.+?)\.$/)
      const P = m[1] === 'a Ford Mustang'
      const Q = m[2] === 'my house'
      return !P || Q ? 'true' : 'false'
    }
    return evalAt(p)
  },
  'implications/truth-table': truthTable,
  'implications/rewrite'(p) {
    const s = quoted(p.text)
    const forms = [
      [/^(.+) only if (.+)\.$/, (a, b) => [a, b]],
      [/^(.+), provided that (.+)\.$/, (a, b) => [b, a]],
      [/^(.+) whenever (.+)\.$/, (a, b) => [b, a]],
      [/^That (.+) implies that (.+)\.$/, (a, b) => [a, b]],
      [/^In order that (.+), it is sufficient that (.+)\.$/, (a, b) => [b, a]],
      [/^In order that (.+), it is necessary that (.+)\.$/, (a, b) => [a, b]],
      [/^(.+) if (.+)\.$/, (a, b) => [b, a]],
    ]
    for (const [re, f] of forms) {
      const m = s.match(re)
      if (m) {
        const [X, Y] = f(m[1], m[2])
        const want = `if ${X}, then ${Y}.`.toLowerCase()
        return letterOf(p, o => o.toLowerCase() === want)
      }
    }
    throw new Error(`unknown phrasing "${s}"`)
  },
  'implications/open-imp'(p) {
    const m = p.text.match(/^Over the integers, P\(([^)]+)\): (.+) and Q\(\1\): (.+)\.$/)
    const P = PQ[m[2]]
    const Q = PQ[m[3]]
    if (!P || !Q) throw new Error(`unknown predicates ${m[2]} / ${m[3]}`)
    const at = p.latex.match(/\\text\{at \} (.+)$/)[1]
    const nums = [...at.matchAll(/-?\d+/g)].map(x => +x[0])
    const pt = /^\(/.test(at) ? nums : nums.slice(-1)
    return !P(...pt) || Q(...pt) ? 'true' : 'false'
  },
  'implications/if-then-form': p => bankLetter(p, IF_THEN, quoted(p.text)),
  'biconditionals/evaluate-iff': evalAt,
  'biconditionals/truth-table': truthTable,
  'biconditionals/converse'(p) {
    if (p.text) {
      const m = quoted(p.text).match(/^If (.+), then (.+)\.$/)
      return letterOf(p, o => o === `If ${m[2]}, then ${m[1]}.`)
    }
    const f = compileLogic(p.latex)
    if (f.k !== '⇒') throw new Error('not an implication')
    const conv = { k: '⇒', a: f.b, b: f.a }
    return letterOf(p, o => sameTree(compileLogic(o), conv))
  },
  'biconditionals/iff-domain'(p) {
    const m = p.latex.match(/P\(n\): (.+?), \\; Q\(n\): (.+)$/)
    const P = IFF_PRED[m[1]]
    const Q = IFF_PRED[m[2]]
    if (!P || !Q) throw new Error(`unknown predicates ${m[1]} / ${m[2]}`)
    let k
    if ((k = p.ask.match(/for n = (\d+)\?/))) return P(+k[1]) === Q(+k[1]) ? 'true' : 'false'
    const S = namedSets(p.ask).S
    return setStr(S.filter(n => P(n) === Q(n)))
  },
  'tautologies/classify'(p) {
    const col = colOf(compileLogic(p.latex))
    return /^T+$/.test(col) ? 'tautology' : /^F+$/.test(col) ? 'contradiction' : 'neither'
  },
  'tautologies/simplify'(p) {
    const f = compileLogic(p.latex.replace(/\\;\\equiv\\; \?$/, ''))
    const at = P => ev(f, { P, T: true, C: false })
    const [t, ff] = [at(true), at(false)]
    if (t && ff) return 'T'
    if (!t && !ff) return 'C'
    return t ? 'P' : '~P'
  },
  'equivalence/equivalent-check'(p) {
    const [l, r] = p.latex.split('\\;\\overset{?}{\\equiv}\\;')
    return equiv(compileLogic(l), compileLogic(r)) ? 'yes' : 'no'
  },
  'equivalence/name-law'(p) {
    const [l, r] = p.latex.split(' \\equiv ').map(compileLogic)
    if (!equiv(l, r)) throw new Error('sides are not equivalent')
    const dual = { '∧': '∨', '∨': '∧' }
    const test = (L, R) => {
      if (L.k === '~' && L.a.k === '~' && sameTree(L.a.a, R)) return 'double negative'
      if (L.k === '~' && dual[L.a.k] && R.k === dual[L.a.k] && R.a.k === '~' && R.b.k === '~' && sameTree(L.a.a, R.a.a) && sameTree(L.a.b, R.b.a)) return 'De Morgan'
      if (dual[L.k] && L.k === R.k && sameTree(L.a, R.b) && sameTree(L.b, R.a)) return 'commutative'
      if (dual[L.k] && L.k === R.k && L.b.k === L.k && R.a.k === L.k && sameTree(L.a, R.a.a) && sameTree(L.b.a, R.a.b) && sameTree(L.b.b, R.b)) return 'associative'
      if (dual[L.k] && L.b.k === dual[L.k] && R.k === dual[L.k] && R.a.k === L.k && R.b.k === L.k && sameTree(L.a, R.a.a) && sameTree(L.a, R.b.a) && sameTree(L.b.a, R.a.b) && sameTree(L.b.b, R.b.b)) return 'distributive'
      return null
    }
    const name = test(l, r) ?? test(r, l)
    if (!name) throw new Error('no law matches')
    return name
  },
  'equivalence/negate-symbolic'(p) {
    const inner = p.latex.match(/^\\sim\((.+)\) \\;\\equiv\\; \?$/)[1]
    const target = { k: '~', a: compileLogic(inner) }
    const ans = compileLogic(p.answer)
    if (!equiv(ans, target)) throw new Error('answer is not the negation')
    if (!atomicNeg(ans)) throw new Error('answer has a negated compound')
    for (const c of p.choices) if (equiv(compileLogic(c), target)) throw new Error(`choice "${c}" is also correct`)
    return p.answer
  },
  'equivalence/negate-english': p => bankLetter(p, NEGATIONS, quoted(p.text)),
  'quantifiers/finite-domain'(p) {
    const m = p.latex.match(/^\\(forall|exists) x \\in (\\\{.+?\\\})(?:,\\ | \\text\{ such that \})\s*(.+)$/)
    const D = parseStruct(norm(m[2]))
    const Q = X_PRED[m[3]]
    if (!Q) throw new Error(`unknown predicate ${m[3]}`)
    const v = m[1] === 'forall' ? D.every(Q) : D.some(Q)
    return v ? 'true' : 'false'
  },
  'quantifiers/infinite-domain'(p) {
    const f = INFINITE[p.latex]
    if (!f) throw new Error(`unknown statement ${p.latex}`)
    return f() ? 'true' : 'false'
  },
  'quantifiers/counterexample'(p) {
    const entry = COUNTER[p.latex]
    if (!entry) throw new Error(`unknown statement ${p.latex}`)
    const [dom, breaks] = entry
    if (!dom(p.answer) || !breaks(p.answer)) throw new Error(`${p.answer} is not a counterexample`)
    for (const d of p.distractors) if (dom(d) && breaks(d)) throw new Error(`distractor ${d} is a counterexample`)
    return p.answer
  },
  'quantifiers/negate-quantified'(p) {
    if (p.text) return bankLetter(p, NEGATIONS, quoted(p.text))
    return bankLetter(p, NEG_SYMBOLIC, p.latex)
  },
}

export const SAMPLES = { 'indexed/interval-family': 400, 'partitions/count-partitions': 300 }
