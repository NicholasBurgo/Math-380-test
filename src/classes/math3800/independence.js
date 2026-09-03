import { randInt, choice } from '../../engine/rand.js'
import { fmt } from './util.js'

export default {
  id: 'independence',
  name: 'Independence',
  description: '§2.3: multiplication rule for independent events.',
  learn: {
    formulas: [
      { label: 'Independence test', latex: 'P(A \\cap B) = P(A)\\,P(B)' },
      {
        label: 'All n independent events',
        latex: 'P(A_1 \\cap \\cdots \\cap A_n) = P(A_1) \\cdots P(A_n)',
      },
      { label: 'At least one', latex: 'P(\\text{at least one}) = 1 - P(\\text{none})' },
    ],
    how: [
      'Independent events multiply: all n work means p times itself n times.',
      'Checking independence: multiply P(A)P(B) and compare to the given P(A and B). Equal means independent.',
      '"At least one" goes through the back door: find P(none) first, then take 1 minus it.',
    ],
  },
  templates: [
    {
      id: 'all-work',
      generate() {
        const n = randInt(2, 4)
        const p = choice([70, 80, 90, 95])
        const ans = Math.pow(p / 100, n)
        return {
          ask: 'Independent events multiply.',
          text: `${n} computer systems are each ${p}% reliable and operate independently.`,
          latex: `P(\\text{all ${n} operational}) = \\,?`,
          answer: ans,
          answerLatex: `${fmt(p / 100)}^{${n}} = ${fmt(ans)}`,
          placeholder: 'e.g. 0.729',
          tolerance: 0.005,
          hint: {
            latex: 'P(\\text{all}) = p^n',
            text: `Independent: multiply the reliability by itself once per system: ${fmt(p / 100)} × ${fmt(p / 100)} × ...`,
          },
          distractors: [p / 100, 1 - ans, Math.min(0.99, (n * p) / 100)],
        }
      },
    },
    {
      id: 'indep-check',
      generate() {
        const pa = choice([20, 30, 40, 50])
        const pb = choice([20, 30, 40, 60])
        const prod = (pa * pb) / 100
        const indep = Math.random() < 0.5
        let both = prod
        if (!indep) {
          const shift = choice([-6, -4, 4, 6, 8])
          both = Math.max(2, Math.min(Math.min(pa, pb) - 2, prod + shift))
          if (both === prod) both = prod + 2
        }
        const yes = both === prod
        return {
          ask: 'Independent iff P(A ∩ B) = P(A)P(B).',
          text: `P(A) = ${fmt(pa / 100)}, P(B) = ${fmt(pb / 100)}, P(A ∩ B) = ${fmt(both / 100)}.`,
          latex: `\\text{Are } A \\text{ and } B \\text{ independent?}`,
          answer: yes ? 'yes' : 'no',
          answerLatex: `\\text{${yes ? 'yes' : 'no'}} \\;\\; [P(A)P(B) = ${fmt(prod / 100)}]`,
          placeholder: 'yes / no',
          hint: {
            latex: 'P(A \\cap B) \\stackrel{?}{=} P(A)\\,P(B)',
            text: 'Multiply P(A)P(B). If it matches the given joint probability exactly, independent; otherwise not.',
          },
        }
      },
    },
    {
      id: 'at-least-one-indep',
      generate() {
        const n = randInt(2, 3)
        const p = choice([10, 20, 25, 30])
        const ans = 1 - Math.pow(1 - p / 100, n)
        return {
          ask: 'At least one = 1 − none.',
          text: `Each of ${n} independent samples is contaminated with probability ${fmt(p / 100)}.`,
          latex: `P(\\text{at least one contaminated}) = \\,?`,
          answer: ans,
          answerLatex: `1 - ${fmt(1 - p / 100)}^{${n}} = ${fmt(ans)}`,
          placeholder: 'e.g. 0.36',
          tolerance: 0.005,
          hint: {
            latex: 'P(\\text{at least one}) = 1 - (1-p)^n',
            text: 'P(none) = (1-p) multiplied n times. Then flip it: 1 minus that.',
          },
          distractors: [Math.pow(1 - p / 100, n), Math.min(0.99, (n * p) / 100), 1 - ans],
        }
      },
    },
  ],
}
