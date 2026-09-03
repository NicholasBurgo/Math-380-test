import { randInt, choice } from '../../engine/rand.js'
import { fmt, randProbs, pdfTable } from './util.js'

const XS = [0, 1, 2, 3, 4]

export default {
  id: 'discrete-pdf',
  name: 'Discrete pdfs & cdfs',
  description: '§3.1–3.2: pdfs, cdfs, geometric patterns.',
  learn: {
    formulas: [
      { label: 'pdf sums to 1', latex: '\\textstyle\\sum_{\\text{all } x} f(x) = 1' },
      { label: 'cdf', latex: 'F(x) = P(X \\le x)' },
      { label: 'At least, via complement', latex: 'P(X \\ge k) = 1 - P(X \\le k-1)' },
      { label: 'First fusion (p = 1/2)', latex: 'f(y) = \\left(\\tfrac{1}{2}\\right)^y' },
    ],
    how: [
      'Missing table value: everything must sum to 1, so subtract what is shown.',
      'P(X ≤ k): add the table cells from 0 up through k.',
      'P(X ≥ k): add from k to the end, or take 1 minus the cells below k.',
      'Between a and b (inclusive): add just those cells.',
      'First success on trial k with p = 1/2: (1/2)^k. Needing k or more trials: (1/2)^(k-1).',
    ],
  },
  templates: [
    {
      id: 'missing-value',
      generate() {
        const ps = randProbs(5)
        const hide = randInt(0, 4)
        const shownSum = ps.reduce((a, b) => a + b, 0) - ps[hide]
        return {
          ask: 'Probabilities must sum to 1. Find the missing value.',
          latex: pdfTable(XS, ps, hide),
          size: 'small',
          answer: ps[hide] / 100,
          answerLatex: fmt(ps[hide] / 100),
          placeholder: 'e.g. 0.15',
          tolerance: 0.005,
          hint: {
            latex: '\\textstyle\\sum f(x) = 1',
            text: `Add the shown probabilities (${fmt(shownSum / 100)}) and subtract from 1.`,
          },
          distractors: [shownSum / 100],
        }
      },
    },
    {
      id: 'table-prob',
      generate() {
        const ps = randProbs(5)
        const k = randInt(1, 3)
        const cum = to => ps.slice(0, to + 1).reduce((a, b) => a + b, 0)
        const pick = choice([
          { ask: `Find P(X ≤ ${k}).`, val: cum(k) },
          { ask: `Find P(X ≥ ${k}).`, val: 100 - cum(k - 1) },
          { ask: `Find P(${k} ≤ X ≤ ${k + 1}).`, val: ps[k] + ps[k + 1] },
        ])
        return {
          ask: pick.ask,
          latex: pdfTable(XS, ps),
          size: 'small',
          answer: pick.val / 100,
          answerLatex: fmt(pick.val / 100),
          placeholder: 'e.g. 0.85',
          tolerance: 0.005,
          hint: {
            latex: 'F(x) = P(X \\le x)',
            text: '≤ k: add cells 0 through k. ≥ k: add k to the end (or 1 minus what is below k). Between: just those cells.',
          },
          distractors: [1 - pick.val / 100],
        }
      },
    },
    {
      id: 'geometric',
      generate() {
        const k = randInt(2, 5)
        const atLeast = Math.random() < 0.5
        const power = atLeast ? k - 1 : k
        const denom = Math.pow(2, power)
        const otherDenom = Math.pow(2, atLeast ? k : k - 1)
        return {
          ask: 'Each cell fuses with probability 1/2.',
          text: 'Y is the number of cells needed to obtain the first fusion.',
          latex: atLeast ? `P(Y \\ge ${k}) = \\,?` : `P(Y = ${k}) = \\,?`,
          answer: 1 / denom,
          answerLatex: `\\frac{1}{${denom}}`,
          placeholder: 'e.g. 1/8',
          tolerance: 1e-4,
          hint: {
            latex:
              'P(Y = k) = \\left(\\tfrac{1}{2}\\right)^k, \\quad P(Y \\ge k) = \\left(\\tfrac{1}{2}\\right)^{k-1}',
            text: atLeast
              ? `Needing ${k} or more means surviving the first ${k - 1} tries: (1/2) multiplied ${k - 1} times.`
              : `Exactly ${k} cells: ${k} halvings in a row.`,
          },
          distractors: [1 / otherDenom, 1 - 1 / denom],
        }
      },
    },
  ],
}
