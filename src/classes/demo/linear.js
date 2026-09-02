import { randInt } from '../../engine/rand.js'

export default {
  id: 'linear',
  name: 'Linear equations',
  description: 'Solve ax + b = c for x. Integer answers.',
  templates: [
    {
      id: 'one-step',
      generate() {
        const a = randInt(2, 12)
        let x = randInt(-9, 9)
        if (x === 0) x = 4
        return {
          ask: 'Solve for x.',
          latex: `${a}x = ${a * x}`,
          answer: x,
          answerLatex: `x = ${x}`,
          placeholder: 'x = ?',
        }
      },
    },
    {
      id: 'two-step',
      generate() {
        const a = randInt(2, 9)
        let x = randInt(-9, 9)
        if (x === 0) x = 3
        const b = randInt(-12, 12)
        const c = a * x + b
        const bTerm = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`
        return {
          ask: 'Solve for x.',
          latex: `${a}x${bTerm} = ${c}`,
          answer: x,
          answerLatex: `x = ${x}`,
          placeholder: 'x = ?',
        }
      },
    },
  ],
}
