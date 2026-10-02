import { choice, shuffle } from '../../../engine/rand.js'
import { pdfTable, randProbs } from '../util.js'
import { dec, num } from './util.js'
import { FAMILIES, coefTex, expExponent, paren, pdfCases, polyTex, stack, work, xPow } from './continuous-pdf.js'

// §3.3, §4.2: the mean, E(X²) and the variance by the shortcut, from a pdf.
// Discrete: E(X) = Σ x f(x). Continuous: E[X] = ∫ x f(x) dx.

// answers to about three significant figures
const rel = v => Math.max(1e-6, Math.abs(v) * 0.005)

// x^k·f(x) written out, for the worked answers
function integrandTex(d, k) {
  if (k === 0) return paren(d.tex)
  const xk = xPow(k)
  if (d.kind === 'power') return `${coefTex(d.n + 1, d.B)}${xPow(d.n + k)}`
  if (d.kind === 'decr') return `${coefTex(2, d.b * d.b)}${xk}(${d.b} - x)`
  if (d.kind === 'exp') {
    const ex = expExponent(d.beta)
    return d.beta === 1 ? `${xk}e^{${ex}}` : d.beta < 1 ? `${dec(1 / d.beta)}${xk}e^{${ex}}` : `\\frac{1}{${d.beta}}${xk}e^{${ex}}`
  }
  return paren(polyTex([...Array(k).fill(0), ...d.c]))
}

// ∫ x^k f(x) dx = value, worked; the exponential uses ∫ x^k e^(−x/β)/β dx = k!β^k
function momentWork(d, k, value) {
  const lim = `_{${d.lo}}^{${d.hi === Infinity ? '\\infty' : d.hi}}`
  const via = d.kind === 'exp' ? ` = ${k}!\\cdot ${dec(d.beta)}^{${k}}` : ''
  return work(`\\int${lim} ${integrandTex(d, k)}\\,dx${via} = ${num(value)}`)
}

const DENSITIES = ['lead', 'lead', 'falling', 'trap', 'power', 'power', 'decr', 'exp']
const someDensity = (kinds = DENSITIES) => FAMILIES[choice(kinds)]()

const MEAN_HINT = {
  latex: '\\mu = E[X] = \\int_{-\\infty}^{\\infty} x\\,f(x)\\,dx',
  text: 'Multiply the density by x, then integrate over the support only (f is 0 elsewhere). Integrating f alone just gives 1.',
}

// ---------- discrete pdfs (shared with the cdf topic) ----------
//
// Whole-number weights ws over one denominator D on a few x values, so every
// sum is exact. `shown` is the pdf as printed: a formula like
// f(x) = x/10, x = 1, 2, 3, 4, or now and then a table of decimals.

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
export const total = vs => vs.reduce((s, v) => s + v, 0)

// The top of f(x) = top/D, as LaTeX and as the weight w(x).
const FORMULAS = [
  () => ({ xs: range(1, choice([3, 4, 4, 5, 6])), top: 'x', w: x => x }),
  () => {
    const k = choice([1, 2])
    return { xs: range(choice([0, 1]), choice([3, 4])), top: `x + ${k}`, w: x => x + k }
  },
  () => ({ xs: range(1, choice([2, 3, 3, 4])), top: 'x^{2}', w: x => x * x }),
  () => {
    const n = choice([3, 4, 4, 5])
    const m = n + choice([1, 1, 2])
    return { xs: range(1, n), top: `${m} - x`, w: x => m - x }
  },
  () => ({ xs: range(1, choice([3, 4, 5, 6])), top: '1', w: () => 1 }),
  () => ({ xs: range(1, choice([3, 4])), top: '2x - 1', w: x => 2 * x - 1 }),
]

export function someDiscrete() {
  if (Math.random() < 0.3) {
    const n = choice([3, 4, 4, 5])
    const start = choice([0, 1])
    // consecutive values, or a few spread out over 0 to 6
    const xs =
      Math.random() < 0.6
        ? range(start, start + n - 1)
        : shuffle(range(0, 6))
            .slice(0, n)
            .sort((a, b) => a - b)
    const ws = randProbs(n)
    return { xs, ws, D: 100, table: true, shown: pdfTable(xs, ws) }
  }
  const { xs, top, w } = choice(FORMULAS)()
  const ws = xs.map(w)
  const D = total(ws)
  return { xs, ws, D, table: false, shown: `f(x) = \\frac{${top}}{${D}}, \\quad x = ${xs.join(', ')}` }
}

// p/q exactly: a whole number, a short decimal (0.35), or \frac{p}{q} in lowest
// terms. `short` false keeps fractions throughout, so sixths never print as
// 0.5 next to \frac{1}{3}.
export function exactTex(p, q, short = true) {
  const g = gcd(p, q)
  const [a, b] = [p / g, q / g]
  if (b === 1) return String(a)
  if (short && 10000 % b === 0) return dec(a / b)
  return `\\frac{${a}}{${b}}`
}

// Values in a pdf's own terms: decimals when its denominator allows (tenths, a
// table's hundredths), fractions otherwise.
export const pdfTex = (d, p) => exactTex(p, d.D, 10000 % d.D === 0)

// The final value of a worked answer: 0.35, 3, or \frac{18}{7} \approx 2.571.
export const finalTex = (p, q) => {
  const t = exactTex(p, q)
  return t.startsWith('\\frac') ? `${t} \\approx ${num(p / q)}` : t
}

// One f(x) value as written in a sum: 0.25 from a table, \frac{2}{10} (unreduced) from a formula.
export const termTex = (d, w) => (d.table ? dec(w / 100) : `\\frac{${w}}{${d.D}}`)

// Σ x^k f(x), worked up to (not including) its value; `S` is the whole-number sum of x^k·w.
function sumWork(d, k) {
  const xk = x => (k === 1 ? `${x}` : `${x}^{${k}}`)
  const S = total(d.xs.map((x, i) => x ** k * d.ws[i]))
  if (d.table) return { S, tex: d.xs.map((x, i) => `${xk(x)}\\cdot ${termTex(d, d.ws[i])}`).join(' + ') }
  const ones = d.ws.every(w => w === 1)
  const terms = d.xs.map((x, i) => (ones ? xk(x) : `${xk(x)}\\cdot ${d.ws[i]}`)).join(' + ')
  // show S/D before reducing it, unless it is already the final value
  const raw = gcd(S, d.D) > 1 || 10000 % d.D === 0 ? ` = \\frac{${S}}{${d.D}}` : ''
  return { S, tex: `\\frac{1}{${d.D}}(${terms})${raw}` }
}

// The squared mean as written: 3^{2}, 2.5^{2}, \left(\frac{18}{7}\right)^{2}
const squared = t => (t.startsWith('\\frac') ? `\\left(${t}\\right)^{2}` : `${t}^{2}`)

export default {
  id: 'continuous-expectation',
  name: 'Mean and variance from a pdf',
  description: '§3.3, §4.2: E(X) = Σ x f(x) or ∫ x f(x) dx, and Var X = E(X²) − μ².',
  learn: {
    formulas: [
      {
        label: 'Mean (discrete or continuous)',
        latex: '\\mu = E(X) = \\sum_x x\\,f(x) \\quad\\text{or}\\quad \\int_{-\\infty}^{\\infty} x\\,f(x)\\,dx',
      },
      {
        label: 'Second moment',
        latex: 'E(X^2) = \\sum_x x^2 f(x) \\quad\\text{or}\\quad \\int_{-\\infty}^{\\infty} x^2 f(x)\\,dx',
      },
      { label: 'Variance', latex: '\\sigma^2 = \\operatorname{Var}X = E(X^2) - \\mu^2, \\qquad \\sigma = \\sqrt{\\operatorname{Var}X}' },
      { label: 'Exponential moments', latex: '\\int_0^{\\infty} x^k\\,\\tfrac{1}{\\beta}e^{-x/\\beta}\\,dx = k!\\,\\beta^k' },
    ],
    how: [
      'Multiply by what you want the average of, then add over the values (discrete) or integrate over the support (continuous): x·f(x) for the mean, x²·f(x) for E(X²).',
      'Discrete example: f(x) = x/10 for x = 1, 2, 3, 4. E(X) = (1·1 + 2·2 + 3·3 + 4·4)/10 = 3 and E(X²) = (1·1 + 4·2 + 9·3 + 16·4)/10 = 10, so Var X = 10 − 3² = 1.',
      'E(X) is a weighted average: not the plain average of the x values, and not Σ f(x), which is always 1.',
      'Lead example: μ = ∫ from 0.1 to 0.5 of x(12.5x − 1.25) dx = 0.3667, and E[X²] = 0.1433.',
      'Variance in two steps: E(X²), then subtract μ². Lead: 0.1433 − 0.3667² = 0.008889. σ is the square root, 0.0943.',
      'f(x) = e^(−x) for x > 0: μ = ∫ x e^(−x) dx = 1 (by parts, or Γ(2) = 1! = 1).',
    ],
  },
  templates: [
    {
      id: 'mean',
      generate() {
        const d = someDensity()
        const mu = d.moment(1)
        const wrong =
          d.kind === 'exp'
            ? [1 / d.beta, d.beta * d.beta, d.beta / 2]
            : [(d.lo + d.hi) / 2, d.moment(2), d.c && d.lo > 0 ? polyIntFrom0(d) : NaN]
        return {
          ask: 'Find the mean of X.',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), '\\mu = E[X] = \\,?'),
          size: 'small',
          answer: mu,
          answerLatex: momentWork(d, 1, mu),
          placeholder: 'e.g. 0.3667',
          tolerance: rel(mu),
          hint: MEAN_HINT,
          distractors: [...wrong, 1].filter(w => Number.isFinite(w) && w > 0 && Math.abs(w - mu) > 1e-9),
        }
      },
    },
    {
      id: 'second-moment',
      generate() {
        const d = someDensity()
        const mu = d.moment(1)
        const m2 = d.moment(2)
        return {
          ask: 'Find the second moment E[X²].',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), 'E[X^2] = \\,?'),
          size: 'small',
          answer: m2,
          answerLatex: momentWork(d, 2, m2),
          placeholder: 'e.g. 0.1433',
          tolerance: rel(m2),
          hint: {
            latex: 'E[X^2] = \\int_{-\\infty}^{\\infty} x^2 f(x)\\,dx \\ne \\mu^2',
            text: 'Multiply f by x², then integrate over the support. Squaring the mean gives something else.',
          },
          distractors: [mu * mu, mu, m2 - mu * mu, d.moment(3)].filter(w => w > 0 && Math.abs(w - m2) > 1e-9),
        }
      },
    },
    {
      id: 'variance',
      generate() {
        const d = someDensity()
        const mu = d.moment(1)
        const m2 = d.moment(2)
        const v = m2 - mu * mu
        const sd = Math.sqrt(v)
        const steps = `E[X] = ${num(mu)}, \\quad E[X^{2}] = ${num(m2)}, \\quad \\operatorname{Var}X = ${num(m2)} - ${num(mu)}^{2} = ${num(v)}`
        const q = choice([
          { latex: '\\sigma^2 = \\operatorname{Var}X', v, shown: steps, wrong: [m2, m2 - mu, sd, mu * mu] },
          { latex: '\\sigma', v: sd, shown: `${steps}, \\quad \\sigma = ${num(sd)}`, wrong: [v, Math.sqrt(m2), m2 - mu] },
        ])
        return {
          ask: q.latex === '\\sigma' ? 'Find the standard deviation of X.' : 'Find the variance of X.',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), `${q.latex} = \\,?`),
          size: 'small',
          answer: q.v,
          answerLatex: work(q.shown),
          placeholder: 'e.g. 0.008889',
          tolerance: rel(q.v),
          hint: {
            latex: '\\operatorname{Var}X = E[X^2] - (E[X])^2, \\qquad \\sigma = \\sqrt{\\operatorname{Var}X}',
            text: 'Two integrals: ∫ x f(x) dx for μ and ∫ x² f(x) dx for E[X²]. Then subtract μ² (not μ). σ is the square root.',
          },
          distractors: q.wrong.filter(w => Number.isFinite(w) && w > 0 && Math.abs(w - q.v) > 1e-9),
        }
      },
    },
    {
      id: 'discrete-mean',
      generate() {
        const d = someDiscrete()
        const { S, tex } = sumWork(d, 1)
        const mu = S / d.D
        const m2 = total(d.xs.map((x, i) => x * x * d.ws[i])) / d.D
        // slips: the plain average of the x values, Σ f(x) (always 1), E(X²)
        const wrong = [total(d.xs) / d.xs.length, 1, m2]
        return {
          ask: 'Find the mean of X.',
          latex: stack(d.shown, '\\mu = E(X) = \\,?'),
          size: 'small',
          answer: mu,
          answerLatex: `${work(`E(X) = ${tex}`)} = ${finalTex(S, d.D)}`,
          placeholder: 'e.g. 7/3',
          tolerance: rel(mu),
          hint: {
            latex: '\\mu = E(X) = \\sum_x x\\,f(x)',
            text: 'Multiply each value x by its probability f(x) and add. Not the plain average of the x values, and not Σ f(x), which is always 1.',
          },
          distractors: wrong.filter(w => Math.abs(w - mu) > 1e-9),
        }
      },
    },
    {
      id: 'discrete-var',
      generate() {
        const d = someDiscrete()
        const first = sumWork(d, 1)
        const second = sumWork(d, 2)
        const [S1, S2, D] = [first.S, second.S, d.D]
        const mu = S1 / D
        const m2 = S2 / D
        // Var X = S2/D − (S1/D)², exactly
        const [vTop, vBot] = [D * S2 - S1 * S1, D * D]
        const v = vTop / vBot
        const sd = Math.sqrt(v)
        const steps = `E(X) = ${pdfTex(d, S1)}, \\quad E(X^{2}) = ${pdfTex(d, S2)}, \\quad \\operatorname{Var}X = ${pdfTex(d, S2)} - ${squared(pdfTex(d, S1))}`
        const q = choice([
          {
            latex: 'E(X^{2})',
            ask: 'Find the second moment E(X²).',
            v: m2,
            shown: `${work(`E(X^{2}) = ${second.tex}`)} = ${finalTex(S2, D)}`,
            wrong: [mu * mu, mu, v],
          },
          {
            latex: '\\sigma^2 = \\operatorname{Var}X',
            ask: 'Find the variance of X.',
            v,
            shown: `${work(steps)} = ${finalTex(vTop, vBot)}`,
            wrong: [m2, m2 - mu, sd, mu * mu],
          },
          {
            latex: '\\sigma',
            ask: 'Find the standard deviation of X.',
            v: sd,
            shown: work(`${steps} = ${exactTex(vTop, vBot)}, \\quad \\sigma = \\sqrt{${exactTex(vTop, vBot)}} = ${num(sd)}`),
            wrong: [v, Math.sqrt(m2), m2 - mu],
          },
        ])
        return {
          ask: q.ask,
          latex: stack(d.shown, `${q.latex} = \\,?`),
          size: 'small',
          answer: q.v,
          answerLatex: q.shown,
          placeholder: 'e.g. 1.25',
          tolerance: rel(q.v),
          hint:
            q.latex === 'E(X^{2})'
              ? {
                  latex: 'E(X^2) = \\sum_x x^2 f(x) \\ne \\mu^2',
                  text: 'Square each value x, weight it by f(x), and add. Squaring the mean gives something else.',
                }
              : {
                  latex: '\\operatorname{Var}X = E(X^2) - [E(X)]^2, \\qquad \\sigma = \\sqrt{\\operatorname{Var}X}',
                  text: 'Two sums: Σ x f(x) for μ and Σ x² f(x) for E(X²). Then subtract μ² (not μ). σ is the square root.',
                },
          distractors: q.wrong.filter(w => Number.isFinite(w) && w > 0 && Math.abs(w - q.v) > 1e-9),
        }
      },
    },
  ],
}

// ∫ from 0 (not from the left end of the support) of x·f(x): forgetting where f starts
function polyIntFrom0(d) {
  return d.c.reduce((s, ci, i) => s + (ci * d.hi ** (i + 2)) / (i + 2), 0)
}
