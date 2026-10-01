import { choice, randInt } from '../../../engine/rand.js'
import { dec, num, probs, tolFor } from './util.js'

// §4.1: a continuous X has a density f with f ≥ 0 and total area 1, and a
// probability is an area under f. The shapes are the ones the notes and the
// homework use: the lead-concentration line 12.5x − 1.25 on [0.1, 0.5],
// c·xⁿ on [0, b], c(b − x), (1/β)e^(−x/β), and flat densities.
//
// The density builders below are shared with the cdf and expectation topics.

// ---------- shared: numbers and LaTeX ----------

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1))

// p/q in lowest terms: \frac{3}{8}, or 4 when q divides p. `cmd` is frac,
// dfrac or tfrac (worked answers use tfrac so only the final value reads as a number).
export function fracTex(p, q, cmd = 'frac') {
  const g = gcd(p, q)
  let a = p / g
  let b = q / g
  if (b < 0) {
    a = -a
    b = -b
  }
  if (b === 1) return String(a)
  return `${a < 0 ? '-' : ''}\\${cmd}{${Math.abs(a)}}{${b}}`
}

// A coefficient written in front of a variable: 1 → '', 3/8 → \frac{3}{8}.
export const coefTex = (p, q, cmd) => (p === q ? '' : fracTex(p, q, cmd))

// xⁿ as LaTeX (just x when n = 1).
export const xPow = (n, v = 'x') => (n === 1 ? v : `${v}^{${n}}`)

// Worked answers: every \frac becomes \tfrac, so the only plain number that
// reads as "the answer" is the final one.
export const work = s => s.replaceAll('\\frac', '\\tfrac')

// Wrap a sum or difference in parentheses (only + or − outside any group counts).
export function paren(tex) {
  let depth = 0
  let top = ''
  for (const ch of tex) {
    if (ch === '{' || ch === '(') depth++
    else if (ch === '}' || ch === ')') depth--
    else if (depth === 0) top += ch
  }
  return / [+-] /.test(top) ? `\\left(${tex}\\right)` : tex
}

// A polynomial c[0] + c[1]x + c[2]x² + ... in decimals. Highest power first,
// unless that term is negative: then 6.25 - 12.5x rather than -12.5x + 6.25.
function polyString(c, pow) {
  const terms = []
  c.forEach((ci, i) => {
    if (Math.abs(ci) < 1e-12) return
    const mag = Math.abs(ci)
    const coef = i > 0 && Math.abs(mag - 1) < 1e-12 ? '' : dec(mag)
    terms.push({ neg: ci < 0, body: `${coef}${i === 0 ? '' : pow(i)}` })
  })
  let order = terms.slice().reverse()
  if (order.length > 1 && order[0].neg && !terms[0].neg) order = terms
  if (!order.length) return '0'
  return order.map((t, k) => (k === 0 ? `${t.neg ? '-' : ''}${t.body}` : `${t.neg ? ' - ' : ' + '}${t.body}`)).join('')
}
export const polyTex = (c, v = 'x') => polyString(c, i => xPow(i, v))
export const polyExpr = c => polyString(c, i => (i === 1 ? 'x' : `x^${i}`)).replaceAll(' ', '')

export const polyAt = (c, x) => c.reduce((s, ci, i) => s + ci * x ** i, 0)
// ∫ from a to b of x^k·p(x), term by term with the power rule
export const polyInt = (c, a, b, k = 0) => c.reduce((s, ci, i) => s + (ci * (b ** (i + k + 1) - a ** (i + k + 1))) / (i + k + 1), 0)
// coefficients of the antiderivative with no constant
const antiCoefs = c => [0, ...c.map((ci, i) => ci / (i + 1))]
const clean = x => Number(dec(x))

// ---------- shared: densities ----------
//
// A density: `tex` is f on its support [lo, hi] (hi = Infinity for x > lo),
// with f, F (the cdf), moment(k) = E[X^k], `antiTex` an antiderivative for
// [G] from a to b, and Ftex / Fexpr the cdf on the support (LaTeX / typed form).

function polyDensity(kind, lo, hi, c, extra = {}) {
  const Fcoef = antiCoefs(c)
  Fcoef[0] = -polyAt(Fcoef, lo)
  return {
    kind,
    lo,
    hi,
    c,
    tex: polyTex(c),
    f: x => (x < lo || x > hi ? 0 : polyAt(c, x)),
    F: x => (x <= lo ? 0 : x >= hi ? 1 : polyInt(c, lo, x)),
    moment: k => polyInt(c, lo, hi, k),
    antiTex: polyTex(antiCoefs(c)),
    G: x => polyAt(antiCoefs(c), x),
    Ftex: polyTex(Fcoef),
    Fexpr: polyExpr(Fcoef),
    ...extra,
  }
}

// f(x) = m(x − a) on [a, b]: zero at the left end, like the lead example.
// m = 2/(b − a)² makes the triangle's area 1.
const LEAD = [
  [0.1, 0.5, 12.5],
  [0.2, 0.6, 12.5],
  [0.1, 0.6, 8],
  [0.2, 0.7, 8],
  [0.5, 1, 8],
  [1, 2, 2],
  [2, 3, 2],
  [1, 3, 0.5],
  [2, 4, 0.5],
  [0.1, 0.3, 50],
]
// f(x) = mx + k on [lo, hi], positive at both ends, area 1
const TRAP = [
  [0, 2, 0.25, 0.25],
  [0, 2, 0.125, 0.375],
  [0, 2, 0.375, 0.125],
  [0, 2, -0.25, 0.75],
  [0, 1, 1, 0.5],
  [0, 1, 0.5, 0.75],
  [0, 1, 1.5, 0.25],
  [0, 1, -1, 1.5],
  [0, 1, -0.5, 1.25],
  [1, 3, 0.1, 0.3],
  [1, 3, 0.2, 0.1],
  [0, 4, 0.0625, 0.125],
]
// c·xⁿ on [0, b] with c = (n + 1)/b^(n+1)
export const POWER = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 1],
  [3, 2],
]
const BETAS = [1, 2, 3, 4, 5, 10, 0.5, 0.25]
// nice points inside (0, ∞) for each β
const EXP_GRID = {
  1: [0.5, 1, 1.5, 2, 3],
  2: [0.5, 1, 2, 3, 4],
  3: [1, 2, 3, 4.5, 6],
  4: [1, 2, 3, 4, 6],
  5: [1, 2, 5, 7, 10],
  10: [2, 5, 10, 15, 20],
  0.5: [0.25, 0.5, 1, 1.5, 2],
  0.25: [0.1, 0.2, 0.5, 1],
}

// The exponent of e in (1/β)e^(−x/β): -x, -x/3 or -2x.
export const expExponent = beta => (beta === 1 ? '-x' : beta < 1 ? `-${dec(1 / beta)}x` : `-x/${beta}`)
// (1/β)e^(−x/β) as LaTeX: e^{-x}, \frac{1}{3}e^{-x/3}, 2e^{-2x}
export const expTex = beta => {
  const ex = expExponent(beta)
  return beta === 1 ? 'e^{-x}' : beta < 1 ? `${dec(1 / beta)}e^{${ex}}` : `\\frac{1}{${beta}}e^{${ex}}`
}

export function expDensity(beta) {
  const ex = expExponent(beta)
  return {
    kind: 'exp',
    lo: 0,
    hi: Infinity,
    beta,
    tex: expTex(beta),
    f: x => (x < 0 ? 0 : Math.exp(-x / beta) / beta),
    F: x => (x <= 0 ? 0 : 1 - Math.exp(-x / beta)),
    moment: k => factorial(k) * beta ** k,
    antiTex: `-e^{${ex}}`,
    G: x => -Math.exp(-x / beta),
    Ftex: `1 - e^{${ex}}`,
    Fexpr: `1-e^(${ex})`,
  }
}

export const FAMILIES = {
  lead() {
    const [a, b, m] = choice(LEAD)
    return polyDensity('lead', a, b, [-clean(m * a), m], { Fexpr: `${dec(m / 2)}(x-${a})^2`, m, a, b })
  },
  falling() {
    const [a, b, m] = choice(LEAD)
    return polyDensity('falling', a, b, [clean(m * b), -m], { Fexpr: `1-${dec(m / 2)}(${b}-x)^2`, m, a, b })
  },
  trap() {
    const [lo, hi, m, k] = choice(TRAP)
    return polyDensity('trap', lo, hi, [k, m], { m, k })
  },
  power() {
    const [n, b] = choice(POWER)
    const B = b ** (n + 1)
    const c = [...Array(n).fill(0), (n + 1) / B]
    const Ftex = b === 1 ? xPow(n + 1) : `\\frac{${xPow(n + 1)}}{${B}}`
    return polyDensity('power', 0, b, c, {
      tex: `${coefTex(n + 1, B)}${xPow(n)}`,
      antiTex: Ftex,
      Ftex,
      Fexpr: b === 1 ? `x^${n + 1}` : `x^${n + 1}/${B}`,
      n,
      b,
      B,
    })
  },
  decr() {
    const b = choice([1, 2, 3, 4])
    const Ftex = b === 1 ? '2x - x^{2}' : `\\frac{${2 * b}x - x^{2}}{${b * b}}`
    return polyDensity('decr', 0, b, [2 / b, -2 / (b * b)], {
      tex: `${coefTex(2, b * b)}(${b} - x)`,
      antiTex: Ftex,
      Ftex,
      Fexpr: b === 1 ? '2x-x^2' : `(${2 * b}x-x^2)/${b * b}`,
      b,
    })
  },
  exp() {
    return expDensity(choice(BETAS))
  },
  flat() {
    const a = randInt(0, 4)
    const b = a + choice([2, 4, 5, 8, 10])
    return polyDensity('flat', a, b, [1 / (b - a)], { tex: fracTex(1, b - a), antiTex: `\\frac{x}{${b - a}}` })
  },
}

export const someDensity = kinds => FAMILIES[choice(kinds)]()

// "0.1 \le x \le 0.5", "x > 0" or "x \ge 1"
export const condTex = (lo, hi) => (hi === Infinity ? (lo === 0 ? 'x > 0' : `x \\ge ${lo}`) : `${lo} \\le x \\le ${hi}`)
export const pdfCases = (tex, lo, hi) => `f(x) = \\begin{cases} ${tex} & ${condTex(lo, hi)} \\\\ 0 & \\text{otherwise} \\end{cases}`
export const limTex = x => (x === Infinity ? '\\infty' : String(x))
// The density on top, the question under it (narrow screens never scroll sideways).
export const stack = (...rows) => `\\begin{gathered} ${rows.join(' \\\\ ')} \\end{gathered}`

// The spacing of nice points on a finite support.
export const gridStep = d => {
  const w = d.hi - d.lo
  return w <= 0.2 ? 0.05 : w <= 0.5 ? 0.1 : w <= 1 ? 0.25 : w <= 2 ? 0.5 : 1
}

// Nice points strictly inside the support, ascending.
export function gridPoints(d) {
  if (d.hi === Infinity) return EXP_GRID[d.beta]
  const step = gridStep(d)
  const out = []
  for (let k = 1; d.lo + k * step < d.hi - 1e-9; k++) out.push(clean(d.lo + k * step))
  return out
}

// An event about X: how it reads, and the limits once clipped to the support.
// `raw` holds the limits as written when one of them is outside the support.
export function someEvent(d) {
  const pts = gridPoints(d)
  const lt = () => choice(['<', '\\le'])
  const kind = choice(['between', 'between', 'above', 'below', 'clip'])
  if (kind === 'between') {
    const i = randInt(0, pts.length - 2)
    const j = randInt(i + 1, pts.length - 1)
    return { latex: `P(${pts[i]} ${lt()} X ${lt()} ${pts[j]})`, a: pts[i], b: pts[j] }
  }
  if (kind === 'above') {
    const u = choice(pts)
    return { latex: `P(X ${choice(['>', '\\ge'])} ${u})`, a: u, b: d.hi }
  }
  if (kind === 'below') {
    const v = choice(pts)
    return { latex: `P(X ${lt()} ${v})`, a: d.lo, b: v }
  }
  if (d.hi === Infinity || Math.random() < 0.5) {
    const v = choice(pts)
    const left = d.lo > 0 ? 0 : d.lo - 1
    return { latex: `P(${left} ${lt()} X ${lt()} ${v})`, a: d.lo, b: v, raw: [left, v] }
  }
  const u = choice(pts)
  const right = clean(d.hi + gridStep(d))
  return { latex: `P(${u} ${lt()} X ${lt()} ${right})`, a: u, b: d.hi, raw: [u, right] }
}

// The area under d from a to b, worked: ∫ f dx = [G] = value.
export function areaWork(d, a, b, value) {
  return work(
    `\\int_{${limTex(a)}}^{${limTex(b)}} ${paren(d.tex)}\\,dx = \\Big[${d.antiTex}\\Big]_{${limTex(a)}}^{${limTex(b)}} = ${num(value)}`,
  )
}

// ---------- this topic ----------

const VERDICTS = [
  { key: 'yes', text: 'Yes: f(x) ≥ 0 everywhere and the total area is 1.' },
  { key: 'negative', text: 'No: f(x) is negative for some x.' },
  { key: 'area', text: 'No: f(x) ≥ 0, but the total area is not 1.' },
]

// Lines and curves that integrate to exactly 1 but dip below 0. `why` shows
// where (LaTeX), `say` the same in words.
const at = (x, v) => ({ why: `f(${x}) = ${v} < 0`, say: `f(${x}) = ${v.replace('-', '−')}, below 0` })
const NEGATIVE = [
  { tex: 'x - 0.5', lo: 0, hi: 2, ...at(0, '-0.5') },
  { tex: '3x - 0.5', lo: 0, hi: 1, ...at(0, '-0.5') },
  { tex: '2.5 - 3x', lo: 0, hi: 1, ...at(1, '-0.5') },
  { tex: 'x - 1.5', lo: 1, hi: 3, ...at(1, '-0.5') },
  { tex: '0.25x - 0.25', lo: 0, hi: 4, ...at(0, '-0.25') },
  { tex: '1.5 - x', lo: 0, hi: 2, ...at(2, '-0.5') },
  { tex: '6x^{2} - 1', lo: 0, hi: 1, ...at(0, '-1') },
  { tex: '8x^{3} - 1', lo: 0, hi: 1, ...at(0, '-1') },
  { tex: '\\frac{3}{4}x^{2} - \\frac{1}{2}', lo: 0, hi: 2, ...at(0, '-0.5') },
  { tex: '\\frac{1}{2}x^{3} - \\frac{1}{2}', lo: 0, hi: 2, ...at(0, '-0.5') },
  { tex: '(2x - 1)e^{-x}', lo: 0, hi: Infinity, why: 'f(x) < 0 \\text{ for } 0 < x < 0.5', say: 'f(x) < 0 whenever 0 < x < 0.5' },
  { tex: '(3x - 2)e^{-x}', lo: 0, hi: Infinity, why: 'f(x) < 0 \\text{ for } 0 < x < \\tfrac{2}{3}', say: 'f(x) < 0 whenever 0 < x < 2/3' },
]

// Never negative, but the area is off: the usual slips when building a pdf.
const BAD_AREA = [
  // the lead line on a stretched or shrunk interval
  () => {
    const [a, b, m] = choice(LEAD)
    const hi = clean(b + (choice([-1, 1]) * (b - a)) / 4)
    return { tex: polyTex([-clean(m * a), m]), lo: a, hi, area: (m * (hi - a) ** 2) / 2 }
  },
  // a line with its intercept nudged up
  () => {
    const [lo, hi, m, k] = choice(TRAP)
    const k2 = k + 0.25
    return { tex: polyTex([k2, m]), lo, hi, area: polyInt([k2, m], lo, hi) }
  },
  // c·xⁿ with c = 1/b^(n+1): forgot the n + 1
  () => {
    const [n, b] = choice(POWER)
    return { tex: `${coefTex(1, b ** (n + 1))}${xPow(n)}`, lo: 0, hi: b, area: 1 / (n + 1) }
  },
  // e^(−x/β) without the 1/β, or with 2 in front
  () => {
    const beta = choice([2, 3, 4, 5])
    const c = choice([1, 2])
    return { tex: `${c === 1 ? '' : c}e^{-x/${beta}}`, lo: 0, hi: Infinity, area: c * beta }
  },
  // a flat line at the wrong height (the notes' f(x) = 5 on [1, 6] is one)
  () => {
    if (Math.random() < 0.25) return { tex: '5', lo: 1, hi: 6, area: 25 }
    const a = randInt(0, 4)
    const w = choice([2, 3, 4, 5])
    const k = choice([2, 3, 4, 5, 6, 8].filter(v => v !== w))
    return { tex: fracTex(1, k), lo: a, hi: a + w, area: w / k }
  },
  // c/x^m on x ≥ 1 with c ≠ m − 1
  () => {
    const m = choice([2, 3, 4])
    const c = choice([1, 2, 3, 4].filter(v => v !== m - 1))
    return { tex: `\\frac{${c}}{${xPow(m)}}`, lo: 1, hi: Infinity, area: c / (m - 1) }
  },
]

function goodCandidate() {
  const d = someDensity(['lead', 'falling', 'trap', 'power', 'decr', 'exp', 'flat'])
  return { tex: d.tex, lo: d.lo, hi: d.hi, area: 1 }
}

// find c: g is the shape without c; its area over the support is p/q, so c = q/p
const FIND_C = [
  () => {
    const [n, b] = choice(POWER)
    const B = b ** (n + 1)
    return {
      shape: xPow(n),
      tex: `c\\,${xPow(n)}`,
      lo: 0,
      hi: b,
      area: [B, n + 1],
      G: x => x ** (n + 1) / (n + 1),
      wrong: [1 / B, (n + 1) / b ** n, B / (n + 1)],
    }
  },
  () => {
    const b = choice([1, 2, 3, 4, 5])
    return {
      shape: `(${b} - x)`,
      tex: `c(${b} - x)`,
      lo: 0,
      hi: b,
      area: [b * b, 2],
      G: x => b * x - (x * x) / 2,
      wrong: [1 / (b * b), 2 / b, (b * b) / 2],
    }
  },
  () => {
    const [a, b] = choice([
      [1, 3],
      [2, 4],
      [1, 2],
      [2, 3],
      [1, 4],
    ])
    return {
      shape: 'x',
      tex: 'c\\,x',
      lo: a,
      hi: b,
      area: [b * b - a * a, 2],
      G: x => (x * x) / 2,
      wrong: [2 / (b * b), 1 / (b * b - a * a), 2 / (b - a) ** 2],
    }
  },
  () => {
    const [lo, hi] = choice([
      [-1, 2],
      [-1, 1],
      [-2, 1],
      [-2, 2],
      [-3, 3],
    ])
    return {
      shape: 'x^{2}',
      tex: 'c\\,x^{2}',
      lo,
      hi,
      area: [hi ** 3 - lo ** 3, 3],
      G: x => x ** 3 / 3,
      wrong: [3 / (hi ** 3 + lo ** 3), 3 / hi ** 3, 1 / (hi ** 3 - lo ** 3)],
    }
  },
  () => {
    const b = choice([1, 2, 4])
    return {
      shape: '(x + 1)',
      tex: 'c(x + 1)',
      lo: 0,
      hi: b,
      area: [b * b + 2 * b, 2],
      G: x => (x * x) / 2 + x,
      wrong: [2 / (b * b), 1 / b, 1 / (b * b + b)],
    }
  },
  () => {
    const b = choice([1, 2, 3])
    return {
      shape: `x(${b} - x)`,
      tex: `c\\,x(${b} - x)`,
      lo: 0,
      hi: b,
      area: [b ** 3, 6],
      G: x => (b * x * x) / 2 - x ** 3 / 3,
      wrong: [3 / (2 * b ** 3), b ** 3 / 6, 2 / (b * b)],
    }
  },
  () => {
    if (Math.random() < 0.6) {
      const beta = choice([2, 3, 4, 5, 10])
      return {
        shape: `e^{-x/${beta}}`,
        tex: `c\\,e^{-x/${beta}}`,
        lo: 0,
        hi: Infinity,
        area: [beta, 1],
        G: x => -beta * Math.exp(-x / beta),
        wrong: [beta, 1, 1 / (2 * beta)],
        grid: [beta / 2, beta, 2 * beta],
      }
    }
    const k = choice([2, 3, 4])
    return {
      shape: `e^{-${k}x}`,
      tex: `c\\,e^{-${k}x}`,
      lo: 0,
      hi: Infinity,
      area: [1, k],
      G: x => -Math.exp(-k * x) / k,
      wrong: [1 / k, 1, k * k],
      grid: [0.25, 0.5, 1],
    }
  },
  () => {
    const [m, L] = choice([
      [2, 1],
      [3, 1],
      [4, 1],
      [2, 2],
      [3, 2],
      [2, 3],
    ])
    const c = (m - 1) * L ** (m - 1)
    return {
      shape: `\\frac{1}{${xPow(m)}}`,
      tex: `\\frac{c}{${xPow(m)}}`,
      lo: L,
      hi: Infinity,
      area: [1, c],
      G: x => -(x ** (1 - m)) / (m - 1),
      wrong: [1 / c, L === 1 ? m + 1 : m - 1, (m + 1) * L ** (m + 1)],
      grid: [L + 0.5, 2 * L, 3 * L],
    }
  },
]

function findC() {
  const s = choice(FIND_C)()
  const [p, q] = s.area
  const c = q / p
  const cTex = fracTex(q, p, 'tfrac')
  const showC = Number.isInteger(c) ? `c = ${c}` : `c = ${cTex} = ${num(c)}`
  return { ...s, c, cTex, showC }
}

const PDF_HINT = {
  latex: 'f(x) \\ge 0 \\text{ for all } x \\quad\\text{and}\\quad \\int_{-\\infty}^{\\infty} f(x)\\,dx = 1',
  text: 'A pdf needs both. Look for any x where f < 0 (a line is lowest at an end of its support), then integrate over the support, where f lives.',
}

export default {
  id: 'continuous-pdf',
  name: 'Continuous pdfs',
  description: '§4.1: is it a pdf, find the constant, probabilities by integration.',
  learn: {
    formulas: [
      { label: 'A continuous pdf', latex: 'f(x) \\ge 0 \\text{ for all } x, \\qquad \\int_{-\\infty}^{\\infty} f(x)\\,dx = 1' },
      { label: 'Probability is area', latex: 'P(a \\le X \\le b) = \\int_a^b f(x)\\,dx' },
      { label: 'One point has no area', latex: 'P(X = a) = 0, \\quad P(a \\le X \\le b) = P(a < X < b)' },
      { label: 'Power rule', latex: '\\int_a^b x^n\\,dx = \\frac{b^{n+1} - a^{n+1}}{n+1}' },
      { label: 'Exponential area', latex: '\\int_0^{\\infty} e^{-x/\\beta}\\,dx = \\beta' },
    ],
    how: [
      'Show f is a pdf: check f(x) ≥ 0 (for a line, check both ends of the support), then check the total area is 1.',
      'Lead example: f(x) = 12.5x − 1.25 on [0.1, 0.5]. f(0.1) = 0 and f(0.5) = 5, so f ≥ 0, and [6.25x² − 1.25x] from 0.1 to 0.5 is 0.9375 − (−0.0625) = 1.',
      'Find the constant: integrate with c pulled out front, set c·(area) = 1, and solve. For c·x² on [0, 3]: c·9 = 1, so c = 1/9.',
      'A probability is an area: P(a < X < b) = ∫ from a to b of f(x) dx. f is 0 off the support, so first clip the limits to it.',
      'Lead example again: P(0.2 < X < 0.3) = [6.25x² − 1.25x] from 0.2 to 0.3 = 0.1875 − 0 = 0.1875.',
      'A single point has no width, so P(X = a) = 0, and < or ≤ never changes a continuous probability.',
    ],
  },
  templates: [
    {
      id: 'is-pdf',
      generate() {
        const key = choice(['yes', 'yes', 'negative', 'area', 'area'])
        const cand = key === 'yes' ? goodCandidate() : key === 'negative' ? choice(NEGATIVE) : choice(BAD_AREA)()
        const idx = VERDICTS.findIndex(v => v.key === key)
        const lims = `_{${limTex(cand.lo)}}^{${limTex(cand.hi)}}`
        const why =
          key === 'negative'
            ? cand.why
            : `\\int${lims} ${paren(cand.tex)}\\,dx = ${key === 'yes' ? '1' : `${num(cand.area)} \\ne 1`}`
        return {
          ask: 'Is this a pdf? If not, what fails?',
          latex: pdfCases(cand.tex, cand.lo, cand.hi),
          size: 'small',
          options: VERDICTS.map(v => v.text),
          answer: 'abc'[idx],
          answerLatex: `\\text{(${'abc'[idx]})}\\quad ${work(why)}`,
          placeholder: 'a, b or c',
          hint: {
            latex: PDF_HINT.latex,
            text:
              key === 'negative'
                ? `Here ${cand.say}, so it fails before you even integrate.`
                : key === 'area'
                  ? `f is never negative here, but the area is ${num(cand.area)}. A pdf must have area exactly 1.`
                  : PDF_HINT.text,
          },
        }
      },
    },
    {
      id: 'find-c',
      generate() {
        const s = findC()
        const [p, q] = s.area
        return {
          ask: 'Find the constant c that makes f a pdf.',
          latex: stack(pdfCases(s.tex, s.lo, s.hi), 'c = \\,?'),
          size: 'small',
          answer: s.c,
          answerLatex: work(
            `\\int_{${limTex(s.lo)}}^{${limTex(s.hi)}} ${s.shape}\\,dx = ${fracTex(p, q)} \\;\\Rightarrow\\; ${s.showC}`,
          ),
          placeholder: 'e.g. 3/8',
          tolerance: Math.max(1e-4, s.c * 0.005),
          hint: {
            latex: '\\int c\\,g(x)\\,dx = c\\int g(x)\\,dx = 1 \\;\\Rightarrow\\; c = \\frac{1}{\\int g(x)\\,dx}',
            text: 'Pull c out of the integral, integrate the rest over the support, and set c times that area equal to 1.',
          },
          distractors: s.wrong.filter(w => Number.isFinite(w) && w > 0),
        }
      },
    },
    {
      id: 'prob',
      generate() {
        const d = someDensity(['lead', 'lead', 'falling', 'trap', 'power', 'decr'])
        const ev = someEvent(d)
        const ans = d.F(ev.b) - d.F(ev.a)
        const wrong = [1 - ans, d.f(ev.b) - d.f(ev.a), d.f(ev.b) * (ev.b - ev.a)]
        if (ev.raw) wrong.unshift(d.G(ev.raw[1]) - d.G(ev.raw[0]))
        if (ev.a > d.lo) wrong.push(d.F(ev.b))
        return {
          ask: 'Find the probability by integrating the pdf.',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), `${ev.latex} = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: areaWork(d, ev.a, ev.b, ans),
          placeholder: 'e.g. 0.1875',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(a < X < b) = \\int_a^b f(x)\\,dx',
            text: ev.raw
              ? `Part of that range is outside the support, where f = 0. Integrate only from ${ev.a} to ${ev.b}.`
              : 'Integrate f between the two limits (antiderivative at the top minus at the bottom). Do not subtract density values.',
          },
          distractors: probs(...wrong),
        }
      },
    },
    {
      id: 'find-c-prob',
      generate() {
        const s = findC()
        let a
        let b
        let latex
        if (s.hi === Infinity) {
          const u = choice(s.grid)
          ;[a, b] = Math.random() < 0.5 ? [u, Infinity] : [s.lo, u]
          latex = b === Infinity ? `P(X > ${u})` : `P(X < ${u})`
        } else {
          const step = (s.hi - s.lo) / (s.hi - s.lo > 2 ? s.hi - s.lo : 4)
          const pts = []
          for (let k = 1; s.lo + k * step < s.hi - 1e-9; k++) pts.push(clean(s.lo + k * step))
          const kind = choice(['below', 'above', 'between'])
          if (kind === 'below' || pts.length < 2) {
            b = choice(pts)
            a = s.lo
            latex = `P(X < ${b})`
          } else if (kind === 'above') {
            a = choice(pts)
            b = s.hi
            latex = `P(X > ${a})`
          } else {
            const i = randInt(0, pts.length - 2)
            a = pts[i]
            b = pts[randInt(i + 1, pts.length - 1)]
            latex = `P(${a} < X < ${b})`
          }
        }
        const raw = s.G(b) - s.G(a)
        const ans = s.c * raw
        return {
          ask: 'First find c so that f is a pdf, then the probability.',
          latex: stack(pdfCases(s.tex, s.lo, s.hi), `${latex} = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: work(
            `${s.showC}, \\quad \\int_{${limTex(a)}}^{${limTex(b)}} ${s.cTex}\\,${s.shape}\\,dx = ${num(ans)}`,
          ),
          placeholder: 'e.g. 0.25',
          tolerance: tolFor(ans),
          hint: {
            latex: 'c = \\frac{1}{\\int g(x)\\,dx}, \\qquad P(a < X < b) = c\\int_a^b g(x)\\,dx',
            text: 'Two steps: the whole area must be 1, which fixes c; then integrate c·g over the event.',
          },
          distractors: probs(raw, 1 - ans, s.wrong[0] * raw),
        }
      },
    },
    {
      id: 'point',
      generate() {
        const d = someDensity(['lead', 'falling', 'trap', 'power', 'exp'])
        const pts = gridPoints(d)
        const a = choice(pts)
        const Fa = Number(dec(d.F(a)))
        const fa = d.f(a)
        const v = choice(['equal', 'equal', 'strict', 'complement', 'closed'])
        let given = ''
        let target
        let ans
        let shown
        let wrong
        if (v === 'equal') {
          target = `P(X = ${a})`
          ans = 0
          shown = `P(X = ${a}) = \\int_{${a}}^{${a}} f(x)\\,dx = 0`
          wrong = [fa, Fa]
        } else if (v === 'strict') {
          given = `P(X \\le ${a}) = ${Fa}`
          target = `P(X < ${a})`
          ans = Fa
          shown = `P(X < ${a}) = P(X \\le ${a}) - P(X = ${a}) = ${Fa}`
          wrong = [Fa - fa, 1 - Fa, fa]
        } else if (v === 'complement') {
          given = `P(X < ${a}) = ${Fa}`
          target = `P(X \\ge ${a})`
          ans = 1 - Fa
          shown = `P(X \\ge ${a}) = 1 - P(X < ${a}) = ${dec(1 - Fa)}`
          wrong = [Fa, 1 - Fa - fa]
        } else {
          const i = randInt(0, pts.length - 2)
          const lo = pts[i]
          const hi = pts[randInt(i + 1, pts.length - 1)]
          const w = Number(dec(d.F(hi) - d.F(lo)))
          given = `P(${lo} \\le X \\le ${hi}) = ${w}`
          target = `P(${lo} < X < ${hi})`
          ans = w
          shown = `P(${lo} < X < ${hi}) = P(${lo} \\le X \\le ${hi}) = ${w}`
          wrong = [w - d.f(lo) - d.f(hi), 1 - w]
        }
        return {
          ask: 'X is continuous. What is one point worth?',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), `${given ? `${given}, \\quad ` : ''}${target} = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: work(shown),
          placeholder: 'e.g. 0.4',
          tolerance: ans === 0 ? 1e-6 : tolFor(ans),
          hint: {
            latex: 'P(X = a) = \\int_a^a f(x)\\,dx = 0 \\;\\Rightarrow\\; P(X \\le a) = P(X < a)',
            text: 'A single point has width 0, so it adds no area. Including or excluding an endpoint changes nothing. f(a) is a height, not a probability.',
          },
          distractors: wrong.filter(w => Number.isFinite(w) && w > 0 && Math.abs(w - ans) > 1e-9),
        }
      },
    },
  ],
}
