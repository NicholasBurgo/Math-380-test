import { randInt, choice, shuffle } from '../../engine/rand.js'
import { fmt, randProbs, pdfTable } from './util.js'

function distinctXs(count, lo, hi) {
  const pool = []
  for (let i = lo; i <= hi; i++) pool.push(i)
  return shuffle(pool)
    .slice(0, count)
    .sort((a, b) => a - b)
}

export default {
  id: 'expectation',
  name: 'Expectation & variance',
  description: '§3.3: mean, variance, standard deviation.',
  learn: {
    formulas: [
      { label: 'Expected value', latex: 'E(X) = \\textstyle\\sum x\\,f(x)' },
      { label: 'Linearity of expectation', latex: 'E(aX + bY + c) = a\\,E(X) + b\\,E(Y) + c' },
      { label: 'Variance shortcut', latex: '\\operatorname{Var} X = E(X^2) - [E(X)]^2' },
      {
        label: 'Variance rules (X, Y independent)',
        latex: '\\operatorname{Var}(aX + bY + c) = a^2\\operatorname{Var}X + b^2\\operatorname{Var}Y',
      },
      { label: 'Standard deviation', latex: '\\sigma = \\sqrt{\\operatorname{Var} X}' },
    ],
    how: [
      'E(X): multiply each value by its probability and add. It is a weighted average, never the plain average of the x values.',
      'Linearity: coefficients slide out of E unchanged; a lone constant just adds on.',
      'Variance by shortcut: build E(X²) first (square each x, weight, sum), then subtract the mean squared.',
      'Variance rules: coefficients come out SQUARED, the minus sign squares away to plus, and an added constant vanishes.',
      'Standard deviation is the square root of the variance, back in the original units.',
    ],
  },
  templates: [
    {
      id: 'mean-table',
      generate() {
        const xs = distinctXs(4, 0, 9)
        const ps = randProbs(4)
        const mean = xs.reduce((s, x, i) => s + (x * ps[i]) / 100, 0)
        const plainAvg = xs.reduce((a, b) => a + b, 0) / xs.length
        return {
          ask: 'Find E(X).',
          latex: pdfTable(xs, ps),
          size: 'small',
          answer: mean,
          answerLatex: fmt(mean),
          placeholder: 'e.g. 3.2',
          tolerance: 0.005,
          hint: {
            latex: 'E(X) = \\textstyle\\sum x\\,f(x)',
            text: 'Weight each x by its probability and add them. Do not average the x values evenly.',
          },
          distractors: [plainAvg],
        }
      },
    },
    {
      id: 'linearity',
      generate() {
        const a = randInt(-4, 8)
        const b = randInt(-4, 8)
        const c = randInt(2, 5)
        const d = randInt(2, 5)
        const e = randInt(-10, 10)
        const eTerm = e === 0 ? '' : e > 0 ? ` + ${e}` : ` - ${-e}`
        const ans = c * a - d * b + e
        return {
          ask: 'Rules for expectation.',
          text: `E(X) = ${a} and E(Y) = ${b}.`,
          latex: `E[${c}X - ${d}Y${eTerm}] = \\,?`,
          answer: ans,
          answerLatex: `${c}(${a}) - ${d}(${b})${eTerm} = ${ans}`,
          hint: {
            latex: 'E(aX - bY + c) = a\\,E(X) - b\\,E(Y) + c',
            text: 'Slide the coefficients out unchanged and keep the minus sign on the Y term.',
          },
          distractors: [c * a + d * b + e, c * a - d * b - e],
        }
      },
    },
    {
      id: 'var-rules',
      generate() {
        const vX = randInt(2, 10)
        const vY = randInt(2, 8)
        const c = randInt(2, 4)
        const d = randInt(2, 4)
        const e = randInt(-9, 9)
        const eTerm = e === 0 ? '' : e > 0 ? ` + ${e}` : ` - ${-e}`
        const ans = c * c * vX + d * d * vY
        return {
          ask: 'Rules for variance: X, Y independent.',
          text: `Var X = ${vX} and Var Y = ${vY}.`,
          latex: `\\operatorname{Var}[${c}X - ${d}Y${eTerm}] = \\,?`,
          answer: ans,
          answerLatex: `${c}^2(${vX}) + ${d}^2(${vY}) = ${ans}`,
          hint: {
            latex: '\\operatorname{Var}(aX - bY + c) = a^2\\operatorname{Var}X + b^2\\operatorname{Var}Y',
            text: 'Square the coefficients, ADD both terms (the minus squares away), and drop the constant entirely.',
          },
          distractors: [c * vX + d * vY, c * c * vX - d * d * vY, ans + e],
        }
      },
    },
    {
      id: 'var-table',
      generate() {
        const xs = [0, 1, 2]
        const ps = randProbs(3)
        const mean = xs.reduce((s, x, i) => s + (x * ps[i]) / 100, 0)
        const ex2 = xs.reduce((s, x, i) => s + (x * x * ps[i]) / 100, 0)
        const v = ex2 - mean * mean
        return {
          ask: 'Find Var X.',
          latex: pdfTable(xs, ps),
          size: 'small',
          answer: v,
          answerLatex: `E(X^2) - [E(X)]^2 = ${fmt(ex2)} - ${fmt(mean)}^2 = ${fmt(v)}`,
          placeholder: 'e.g. 0.49',
          tolerance: 0.005,
          hint: {
            latex: '\\operatorname{Var}X = E(X^2) - [E(X)]^2',
            text: 'E(X²): square each x, weight by its probability, sum. Then subtract the squared mean.',
          },
          distractors: [ex2, mean * mean, Math.sqrt(Math.max(v, 0))],
        }
      },
    },
    {
      id: 'std-dev',
      generate() {
        const sd = randInt(2, 9)
        return {
          ask: 'Standard deviation.',
          text: `Var X = ${sd * sd}.`,
          latex: `\\sigma = \\,?`,
          answer: sd,
          hint: {
            latex: '\\sigma = \\sqrt{\\operatorname{Var}X}',
            text: 'Take the square root of the variance to get back to the original units.',
          },
          distractors: [sd * sd, sd + 1, Math.max(1, Math.round(sd / 2))],
        }
      },
    },
  ],
}
