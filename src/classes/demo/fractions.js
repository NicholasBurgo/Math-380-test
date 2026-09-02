import { randInt } from '../../engine/rand.js'

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

export default {
  id: 'fractions',
  name: 'Fraction addition',
  description: 'Add two fractions, answer as one fraction.',
  templates: [
    {
      id: 'add-proper',
      generate() {
        const b = randInt(2, 9)
        const d = randInt(2, 9)
        const a = randInt(1, b - 1)
        const c = randInt(1, d - 1)
        let p = a * d + c * b
        let q = b * d
        const g = gcd(p, q)
        p /= g
        q /= g
        return {
          ask: 'Add. Give one simplified fraction.',
          latex: `\\frac{${a}}{${b}} + \\frac{${c}}{${d}} = \\,?`,
          answer: p / q,
          answerLatex: q === 1 ? `${p}` : `\\frac{${p}}{${q}}`,
          placeholder: 'e.g. 7/6',
        }
      },
    },
  ],
}
