import { choice } from '../../../engine/rand.js'
import { BOX, derivation, dec, formula, lettered, someP } from './util.js'

// The derivations the study guide asks for (pdf, cdf, MGF, "show it's a pdf"),
// drilled one step at a time: the lines so far, then a box to fill. Later lines
// stay hidden so they never give the box away.

const VARS = ['p', 'q', 't', 'x', 'k']
// values where every wrong form differs from the right one (q is always 1 - p)
const POINTS = [
  { p: 0.3, q: 0.7, t: 0.1, x: 3, k: 4 },
  { p: 0.55, q: 0.45, t: -0.4, x: 5, k: 2 },
  { p: 0.8, q: 0.2, t: 0.7, x: 2, k: 3 },
  { p: 0.15, q: 0.85, t: -1.2, x: 7, k: 6 },
]
// p and q as separate letters: for a step that is about the series formula
// itself, before 1 - q = p is used
const FREE = [
  { p: 0.3, q: 0.5, t: 0.1, x: 3, k: 4 },
  { p: 0.2, q: 0.35, t: -0.4, x: 5, k: 2 },
  { p: 0.65, q: 0.1, t: 0.7, x: 2, k: 3 },
]
const box = (rest, opts) => formula({ vars: VARS, points: POINTS, placeholder: 'formula in p, q, x, t', ...opts, ...rest })

const PDF_LINES = [
  'f(x) &= P(\\underbrace{F\\,F \\cdots F}_{x - 1}\\,S)',
  '&= \\underbrace{q \\cdot q \\cdots q}_{x - 1} \\cdot p',
]
const CDF_LINES = [
  'F(x) &= P(X \\le x) = \\sum_{k=1}^{x} q^{k-1}p',
  '&= \\frac{a(1 - r^x)}{1 - r}, \\quad a = p,\\; r = q',
]
const MGF_LINES = [
  'm_X(t) &= E[e^{tX}] = \\sum_{x=1}^{\\infty} e^{tx}\\,q^{x-1}p',
  '&= \\frac{p}{q}\\sum_{x=1}^{\\infty} (qe^t)^x',
  '&= \\frac{p}{q} \\cdot \\frac{qe^t}{1 - qe^t}',
]

// A geometric X with a specific p, for deriving its cdf or MGF with numbers in.
function numbers() {
  const p = someP([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.9])
  return { P: dec(p), Q: dec(1 - p) }
}
const NUMBER_POINTS = [{ t: -1, x: 2 }, { t: 0.05, x: 4 }, { t: -0.3, x: 7 }]

export default {
  id: 'geometric-derive',
  name: 'Geometric derivations',
  description: '§3.4: derive the pdf, the cdf and the MGF; show the pdf sums to 1.',
  learn: {
    formulas: [
      { label: 'pdf', latex: 'f(x) = q^{x-1}p' },
      { label: 'Finite geometric series (on the sheet)', latex: '\\sum_{k=1}^{n} ar^{k-1} = \\frac{a(1-r^n)}{1-r}' },
      { label: 'Geometric series (on the sheet)', latex: '\\sum_{k=1}^{\\infty} ar^{k-1} = \\frac{a}{1-r}, \\; |r| < 1' },
      { label: 'cdf', latex: 'F(x) = \\frac{p(1-q^x)}{1-q} = 1 - q^x' },
      { label: 'MGF', latex: 'm_X(t) = \\frac{pe^t}{1 - qe^t}, \\quad t < -\\ln q' },
    ],
    how: [
      'pdf: X = x means x − 1 failures and then a success. The trials are independent, so multiply: q·q···q·p = q^(x−1)p.',
      'Show it is a pdf: every f(x) ≥ 0, and Σ q^(x−1)p is a geometric series with a = p, r = q, so it sums to p/(1 − q) = p/p = 1.',
      'cdf: F(x) = Σ from k = 1 to x of q^(k−1)p, a FINITE geometric series with a = p, r = q: p(1 − q^x)/(1 − q). Since 1 − q = p, F(x) = 1 − q^x.',
      'MGF: write E[e^(tX)] as Σ e^(tx) q^(x−1) p. Pull out p/q so the rest is Σ (qe^t)^x, a geometric series with a = r = qe^t.',
      'That series converges only when qe^t < 1, so the MGF exists for t < −ln q. Then m(t) = (p/q)·qe^t/(1 − qe^t) = pe^t/(1 − qe^t).',
      'On the test, write the lines in this order and name the series you use. The sheet gives you both series formulas.',
    ],
  },
  templates: [
    {
      id: 'pdf-box',
      generate() {
        return box(
          {
            ask: 'X is the trial of the first success. Derive the pdf: what goes in the box?',
            latex: derivation([...PDF_LINES.slice(0, 1), `${PDF_LINES[1]} = ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: 'f(x) = q^{x-1}p',
              text: 'x − 1 failures (each q) and then one success (p). Independent trials multiply.',
            },
          },
          { answer: 'q^(x-1)p', choices: ['q^xp', 'p^(x-1)q', 'q^(x-1)'] },
        )
      },
    },
    {
      id: 'show-pdf',
      generate() {
        const part = choice([
          { name: 'a', answer: 'p', choices: ['q', '1', 'pq'], line: 'first term a' },
          { name: 'r', answer: 'q', choices: ['p', 'q^x', 'qp'], line: 'ratio r' },
          { name: 'sum', answer: 'p/(1-q)', choices: ['1/(1-q)', 'q/(1-p)', 'p/(1-p)'], line: 'sum a/(1 − r) with p and q (before simplifying)', points: FREE },
        ])
        const lines = ['\\sum_{x=1}^{\\infty} f(x) &= \\sum_{x=1}^{\\infty} q^{x-1}p']
        if (part.name === 'a') lines.push(`&\\text{geometric series, } a = ${BOX}`)
        else if (part.name === 'r') lines.push(`&\\text{geometric series, } a = p,\\; r = ${BOX}`)
        else lines.push(`&= \\frac{a}{1 - r} = ${BOX} = 1`)
        return box(
          {
            ask: `Show the geometric pdf sums to 1. Fill in the ${part.line}.`,
            latex: derivation(lines),
            size: 'derivation',
            hint: {
              latex: '\\sum_{x=1}^{\\infty} q^{x-1}p = \\frac{p}{1-q} = \\frac{p}{p} = 1',
              text: 'The first term (x = 1) is p, and each next term multiplies by q. Since 1 − q = p, the sum is 1.',
            },
          },
          { answer: part.answer, choices: part.choices, ...(part.points ? { points: part.points } : {}) },
        )
      },
    },
    {
      id: 'cdf-series',
      generate() {
        return box(
          {
            ask: 'Derive the geometric cdf. Apply the finite series formula: what goes in the box?',
            latex: derivation([...CDF_LINES, `&= ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: '\\sum_{k=1}^{n} ar^{k-1} = \\frac{a(1-r^n)}{1-r}',
              text: 'Put a = p and r = q into the finite geometric series, with n = x terms.',
            },
          },
          { answer: 'p(1-q^x)/(1-q)', choices: ['p/(1-q)', 'p(1-q^(x-1))/(1-q)', 'q(1-p^x)/(1-p)'] },
        )
      },
    },
    {
      id: 'cdf-result',
      generate() {
        return box(
          {
            ask: 'Derive the geometric cdf. Simplify: what goes in the box?',
            latex: derivation([...CDF_LINES, '&= \\frac{p(1-q^x)}{1-q}', `&= ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: '1 - q = p \\;\\Rightarrow\\; \\frac{p(1-q^x)}{p} = 1 - q^x',
              text: 'The denominator 1 − q is exactly p, so it cancels the p in front.',
            },
          },
          { answer: '1-q^x', choices: ['q^x', '1-q^(x-1)', '1-p^x'] },
        )
      },
    },
    {
      id: 'mgf-sum',
      generate() {
        return box(
          {
            ask: 'Derive the geometric MGF. Start from the definition: what goes in the box?',
            latex: derivation([`m_X(t) &= E[e^{tX}] = \\sum_{x=1}^{\\infty} ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: 'E[H(X)] = \\sum_x H(x)\\,f(x)',
              text: 'An expected value weights each value by its probability: e^(tx) times f(x) = q^(x−1)p.',
            },
          },
          { answer: 'e^(tx)q^(x-1)p', choices: ['e^(tx)', 'e^tq^(x-1)p', 'xe^(tx)q^(x-1)p'] },
        )
      },
    },
    {
      id: 'mgf-factor',
      generate() {
        return box(
          {
            ask: 'Derive the geometric MGF. Pull out what does not depend on x: what goes in the box?',
            latex: derivation([MGF_LINES[0], `&= ${BOX}\\sum_{x=1}^{\\infty} (qe^t)^x`]),
            size: 'derivation',
            hint: {
              latex: 'e^{tx}q^{x-1}p = \\frac{p}{q}(qe^t)^x',
              text: 'q^(x−1) is q^x divided by q, so the constant in front is p/q.',
            },
          },
          { answer: 'p/q', choices: ['q/p', 'p', 'pq'] },
        )
      },
    },
    {
      id: 'mgf-series',
      generate() {
        return box(
          {
            ask: 'Derive the geometric MGF. Sum the series: what goes in the box?',
            latex: derivation([...MGF_LINES.slice(0, 2), `&= \\frac{p}{q} \\cdot ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: '\\sum_{x=1}^{\\infty} (qe^t)^x = \\frac{qe^t}{1 - qe^t}, \\quad qe^t < 1',
              text: 'A geometric series whose first term (x = 1) and ratio are both qe^t: first term over (1 − ratio).',
            },
          },
          { answer: 'qe^t/(1-qe^t)', choices: ['1/(1-qe^t)', 'qe^t/(1-e^t)', 'e^t/(1-qe^t)'] },
        )
      },
    },
    {
      id: 'mgf-result',
      generate() {
        return box(
          {
            ask: 'Derive the geometric MGF. Simplify: what goes in the box?',
            latex: derivation([...MGF_LINES, `&= ${BOX}`]),
            size: 'derivation',
            hint: {
              latex: 'm_X(t) = \\frac{pe^t}{1 - qe^t}, \\quad t < -\\ln q',
              text: 'The q in front cancels the q in qe^t, leaving pe^t over 1 − qe^t.',
            },
          },
          { answer: 'pe^t/(1-qe^t)', choices: ['p/(1-qe^t)', 'pe^t/(1-pe^t)', 'qe^t/(1-pe^t)'] },
        )
      },
    },
    {
      id: 'mgf-domain',
      generate() {
        const pick = lettered({ latex: 't < -\\ln q' }, [{ latex: 't > -\\ln q' }, { latex: 't < \\ln q' }, { latex: 't < q' }])
        return {
          ask: 'Derive the geometric MGF. For which t does the series converge?',
          latex: derivation(MGF_LINES.slice(0, 2)),
          size: 'derivation',
          ...pick,
          placeholder: 'a, b, c or d',
          hint: {
            latex: 'qe^t < 1 \\iff e^t < \\tfrac{1}{q} \\iff t < -\\ln q',
            text: 'A geometric series converges only when its ratio is below 1. Here the ratio is qe^t.',
          },
        }
      },
    },
    {
      id: 'why',
      generate() {
        const STEPS = [
          {
            step: 'f(x) = q \\cdot q \\cdots q \\cdot p = q^{x-1}p',
            right: 'The trials are independent, so the probabilities multiply.',
          },
          {
            step: '\\sum_{x=1}^{\\infty} q^{x-1}p = \\frac{p}{1-q} = 1',
            right: 'It is a geometric series with a = p and r = q.',
          },
          {
            step: '\\sum_{k=1}^{x} q^{k-1}p = \\frac{p(1-q^x)}{1-q}',
            right: 'It is a finite geometric series with a = p and r = q.',
          },
          {
            step: 'm_X(t) = E[e^{tX}] = \\sum_{x=1}^{\\infty} e^{tx}\\,q^{x-1}p',
            right: 'Definition of the MGF: the expected value of e^(tX), summed against the pdf.',
          },
          {
            step: '\\frac{p(1-q^x)}{1-q} = 1 - q^x',
            right: 'Since q = 1 − p, the denominator 1 − q equals p and cancels.',
          },
        ]
        const s = choice(STEPS)
        const wrong = STEPS.filter(o => o !== s).map(o => o.right).sort(() => Math.random() - 0.5)
        const pick = lettered(s.right, wrong)
        return {
          ask: 'Geometric derivations: why is this step true?',
          latex: s.step,
          size: 'small',
          ...pick,
          placeholder: 'a, b, c or d',
          hint: { latex: s.step, text: s.right },
        }
      },
    },
    {
      id: 'mgf-numbers',
      generate() {
        const { P, Q } = numbers()
        return formula({
          ask: `X is geometric with p = ${P}. Derive its MGF and type m_X(t).`,
          latex: 'm_X(t) = \\,?',
          vars: ['t'],
          points: NUMBER_POINTS,
          answer: `${P}e^t/(1-${Q}e^t)`,
          choices: [`${P}/(1-${Q}e^t)`, `${P}e^t/(1-${P}e^t)`, `${Q}e^t/(1-${P}e^t)`],
          placeholder: 'm(t) in terms of t',
          hint: {
            latex: 'm_X(t) = \\frac{pe^t}{1 - qe^t}',
            text: `Sum e^(tx) q^(x−1) p as a geometric series in qe^t; here q = ${Q}.`,
          },
        })
      },
    },
    {
      id: 'cdf-numbers',
      generate() {
        const { P, Q } = numbers()
        return formula({
          ask: `X is geometric with p = ${P}. Derive its cdf and type F(x) for x = 1, 2, 3, ...`,
          latex: 'F(x) = \\,?',
          vars: ['x'],
          points: NUMBER_POINTS,
          answer: `1-${Q}^x`,
          choices: [`${Q}^x`, `1-${Q}^(x-1)`, `1-${P}^x`],
          placeholder: 'F(x) in terms of x',
          hint: {
            latex: 'F(x) = 1 - q^x',
            text: `Add q^(k−1)p for k = 1 to x (a finite geometric series), or note X > x means x failures: q^x with q = ${Q}.`,
          },
        })
      },
    },
  ],
}
