import { randInt, choice } from '../../engine/rand.js'
import { fmt } from './util.js'

const ADDITION = 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'

export default {
  id: 'prob-rules',
  name: 'Probability rules',
  description: '§2.1: axioms, complement rule, addition rule.',
  learn: {
    formulas: [
      { label: 'Probabilities sum to 1', latex: '\\textstyle\\sum P(A_i) = 1' },
      { label: 'Complement rule', latex: "P(A) = 1 - P(A')" },
      { label: 'Addition rule', latex: ADDITION },
    ],
    how: [
      'Mutually exclusive categories (like blood types): just add their probabilities.',
      '"Not X": take 1 minus P(X).',
      'Overlapping events: add the two, then subtract the overlap so it is not counted twice.',
      '"Only A": P(A) minus the overlap P(A and B).',
      '"At least one of A, B": that is the union.',
      'Given three of the four pieces of the addition rule, solve for the missing one.',
    ],
  },
  templates: [
    {
      id: 'category-sum',
      generate() {
        const a = randInt(30, 45)
        const b = randInt(5, 15)
        const ab = randInt(2, 8)
        const o = 100 - a - b - ab
        const pick = choice([
          { q: 'A, B, or AB', val: a + b + ab },
          { q: 'A or O', val: a + o },
          { q: 'B or AB', val: b + ab },
          { q: 'not type O', val: 100 - o },
        ])
        return {
          ask: 'Mutually exclusive categories add.',
          text: `Blood types in the US: ${a}% type A, ${b}% type B, ${ab}% type AB, ${o}% type O.`,
          latex: `P(\\text{${pick.q}}) = \\,?`,
          answer: pick.val / 100,
          answerLatex: fmt(pick.val / 100),
          placeholder: 'e.g. 0.54',
          tolerance: 0.005,
          hint: {
            latex: '\\textstyle\\sum P(A_i) = 1',
            text: 'Blood types cannot overlap: add the listed ones. "Not X" is 1 minus P(X).',
          },
        }
      },
    },
    {
      id: 'addition-rule',
      generate() {
        const f = choice([
          { a: 'lead', b: 'mercury', noun: 'of samples contain' },
          { a: 'speeding', b: 'alcohol', noun: 'of accidents involve' },
          { a: 'coffee', b: 'tea', noun: 'of customers order' },
        ])
        const pa = randInt(25, 50)
        const pb = randInt(12, 30)
        const both = randInt(5, Math.min(pa, pb) - 3)
        const un = pa + pb - both
        const v = choice([
          {
            latex: `P(\\text{${f.a} or ${f.b}}) = \\,?`,
            val: un,
            given: `${pa}% ${f.noun} ${f.a}, ${pb}% ${f.b}, and ${both}% both.`,
            alt: [(pa + pb) / 100],
          },
          {
            latex: `P(\\text{${f.a} and ${f.b}}) = \\,?`,
            val: both,
            given: `${un}% ${f.noun} ${f.a} or ${f.b}, ${pa}% ${f.a}, and ${pb}% ${f.b}.`,
            alt: [(pa * pb) / 10000, (un - pa) / 100],
          },
          {
            latex: `P(\\text{only ${f.a}}) = \\,?`,
            val: pa - both,
            given: `${pa}% ${f.noun} ${f.a}, and ${both}% both ${f.a} and ${f.b}.`,
            alt: [pa / 100, both / 100],
          },
          {
            latex: `P(\\text{only ${f.b}}) = \\,?`,
            val: pb - both,
            given: `${pb}% ${f.noun} ${f.b}, and ${both}% both ${f.a} and ${f.b}.`,
            alt: [pb / 100, both / 100],
          },
        ])
        return {
          ask: 'Addition rule.',
          text: v.given,
          latex: v.latex,
          answer: v.val / 100,
          answerLatex: fmt(v.val / 100),
          placeholder: 'e.g. 0.38',
          tolerance: 0.005,
          hint: {
            latex: ADDITION,
            text: 'Plug in the pieces you know and solve for the missing one. "Only A" = P(A) - P(A and B).',
          },
          distractors: v.alt,
        }
      },
    },
    {
      id: 'at-least-one',
      generate() {
        const p = choice([80, 85, 90, 95])
        const both = (p * p) / 100
        return {
          ask: 'Addition rule.',
          text: `An airplane has two engines. Each works with probability ${fmt(
            p / 100,
          )}, and the probability both work is ${fmt(both / 100)}.`,
          latex: `P(\\text{at least one works}) = \\,?`,
          answer: (2 * p - both) / 100,
          answerLatex: fmt((2 * p - both) / 100),
          placeholder: 'e.g. 0.99',
          tolerance: 0.005,
          hint: {
            latex: ADDITION,
            text: '"At least one works" is the union of engine 1 working and engine 2 working.',
          },
          distractors: [both / 100, p / 100],
        }
      },
    },
  ],
}
