import { randInt, choice } from '../../engine/rand.js'
import { fmt } from './util.js'

export default {
  id: 'prob-rules',
  name: 'Probability rules',
  description: '§2.1 — axioms, complement rule, addition rule.',
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
          },
          {
            latex: `P(\\text{${f.a} and ${f.b}}) = \\,?`,
            val: both,
            given: `${un}% ${f.noun} ${f.a} or ${f.b}, ${pa}% ${f.a}, and ${pb}% ${f.b}.`,
          },
          {
            latex: `P(\\text{only ${f.a}}) = \\,?`,
            val: pa - both,
            given: `${pa}% ${f.noun} ${f.a}, and ${both}% both ${f.a} and ${f.b}.`,
          },
          {
            latex: `P(\\text{only ${f.b}}) = \\,?`,
            val: pb - both,
            given: `${pb}% ${f.noun} ${f.b}, and ${both}% both ${f.a} and ${f.b}.`,
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
        }
      },
    },
  ],
}
