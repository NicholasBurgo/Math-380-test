import { randInt, choice } from '../../engine/rand.js'
import { fmt, gcd } from './util.js'

export default {
  id: 'conditional',
  name: 'Conditional probability',
  description: '§2.2 — P(B|A) = P(A∩B)/P(A).',
  templates: [
    {
      id: 'formula',
      generate() {
        const f = choice([
          { A: 'lead', B: 'mercury', noun: 'a sample contains' },
          { A: 'anaerobic bacteria', B: 'multiple strains', noun: 'an infection involves' },
        ])
        const pa = randInt(20, 60)
        const both = randInt(6, pa - 5)
        const g = gcd(both, pa)
        const ans = both / pa
        return {
          ask: 'Conditional probability.',
          text: `${pa}% of the time ${f.noun} ${f.A}; ${both}% of the time it involves both ${f.A} and ${f.B}.`,
          latex: `P(\\text{${f.B}} \\mid \\text{${f.A}}) = \\,?`,
          answer: ans,
          answerLatex: `\\frac{${both / g}}{${pa / g}} \\approx ${fmt(ans, 3)}`,
          placeholder: 'e.g. 8/19 or 0.421',
          tolerance: 0.005,
        }
      },
    },
    {
      id: 'multiply',
      generate() {
        const f = choice([
          { A: 'anaerobic', B: 'polymicrobic' },
          { A: 'alcohol', B: 'speeding' },
        ])
        const pa = randInt(20, 60)
        const cond = choice([30, 40, 50, 60, 70, 80])
        const ans = (pa * cond) / 10000
        return {
          ask: 'Multiply along the chain.',
          text: `P(${f.A}) = ${fmt(pa / 100)} and P(${f.B} | ${f.A}) = ${fmt(cond / 100)}.`,
          latex: `P(\\text{${f.A}} \\cap \\text{${f.B}}) = \\,?`,
          answer: ans,
          answerLatex: `${fmt(pa / 100)} \\times ${fmt(cond / 100)} = ${fmt(ans)}`,
          placeholder: 'e.g. 0.343',
          tolerance: 0.005,
        }
      },
    },
  ],
}
