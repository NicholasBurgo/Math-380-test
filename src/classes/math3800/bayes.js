import { choice } from '../../engine/rand.js'
import { fmt } from './util.js'

export default {
  id: 'bayes',
  name: "Bayes' theorem",
  description: '§2.4 — reversing conditional probabilities.',
  templates: [
    {
      id: 'two-event',
      generate() {
        const f = choice([
          { A: 'alcohol', B: 'speeding', prior: 'of accidents involve' },
          { A: 'the disease', B: 'a positive test', prior: 'of patients have' },
        ])
        const pa = choice([20, 25, 30, 40])
        const hit = choice([60, 70, 80, 90])
        const fp = choice([5, 10, 20])
        const num = (hit / 100) * (pa / 100)
        const den = num + (fp / 100) * (1 - pa / 100)
        const ans = num / den
        return {
          ask: "Bayes' theorem.",
          text: `${pa}% ${f.prior} ${f.A}. If ${f.A} is involved, ${f.B} occurs ${hit}% of the time; otherwise ${f.B} occurs only ${fp}% of the time.`,
          latex: `P(\\text{${f.A}} \\mid \\text{${f.B}}) = \\,?`,
          answer: ans,
          answerLatex: `\\frac{${fmt(num)}}{${fmt(den)}} \\approx ${fmt(ans, 3)}`,
          placeholder: 'e.g. 0.824',
          tolerance: 0.005,
        }
      },
    },
  ],
}
