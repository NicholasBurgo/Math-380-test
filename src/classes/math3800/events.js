import { randInt, choice } from '../../engine/rand.js'

const U = [1, 2, 3, 4, 5, 6]

function randSubset(minSize, maxSize, from = U) {
  const size = randInt(minSize, Math.min(maxSize, from.length))
  const pool = from.slice()
  const out = []
  for (let i = 0; i < size; i++) out.push(pool.splice(randInt(0, pool.length - 1), 1)[0])
  return out.sort((a, b) => a - b)
}

const setStr = s => `{${s.join(', ')}}`

export default {
  id: 'events',
  name: 'Sample spaces & events',
  description: '§1.2: unions, intersections, complements, mutual exclusivity.',
  learn: {
    formulas: [
      { label: 'Union: in A or B (or both)', latex: 'A \\cup B' },
      { label: 'Intersection: in both', latex: 'A \\cap B' },
      { label: 'Complement: not in A', latex: "A' = S \\setminus A" },
      { label: 'Mutually exclusive', latex: 'A \\cap B = \\varnothing' },
    ],
    how: [
      'Union: collect everything in either set, counting shared outcomes once.',
      'Intersection: keep only the outcomes the sets share.',
      "Prime means NOT: A' is everything in S outside A.",
      "Work inside-out: resolve primes first, then apply the union or intersection.",
      'Mutually exclusive: zero shared outcomes, so both cannot happen at once.',
    ],
  },
  templates: [
    {
      id: 'set-count',
      generate() {
        const A = randSubset(2, 4)
        const B = randSubset(2, 4)
        const Ap = U.filter(x => !A.includes(x))
        const Bp = U.filter(x => !B.includes(x))
        const union = (X, Y) => U.filter(x => X.includes(x) || Y.includes(x))
        const inter = (X, Y) => U.filter(x => X.includes(x) && Y.includes(x))
        const op = choice([
          { latex: `n(A \\cup B) = \\,?`, val: union(A, B).length },
          { latex: `n(A \\cap B) = \\,?`, val: inter(A, B).length },
          { latex: `n(A') = \\,?`, val: Ap.length },
          { latex: `n(A \\cap B') = \\,?`, val: inter(A, Bp).length },
          { latex: `n(A' \\cup B) = \\,?`, val: union(Ap, B).length },
        ])
        return {
          ask: 'Count the outcomes in the event.',
          text: `S = ${setStr(U)}, A = ${setStr(A)}, B = ${setStr(B)}.`,
          latex: op.latex,
          answer: op.val,
          hint: {
            latex: "A \\cup B, \\quad A \\cap B, \\quad A'",
            text: 'Resolve primes first (everything in S outside the set), then union = either, intersection = both. Count.',
          },
          distractors: [6 - op.val, op.val + 1, op.val - 1],
        }
      },
    },
    {
      id: 'mutually-exclusive',
      generate() {
        const A = randSubset(2, 3)
        const rest = U.filter(x => !A.includes(x))
        const disjoint = Math.random() < 0.5
        const B = disjoint
          ? randSubset(2, 3, rest)
          : [choice(A), ...randSubset(1, 2, rest)].sort((a, b) => a - b)
        const yes = A.every(x => !B.includes(x))
        return {
          ask: 'Can both occur at once?',
          text: `S = ${setStr(U)}, A = ${setStr(A)}, B = ${setStr(B)}.`,
          latex: `\\text{Are } A \\text{ and } B \\text{ mutually exclusive?}`,
          answer: yes ? 'yes' : 'no',
          answerLatex: `\\text{${yes ? 'yes' : 'no'}}`,
          placeholder: 'yes / no',
          hint: {
            latex: 'A \\cap B = \\varnothing',
            text: 'Scan for any shared outcome. One overlap means they can happen together, so not mutually exclusive.',
          },
        }
      },
    },
  ],
}
