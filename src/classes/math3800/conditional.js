import { randInt, choice } from '../../engine/rand.js'
import { fmt, gcd } from './util.js'

export default {
  id: 'conditional',
  name: 'Conditional probability',
  description: '§2.2: P(B|A) = P(A∩B)/P(A).',
  learn: {
    formulas: [
      { label: 'Conditional probability', latex: 'P(B \\mid A) = \\dfrac{P(A \\cap B)}{P(A)}' },
      { label: 'Multiplication (chain) rule', latex: 'P(A \\cap B) = P(A)\\,P(B \\mid A)' },
    ],
    how: [
      'The condition (after the bar) becomes your new whole: divide the joint probability by it.',
      'Watch the direction: P(B|A) divides by P(A), but P(A|B) divides by P(B).',
      'Need the joint "both" probability? Multiply along the chain: P(A) times P(B|A).',
    ],
  },
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
          hint: {
            latex: 'P(B \\mid A) = \\dfrac{P(A \\cap B)}{P(A)}',
            text: 'Divide the "both" percentage by the condition percentage. The condition is the new denominator.',
          },
          distractors: [both / 100, (pa - both) / 100, (pa * both) / 10000],
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
          hint: {
            latex: 'P(A \\cap B) = P(A)\\,P(B \\mid A)',
            text: 'Chain them: the probability of A, times the probability of B once A has happened.',
          },
          distractors: [cond / 100, Math.min(0.99, (pa + cond) / 100), pa / 100],
        }
      },
    },
  ],
}
