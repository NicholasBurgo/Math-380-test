import { randInt, choice } from '../../../engine/rand.js'
import { dec, num, someP, tolFor, probs } from './util.js'

// Independent trials until the first success. The text always states p, or
// (for the digits example from the notes) the set of digits that count.
const STORIES = [
  { lead: 'A basketball player makes each free throw with probability', x: 'the number of shots needed to make the first one' },
  { lead: 'An oil company strikes oil at each new well with probability', x: 'the number of wells drilled to get the first strike' },
  { lead: 'A salesperson closes a sale on each call with probability', x: 'the number of calls needed for the first sale' },
  { lead: 'Each scratch ticket wins a prize with probability', x: 'the number of tickets bought to get the first winner' },
  { lead: 'Each visitor to a website signs up with probability', x: 'the number of visitors until the first sign-up' },
  { lead: 'A machine produces a defective part with probability', x: 'the number of parts made until the first defective one' },
]

function story(p) {
  if (Math.random() < 0.3) {
    const m = randInt(1, 4)
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5).slice(0, m).sort((a, b) => a - b)
    return {
      p: m / 10,
      text: `Choosing digits at random (0 to 9), X is the number of trials until we first get ${m === 1 ? `a ${digits[0]}` : `a digit in {${digits.join(', ')}}`}.`,
    }
  }
  const s = choice(STORIES)
  return { p, text: `${s.lead} ${dec(p)}, independently. X is ${s.x}.` }
}

const HINT = {
  latex: 'f(x) = q^{x-1}p, \\quad F(x) = 1 - q^x, \\quad P(X > x) = q^x',
  text: 'X = x means x − 1 failures, then a success. "More than x" means the first x trials all fail.',
}

export default {
  id: 'geometric',
  name: 'Geometric distribution',
  description: '§3.4: trial of the first success; pdf, cdf, mean and variance.',
  learn: {
    formulas: [
      { label: 'pdf (q = 1 − p)', latex: 'f(x) = q^{x-1}p, \\quad x = 1, 2, 3, \\ldots' },
      { label: 'cdf', latex: 'F(x) = P(X \\le x) = 1 - q^x' },
      { label: 'Tail', latex: 'P(X > x) = q^x, \\quad P(X \\ge x) = q^{x-1}' },
      { label: 'Mean and variance', latex: 'E[X] = \\frac{1}{p}, \\quad \\operatorname{Var}X = \\frac{q}{p^2}' },
    ],
    how: [
      'Geometric: independent trials, same p each time, and X counts the trials up to and including the first success.',
      'Exactly x: x − 1 failures in a row, then one success, so q^(x−1)p.',
      'More than x: the first x trials all failed, so q^x. At least x: the first x − 1 failed, so q^(x−1).',
      'At most x is the cdf: 1 − q^x. Fewer than x is 1 − q^(x−1).',
      'Between a and b (inclusive): q^(a−1) − q^b, the chance of getting past trial a − 1 but not past trial b.',
      'Mean 1/p (choosing digits until the first zero takes 10 tries on average); variance q/p²; standard deviation √q / p.',
    ],
  },
  templates: [
    {
      id: 'pmf',
      generate() {
        const s = story(someP())
        const p = s.p
        const q = 1 - p
        const k = randInt(1, 7)
        const ans = Math.pow(q, k - 1) * p
        return {
          ask: 'Probability the first success is on this trial.',
          text: s.text,
          latex: `P(X = ${k}) = \\,?`,
          answer: ans,
          answerLatex: `(${dec(q)})^{${k - 1}}(${dec(p)}) = ${num(ans)}`,
          placeholder: 'e.g. 0.147',
          tolerance: tolFor(ans),
          hint: HINT,
          distractors: probs(Math.pow(q, k) * p, Math.pow(p, k - 1) * q, Math.pow(q, k - 1)),
        }
      },
    },
    {
      id: 'cdf',
      generate() {
        const s = story(someP())
        const p = s.p
        const q = 1 - p
        const k = randInt(2, 7)
        const a = randInt(2, 4)
        const b = a + randInt(1, 3)
        const ev = choice([
          { latex: `P(X \\le ${k})`, v: 1 - q ** k, wrong: [1 - q ** (k - 1), q ** k, q ** (k - 1) * p] },
          { latex: `P(X > ${k})`, v: q ** k, wrong: [q ** (k - 1), 1 - q ** k, q ** (k + 1)] },
          { latex: `P(X \\ge ${k})`, v: q ** (k - 1), wrong: [q ** k, 1 - q ** (k - 1), q ** (k - 1) * p] },
          { latex: `P(X < ${k})`, v: 1 - q ** (k - 1), wrong: [1 - q ** k, q ** (k - 1), 1 - q ** (k - 2)] },
          { latex: `P(${a} \\le X \\le ${b})`, v: q ** (a - 1) - q ** b, wrong: [q ** a - q ** b, q ** (a - 1) - q ** (b - 1), 1 - q ** b] },
        ])
        return {
          ask: 'Use the geometric cdf (or a run of failures).',
          text: s.text,
          latex: `${ev.latex} = \\,?`,
          answer: ev.v,
          answerLatex: `${num(ev.v)}`,
          placeholder: 'e.g. 0.76',
          tolerance: tolFor(ev.v),
          hint: HINT,
          distractors: probs(...ev.wrong),
        }
      },
    },
    {
      id: 'mean-var',
      generate() {
        const s = story(someP([0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]))
        const p = s.p
        const q = 1 - p
        const ask = choice([
          { latex: 'E[X] = \\,?', v: 1 / p, shown: `\\frac{1}{${dec(p)}} = ${num(1 / p)}`, wrong: [q / p, 1 / q, p] },
          { latex: '\\operatorname{Var}X = \\,?', v: q / p ** 2, shown: `\\frac{${dec(q)}}{${dec(p)}^2} = ${num(q / p ** 2)}`, wrong: [q / p, 1 / p, 1 / p ** 2] },
          { latex: '\\sigma = \\,?', v: Math.sqrt(q) / p, shown: `\\frac{\\sqrt{${dec(q)}}}{${dec(p)}} = ${num(Math.sqrt(q) / p)}`, wrong: [q / p ** 2, q / p, 1 / p] },
        ])
        return {
          ask: 'Geometric mean and variance.',
          text: s.text,
          latex: ask.latex,
          answer: ask.v,
          answerLatex: ask.shown,
          placeholder: 'e.g. 2.5',
          tolerance: Math.max(0.005, Math.abs(ask.v) * 0.002),
          hint: {
            latex: 'E[X] = \\frac{1}{p}, \\quad \\operatorname{Var}X = \\frac{q}{p^2}, \\quad \\sigma = \\frac{\\sqrt{q}}{p}',
            text: 'On average it takes 1/p trials to get the first success. The variance is q/p², and σ is its square root.',
          },
          distractors: ask.wrong.filter(w => Math.abs(w - ask.v) > 1e-9),
        }
      },
    },
  ],
}
