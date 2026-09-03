import { randInt, choice } from '../../engine/rand.js'
import { factorial } from './util.js'

const perm = (n, r) => factorial(n) / factorial(n - r)
const comb = (n, r) => factorial(n) / (factorial(r) * factorial(n - r))

export default {
  id: 'counting',
  name: 'Counting',
  description: '§1.3: permutations, combinations, multiplication principle.',
  learn: {
    formulas: [
      { label: 'Permutations (order matters)', latex: '{}_{n}P_{r} = \\dfrac{n!}{(n-r)!}' },
      {
        label: 'Combinations (order does not matter)',
        latex: '\\dbinom{n}{r} = \\dfrac{n!}{r!\\,(n-r)!}',
      },
      { label: 'Multiplication principle', latex: 'n_1 \\times n_2 \\times \\cdots \\times n_k' },
      { label: 'Indistinguishable objects', latex: '\\dfrac{n!}{n_1!\\,n_2!\\cdots n_k!}' },
    ],
    how: [
      'Ask first: does order matter? Line-ups, codes, rankings: yes. Groups, committees, hands: no.',
      'Order matters: permutations. Multiply n down through r slots: n(n-1)(n-2)...',
      'Order does not matter: combinations. Count like a permutation, then divide by r! to kill the orderings.',
      'Independent slots multiply: 3 slots from 10 digits with repeats is 10 x 10 x 10; without repeats, 10 x 9 x 8.',
      'Repeated identical objects: arrange all n, then divide by a factorial for each repeated group.',
    ],
  },
  templates: [
    {
      id: 'permutation',
      generate() {
        const n = randInt(5, 9)
        const r = randInt(2, Math.min(4, n - 1))
        const answer = perm(n, r)
        const hint = {
          latex: '{}_{n}P_{r} = \\dfrac{n!}{(n-r)!}',
          text: `Order matters here. Multiply n down through r slots: ${n} × ${n - 1} × ...`,
        }
        const distractors = [comb(n, r), n * r, perm(n, r - 1)]
        if (Math.random() < 0.5) {
          return { ask: 'Compute.', latex: `{}_{${n}}P_{${r}} = \\,?`, answer, hint, distractors }
        }
        return {
          ask: 'Order matters.',
          text: `In how many ways can ${r} of ${n} students be arranged in a line?`,
          latex: `\\text{\\# arrangements} = \\,?`,
          answer,
          answerLatex: `{}_{${n}}P_{${r}} = ${answer}`,
          hint,
          distractors,
        }
      },
    },
    {
      id: 'combination',
      generate() {
        const n = randInt(5, 10)
        const r = randInt(2, 4)
        const answer = comb(n, r)
        const hint = {
          latex: '\\dbinom{n}{r} = \\dfrac{n!}{r!\\,(n-r)!}',
          text: 'Order does not matter. Count like a permutation, then divide by r!.',
        }
        const distractors = [perm(n, r), n * r, comb(n, r - 1)]
        if (Math.random() < 0.5) {
          return { ask: 'Compute.', latex: `\\binom{${n}}{${r}} = \\,?`, answer, hint, distractors }
        }
        return {
          ask: 'Order does not matter.',
          text: `In how many ways can a group of ${r} students be chosen from a class of ${n}?`,
          latex: `\\text{\\# groups} = \\,?`,
          answer,
          answerLatex: `\\binom{${n}}{${r}} = ${answer}`,
          hint,
          distractors,
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
        let rep = 1
        let noRepCount = 1
        for (let i = 0; i < k; i++) {
          rep *= pool.m
          noRepCount *= pool.m - i
        }
        const answer = norep ? noRepCount : rep
        return {
          ask: 'Multiplication principle.',
          text: `How many ${k}-character codes can be made from the ${pool.name}, ${
            norep ? 'if characters cannot repeat' : 'if characters may repeat'
          }?`,
          latex: `\\text{\\# codes} = \\,?`,
          answer,
          hint: {
            latex: 'n_1 \\times n_2 \\times \\cdots',
            text: norep
              ? `One factor per slot, shrinking by 1 each time: ${pool.m} × ${pool.m - 1} × ...`
              : `One factor per slot, same each time: ${pool.m} × ${pool.m} × ...`,
          },
          distractors: [norep ? rep : noRepCount, Math.pow(pool.m, k - 1), pool.m * k],
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
          hint: {
            latex: '\\dfrac{n!}{n_1!\\,n_2!\\,n_3!}',
            text: 'Arrange all n lights, then divide by each color group factorial to remove duplicate orders.',
          },
          distractors: [
            factorial(n),
            factorial(n) / factorial(n1),
            factorial(n) / (factorial(n1) * factorial(n2)),
          ],
        }
      },
    },
  ],
}
