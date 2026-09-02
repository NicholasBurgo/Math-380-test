import { randInt, choice } from '../../engine/rand.js'
import { fmt, randProbs, pdfTable } from './util.js'

const XS = [0, 1, 2, 3, 4]

export default {
  id: 'discrete-pdf',
  name: 'Discrete pdfs & cdfs',
  description: '§3.1–3.2: pdfs, cdfs, geometric patterns.',
  templates: [
    {
      id: 'missing-value',
      generate() {
        const ps = randProbs(5)
        const hide = randInt(0, 4)
        return {
          ask: 'Probabilities must sum to 1. Find the missing value.',
          latex: pdfTable(XS, ps, hide),
          size: 'small',
          answer: ps[hide] / 100,
          answerLatex: fmt(ps[hide] / 100),
          placeholder: 'e.g. 0.15',
          tolerance: 0.005,
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
        return {
          ask: 'Each cell fuses with probability 1/2.',
          text: 'Y is the number of cells needed to obtain the first fusion.',
          latex: atLeast ? `P(Y \\ge ${k}) = \\,?` : `P(Y = ${k}) = \\,?`,
          answer: 1 / denom,
          answerLatex: `\\frac{1}{${denom}}`,
          placeholder: 'e.g. 1/8',
          tolerance: 1e-4,
        }
      },
    },
  ],
}
