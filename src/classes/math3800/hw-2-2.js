import { randInt, choice } from '../../engine/rand.js'
import { fmt, fracLatex, pct, probs } from './util.js'

// Section 2.2 textbook exercises (17, 42): conditional probability on the
// book's setups with fresh numbers. About one rep in four uses the book's
// own numbers so an answer can be checked against the homework.

const BOOK = () => Math.random() < 0.25
const COND = 'P(B \\mid A) = \\dfrac{P(A \\cap B)}{P(A)}'
// small answers need a tighter tolerance than the usual 0.005
const tolFor = v => (v < 0.05 ? 0.0005 : 0.005)

export default {
  id: 'hw-2-2',
  name: 'Exercises 2.2',
  description: 'Textbook §2.2 problems 17 and 42 with fresh numbers.',
  learn: {
    formulas: [
      { label: 'Conditional probability', latex: COND },
      { label: 'Condition on "not A"', latex: "P(B \\mid A') = \\dfrac{P(A' \\cap B)}{1 - P(A)}" },
      { label: 'B but not A', latex: "P(A' \\cap B) = P(B) - P(A \\cap B)" },
      { label: 'Addition rule', latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
    ],
    how: [
      'Exercise 17: the condition (after the bar) is the new whole. "Line given transformer" divides the 1% overlap by the 5% transformer figure, not by 80%.',
      '"Given no line damage": numerator is transformer-but-not-line (5% minus 1%), denominator is 100% minus 80%.',
      'Exercise 42: "equipment failure alone" is not P(equipment). Add the overlap back first: P(equipment) = alone + both.',
      '"Operator alone" is P(operator) minus the overlap. "Neither" is 1 minus the union, and the union is equipment-alone plus P(operator).',
      '"Operator given no equipment failure": operator-alone over 1 minus P(equipment).',
    ],
  },
  templates: [
    {
      id: 'ex17',
      generate() {
        let tr, line, both
        if (BOOK()) [tr, line, both] = [5, 80, 1]
        else {
          tr = randInt(3, 10)
          line = 5 * randInt(12, 17) // 60..85
          both = randInt(1, tr - 1)
        }
        const noLine = 100 - line
        const q = choice([
          {
            latex: 'P(\\text{line} \\mid \\text{transformer}) = \\,?',
            num: both,
            den: tr,
            wrong: [both / line, pct(both), tr / line],
          },
          {
            latex: 'P(\\text{transformer} \\mid \\text{line}) = \\,?',
            num: both,
            den: line,
            wrong: [both / tr, pct(both), pct(tr)],
          },
          {
            latex: 'P(\\text{transformer but no line damage}) = \\,?',
            num: tr - both,
            den: 100,
            wrong: [pct(tr), pct(both), pct(line - both)],
          },
          {
            latex: 'P(\\text{transformer} \\mid \\text{no line damage}) = \\,?',
            num: tr - both,
            den: noLine,
            wrong: [(tr - both) / line, pct(tr - both), both / noLine],
          },
          {
            latex: 'P(\\text{transformer or line}) = \\,?',
            num: tr + line - both,
            den: 100,
            wrong: [pct(tr + line), pct(both), pct(line)],
          },
        ])
        const ans = q.num / q.den
        return {
          ask: 'Exercise 17: power failures. The condition is the new whole.',
          text: `Power failures: ${tr}% are due to transformer damage, ${line}% are due to line damage, ${both}% involve both.`,
          latex: q.latex,
          answer: ans,
          answerLatex: q.den === 100 ? fmt(ans) : fracLatex(q.num, q.den),
          placeholder: ans < 0.05 ? 'e.g. 1/80 or 0.0125' : 'e.g. 0.2 or 1/5',
          tolerance: tolFor(ans),
          hint: {
            latex: COND,
            text: 'Divide the joint "both" piece by whatever comes after the bar. "Given no line damage": numerator transformer-only, denominator 1 minus P(line).',
          },
          distractors: probs(...q.wrong),
        }
      },
    },
    {
      id: 'ex42',
      generate() {
        let eqAlone, both, op
        if (BOOK()) [eqAlone, both, op] = [10, 5, 40]
        else {
          eqAlone = 5 * randInt(1, 4) // 5..20
          both = 5 * randInt(1, 3) // 5..15
          op = 5 * randInt(6, 10) // 30..50
        }
        const eq = eqAlone + both
        const un = eqAlone + op
        const q = choice([
          {
            latex: 'P(\\text{equipment or operator}) = \\,?',
            num: un,
            den: 100,
            wrong: [pct(eq + op), pct(op), pct(eq)],
          },
          {
            latex: 'P(\\text{operator alone}) = \\,?',
            num: op - both,
            den: 100,
            wrong: [pct(op), pct(both), pct(op - eq)],
          },
          {
            latex: 'P(\\text{neither}) = \\,?',
            num: 100 - un,
            den: 100,
            wrong: [pct(100 - eq - op), pct(100 - op), pct(100 - eqAlone)],
          },
          {
            latex: 'P(\\text{operator} \\mid \\text{equipment}) = \\,?',
            num: both,
            den: eq,
            wrong: [both / op, pct(both), both / eqAlone],
          },
          {
            latex: 'P(\\text{operator} \\mid \\text{no equipment failure}) = \\,?',
            num: op - both,
            den: 100 - eq,
            wrong: [pct(op - both), op / (100 - eq), (op - both) / (100 - eqAlone)],
          },
        ])
        const ans = q.num / q.den
        return {
          ask: 'Exercise 42: refinery shutdowns. Build P(equipment) first.',
          text: `Oil refinery shutdowns: ${eqAlone}% are due to equipment failure alone, ${both}% are due to a combination of equipment failure and operator error, and ${op}% involve operator error.`,
          latex: q.latex,
          answer: ans,
          answerLatex: q.den === 100 ? fmt(ans) : fracLatex(q.num, q.den),
          placeholder: 'e.g. 0.35 or 1/3',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(E) = P(E \\text{ alone}) + P(E \\cap O), \\quad P(O \\mid E) = \\dfrac{P(E \\cap O)}{P(E)}',
            text: '"Equipment alone" leaves out the overlap: P(equipment) = alone + both. Union = alone + P(operator). "Operator alone" = P(operator) minus both. Conditionals divide by the condition.',
          },
          distractors: probs(...q.wrong),
        }
      },
    },
  ],
}
