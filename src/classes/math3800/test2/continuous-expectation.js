import { choice } from '../../../engine/rand.js'
import { dec, num } from './util.js'
import { FAMILIES, coefTex, expExponent, fracTex, paren, pdfCases, polyTex, stack, work, xPow } from './continuous-pdf.js'

// §4.2: E[H(X)] = ∫ H(x) f(x) dx. The mean, E[X²], the variance by the
// shortcut, a function of X, and the Cauchy lesson: a mean can fail to exist.

const fact = n => (n <= 1 ? 1 : n * fact(n - 1))
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

// E[1/X] when it is finite: lines on a support away from 0, or c·xⁿ with n ≥ 1
function inverseMoment(d) {
  if (d.kind === 'power') return (d.n + 1) / (d.n * d.b)
  if (!d.c || d.lo <= 0) return null
  const [k, m] = d.c
  return k * Math.log(d.hi / d.lo) + m * (d.hi - d.lo)
}

const MEAN_HINT = {
  latex: '\\mu = E[X] = \\int_{-\\infty}^{\\infty} x\\,f(x)\\,dx',
  text: 'Multiply the density by x, then integrate over the support only (f is 0 elsewhere). Integrating f alone just gives 1.',
}

// Densities whose far tail decides whether E[X] or E[X²] is finite.
const TAILS = [
  { tex: '\\frac{1}{x^{2}}', c: 1, lo: 1, m: 2 },
  { tex: '\\frac{2}{x^{3}}', c: 2, lo: 1, m: 3 },
  { tex: '\\frac{3}{x^{4}}', c: 3, lo: 1, m: 4 },
  { tex: '\\frac{4}{x^{5}}', c: 4, lo: 1, m: 5 },
  { tex: '\\frac{2}{x^{2}}', c: 2, lo: 2, m: 2 },
  { tex: '\\frac{8}{x^{3}}', c: 8, lo: 2, m: 3 },
  { tex: '\\frac{24}{x^{4}}', c: 24, lo: 2, m: 4 },
]
const CAUCHY = '\\frac{1}{\\pi(1 + x^{2})}'

export default {
  id: 'continuous-expectation',
  name: 'Mean and variance (continuous)',
  description: '§4.2: E[X], E[X²] and Var X by integration.',
  learn: {
    formulas: [
      { label: 'Expected value', latex: 'E[H(X)] = \\int_{-\\infty}^{\\infty} H(x)\\,f(x)\\,dx' },
      { label: 'Mean and second moment', latex: '\\mu = \\int x\\,f(x)\\,dx, \\qquad E[X^2] = \\int x^2 f(x)\\,dx' },
      { label: 'Variance', latex: '\\sigma^2 = \\operatorname{Var}X = E[X^2] - \\mu^2' },
      { label: 'Linear functions', latex: 'E[aX + b] = a\\,E[X] + b' },
      { label: 'Exists only if', latex: '\\int_{-\\infty}^{\\infty} |x|\\,f(x)\\,dx < \\infty' },
      { label: 'Exponential moments', latex: '\\int_0^{\\infty} x^k\\,\\tfrac{1}{\\beta}e^{-x/\\beta}\\,dx = k!\\,\\beta^k' },
    ],
    how: [
      'Multiply by what you want the average of, then integrate over the support: x·f(x) for the mean, x²·f(x) for E[X²].',
      'Lead example: μ = ∫ from 0.1 to 0.5 of x(12.5x − 1.25) dx = 0.3667, and E[X²] = 0.1433.',
      'Variance in two steps: E[X²], then subtract μ². Lead: 0.1433 − 0.3667² = 0.008889. σ is the square root, 0.0943.',
      'f(x) = e^(−x) for x > 0: μ = ∫ x e^(−x) dx = 1 (by parts, or Γ(2) = 1! = 1).',
      'For a linear H, skip the integral: E[aX + b] = aμ + b. For anything else (X³, 1/X), integrate H(x)f(x); E[1/X] is not 1/μ.',
      'The mean exists only if ∫ |x| f(x) dx is finite. For c/x^m on x ≥ 1, x·f(x) = c/x^(m−1), finite only when m − 1 > 1. The Cauchy density acts like 1/(πx) far out, so its mean does not exist.',
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
      id: 'function',
      generate() {
        const d = someDensity()
        const mu = d.moment(1)
        const m2 = d.moment(2)
        const options = [
          () => {
            const a = choice([2, 3, 4, 5, 10])
            // an answer of exactly 0 would print as floating dust
            const b = choice([-4, -2, -1, 1, 3, 5].filter(v => Math.abs(a * mu + v) > 1e-6))
            const H = `${a}X ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
            const v = a * mu + b
            return {
              H,
              v,
              shown: `E[${H}] = ${a}E[X] ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a}(${num(mu)}) ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${num(v)}`,
              wrong: [a * mu, mu + b, a * mu - b],
            }
          },
          () => {
            const v = d.moment(3)
            return { H: 'X^{3}', v, shown: momentWork(d, 3, v), wrong: [mu ** 3, m2 * mu, 3 * mu] }
          },
          () => {
            const v = m2 + mu
            return { H: 'X^{2} + X', v, shown: `E[X^{2}] + E[X] = ${num(m2)} + ${num(mu)} = ${num(v)}`, wrong: [mu * mu + mu, m2, m2 + 1] }
          },
        ]
        const inv = inverseMoment(d)
        if (inv !== null) {
          // f(x)/x written out: c·x^(n−1) for a power density, (line)/x otherwise
          const over =
            d.kind === 'power'
              ? d.n === 1
                ? fracTex(d.n + 1, d.B)
                : `${coefTex(d.n + 1, d.B)}${xPow(d.n - 1)}`
              : `\\frac{${d.tex}}{x}`
          options.push(() => ({
            H: '\\tfrac{1}{X}',
            v: inv,
            shown: work(`\\int_{${d.lo}}^{${d.hi}} ${over}\\,dx = ${num(inv)}`),
            wrong: [1 / mu, mu, 1 / m2],
          }))
        }
        const q = choice(options)()
        return {
          ask: 'Find the expected value of this function of X.',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), `E\\!\\left[${q.H}\\right] = \\,?`),
          size: 'small',
          answer: q.v,
          answerLatex: work(q.shown),
          placeholder: 'e.g. 3.73',
          tolerance: rel(q.v),
          hint: {
            latex: 'E[H(X)] = \\int H(x)\\,f(x)\\,dx, \\qquad E[aX + b] = a\\,E[X] + b',
            text: 'A linear H passes through E. Anything else needs its own integral: E[X³] is not μ³, and E[1/X] is not 1/μ.',
          },
          distractors: q.wrong.filter(w => Number.isFinite(w) && Math.abs(w - q.v) > 1e-9),
        }
      },
    },
    {
      id: 'exists',
      generate() {
        const k = choice([1, 1, 2])
        const want = choice(['yes', 'no'])
        const what = k === 1 ? 'E[X]' : 'E[X^2]'
        const Hx = k === 1 ? 'x' : 'x^{2}'
        let latex
        let shown
        const pool = [
          ...TAILS.filter(t => (t.m - k > 1) === (want === 'yes')).map(t => ({ kind: 'tail', ...t })),
          want === 'yes' ? { kind: 'exp' } : { kind: 'cauchy' },
        ]
        const pick = choice(pool)
        if (pick.kind === 'tail') {
          const p = pick.m - k
          const reduced = p === 0 ? `${pick.c}` : `\\frac{${pick.c}}{${xPow(p)}}`
          const value = want === 'yes' ? num((pick.c * pick.lo ** (1 - p)) / (p - 1)) : '\\infty'
          latex = pdfCases(pick.tex, pick.lo, Infinity)
          shown = `\\int_{${pick.lo}}^{\\infty} ${Hx}\\cdot ${pick.tex}\\,dx = \\int_{${pick.lo}}^{\\infty} ${reduced}\\,dx = ${value}`
        } else if (pick.kind === 'exp') {
          latex = pdfCases('e^{-x}', 0, Infinity)
          shown = `\\int_{0}^{\\infty} ${Hx}e^{-x}\\,dx = ${fact(k)}`
        } else {
          latex = `f(x) = ${CAUCHY}, \\quad -\\infty < x < \\infty`
          shown = `\\int_{-\\infty}^{\\infty} \\frac{${k === 1 ? '|x|' : 'x^{2}'}}{\\pi(1 + x^{2})}\\,dx = \\infty`
        }
        return {
          ask: `Does ${k === 1 ? 'the mean E[X]' : 'E[X²]'} exist (is the integral finite)?`,
          latex: stack(latex, `${what} \\text{ exists?}`),
          size: 'small',
          answer: want,
          answerLatex: `${shown} \\;\\Rightarrow\\; \\text{${want}}`,
          placeholder: 'yes or no',
          hint: {
            latex: '\\int_1^{\\infty} \\frac{dx}{x^p} < \\infty \\iff p > 1',
            text: `Multiply f by ${k === 1 ? 'x' : 'x²'} and look at the power of x far out. Like 1/x^p with p > 1 means finite; 1/x or slower means it does not exist (the Cauchy density acts like 1/(πx)).`,
          },
        }
      },
    },
  ],
}

// ∫ from 0 (not from the left end of the support) of x·f(x): forgetting where f starts
function polyIntFrom0(d) {
  return d.c.reduce((s, ci, i) => s + (ci * d.hi ** (i + 2)) / (i + 2), 0)
}
