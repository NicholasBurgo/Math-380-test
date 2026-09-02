import { randInt } from '../../engine/rand.js'

export default {
  id: 'arithmetic',
  name: 'Mental arithmetic',
  description: 'Add, subtract, multiply — speed reps.',
  templates: [
    {
      id: 'add-2digit',
      generate() {
        const a = randInt(12, 89)
        const b = randInt(11, 78)
        return { ask: 'Compute.', latex: `${a} + ${b} = \\,?`, answer: a + b }
      },
    },
    {
      id: 'sub-2digit',
      generate() {
        const a = randInt(12, 89)
        const b = randInt(11, 78)
        const hi = Math.max(a, b)
        const lo = Math.min(a, b)
        return { ask: 'Compute.', latex: `${hi} - ${lo} = \\,?`, answer: hi - lo }
      },
    },
    {
      id: 'mult-table',
      generate() {
        const a = randInt(3, 12)
        const b = randInt(3, 19)
        return { ask: 'Compute.', latex: `${a} \\times ${b} = \\,?`, answer: a * b }
      },
    },
  ],
}
