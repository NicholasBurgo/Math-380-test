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
  description: '§3.3 — mean, variance, standard deviation.',
  templates: [
    {
      id: 'mean-table',
      generate() {
        const xs = distinctXs(4, 0, 9)
        const ps = randProbs(4)
        const mean = xs.reduce((s, x, i) => s + (x * ps[i]) / 100, 0)
        return {
          ask: 'Find E(X).',
          latex: pdfTable(xs, ps),
          size: 'small',
          answer: mean,
          answerLatex: fmt(mean),
          placeholder: 'e.g. 3.2',
          tolerance: 0.005,
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
        return {
          ask: 'Rules for expectation.',
          text: `E(X) = ${a} and E(Y) = ${b}.`,
          latex: `E[${c}X - ${d}Y${eTerm}] = \\,?`,
          answer: c * a - d * b + e,
          answerLatex: `${c}(${a}) - ${d}(${b})${eTerm} = ${c * a - d * b + e}`,
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
          ask: 'Rules for variance — X, Y independent.',
          text: `Var X = ${vX} and Var Y = ${vY}.`,
          latex: `\\operatorname{Var}[${c}X - ${d}Y${eTerm}] = \\,?`,
          answer: ans,
          answerLatex: `${c}^2(${vX}) + ${d}^2(${vY}) = ${ans}`,
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
        }
      },
    },
  ],
}
