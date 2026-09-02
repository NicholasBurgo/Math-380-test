import { randInt, choice } from '../../engine/rand.js'
import { factorial } from './util.js'

export default {
  id: 'counting',
  name: 'Counting',
  description: '§1.3: permutations, combinations, multiplication principle.',
  templates: [
    {
      id: 'permutation',
      generate() {
        const n = randInt(5, 9)
        const r = randInt(2, Math.min(4, n - 1))
        const answer = factorial(n) / factorial(n - r)
        if (Math.random() < 0.5) {
          return { ask: 'Compute.', latex: `{}_{${n}}P_{${r}} = \\,?`, answer }
        }
        return {
          ask: 'Order matters.',
          text: `In how many ways can ${r} of ${n} students be arranged in a line?`,
          latex: `\\text{\\# arrangements} = \\,?`,
          answer,
          answerLatex: `{}_{${n}}P_{${r}} = ${answer}`,
        }
      },
    },
    {
      id: 'combination',
      generate() {
        const n = randInt(5, 10)
        const r = randInt(2, 4)
        const answer = factorial(n) / (factorial(r) * factorial(n - r))
        if (Math.random() < 0.5) {
          return { ask: 'Compute.', latex: `\\binom{${n}}{${r}} = \\,?`, answer }
        }
        return {
          ask: 'Order does not matter.',
          text: `In how many ways can a group of ${r} students be chosen from a class of ${n}?`,
          latex: `\\text{\\# groups} = \\,?`,
          answer,
          answerLatex: `\\binom{${n}}{${r}} = ${answer}`,
        }
      },
    },
    {
      id: 'codes',
      generate() {
        const k = randInt(3, 4)
        const pool = choice([
          { m: 10, name: 'digits 0–9' },
          { m: 4, name: 'letters A–D' },
          { m: 5, name: 'letters A–E' },
        ])
        const norep = Math.random() < 0.5
        let answer = 1
        for (let i = 0; i < k; i++) answer *= norep ? pool.m - i : pool.m
        return {
          ask: 'Multiplication principle.',
          text: `How many ${k}-character codes can be made from the ${pool.name}, ${
            norep ? 'if characters cannot repeat' : 'if characters may repeat'
          }?`,
          latex: `\\text{\\# codes} = \\,?`,
          answer,
        }
      },
    },
    {
      id: 'indistinguishable',
      generate() {
        const n1 = randInt(2, 4)
        const n2 = randInt(1, 2)
        const n3 = randInt(1, 3)
        const n = n1 + n2 + n3
        const answer = factorial(n) / (factorial(n1) * factorial(n2) * factorial(n3))
        return {
          ask: 'Indistinguishable objects.',
          text: `You drive through ${n} stoplights: ${n1} red, ${n2} yellow, ${n3} green. How many different orders are possible?`,
          latex:
            Math.random() < 0.5
              ? `\\dfrac{${n}!}{${n1}!\\,${n2}!\\,${n3}!} = \\,?`
              : `\\text{\\# orders} = \\,?`,
          answer,
          answerLatex: `\\dfrac{${n}!}{${n1}!\\,${n2}!\\,${n3}!} = ${answer}`,
        }
      },
    },
  ],
}
