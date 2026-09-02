import { randInt, choice } from '../../engine/rand.js'
import { fmt } from './util.js'

export default {
  id: 'independence',
  name: 'Independence',
  description: '§2.3 — multiplication rule for independent events.',
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
        }
      },
    },
  ],
}
