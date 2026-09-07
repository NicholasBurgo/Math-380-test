import { choice } from '../../engine/rand.js'
import { fmt, pct, probs, tolFor } from './util.js'

// Section 2.4 textbook exercises (35, 36, 34, 41): Bayes' theorem on the
// book's setups with fresh numbers. About one rep in four uses the book's
// own numbers so an answer can be checked against the homework. Exercise 34
// depends on Example 2.4.2, whose data is not transcribed yet, so it has no
// book-number path.

const BOOK = () => Math.random() < 0.25
const BAYES = 'P(A_i \\mid B) = \\dfrac{P(A_i)\\,P(B \\mid A_i)}{\\sum_j P(A_j)\\,P(B \\mid A_j)}'
const TOTAL = 'P(B) = \\sum_j P(A_j)\\,P(B \\mid A_j)'
const sum = xs => xs.reduce((s, x) => s + x, 0)

// Numerator over the written-out denominator, then over the total, then the value.
function bayesLatex(num, terms, ans) {
  const parts = terms.map(t => fmt(t)).join(' + ')
  return `\\frac{${fmt(num)}}{${parts}} = \\frac{${fmt(num)}}{${fmt(sum(terms))}} \\approx ${fmt(ans, ans < 0.05 ? 4 : 3)}`
}

function totalLatex(terms) {
  return `${terms.map(t => fmt(t)).join(' + ')} = ${fmt(sum(terms))}`
}

// Textbook-exercise pack, folded into its section topic via withPack().
export default {
  learn: {
    formulas: [
      { label: "Bayes' theorem", latex: BAYES },
      { label: 'Total probability', latex: TOTAL },
    ],
    how: [
      'Exercise 35: numerator is prevalence times sensitivity (the true positives). Denominator adds the false positives: (1 minus prevalence) times the false-positive rate.',
      'Exercise 36: stolen chips skipped inspection, so they carry the production defect rate. Weight each source by its share of the market, then take the stolen share of all defectives.',
      'Exercise 34: four true types can be typed A. Numerator: P(B) times P(typed A | B). Denominator: the same product summed over A, B, AB, and O.',
      'Exercise 41: each printer contributes its routing share times its jam rate. The printer you want, over the sum of all three.',
    ],
  },
  templates: [
    {
      id: 'ex35',
      generate() {
        let prev, sens, fp
        if (BOOK()) [prev, sens, fp] = [10, 85, 4]
        else {
          prev = choice([5, 8, 10, 12, 15, 20])
          sens = choice([80, 85, 90, 95])
          fp = choice([2, 4, 5, 8, 10])
        }
        // joint probabilities, as fractions of 1
        const tp = (prev * sens) / 1e4
        const fpos = ((100 - prev) * fp) / 1e4
        const fn = (prev * (100 - sens)) / 1e4
        const tn = ((100 - prev) * (100 - fp)) / 1e4
        const q = choice([
          {
            latex: 'P(\\text{arthritis} \\mid \\text{positive test}) = \\,?',
            answer: tp / (tp + fpos),
            answerLatex: bayesLatex(tp, [tp, fpos], tp / (tp + fpos)),
            distractors: probs(pct(sens), tp, fpos / (tp + fpos), pct(prev)),
          },
          {
            latex: 'P(\\text{positive test}) = \\,?',
            answer: tp + fpos,
            answerLatex: totalLatex([tp, fpos]),
            distractors: probs(tp, pct(sens), pct(prev + fp)),
          },
          {
            latex: 'P(\\text{arthritis} \\mid \\text{negative test}) = \\,?',
            answer: fn / (fn + tn),
            answerLatex: bayesLatex(fn, [fn, tn], fn / (fn + tn)),
            distractors: probs(pct(100 - sens), fn, pct(prev)),
          },
        ])
        return {
          ask: 'Exercise 35: arthritis test. Bayes.',
          text: `About ${prev}% of people over 50 have this form of arthritis. The test detects it in ${sens}% of people who have it, and ${fp}% of people without it also test positive.`,
          ...q,
          placeholder: 'decimal',
          tolerance: tolFor(q.answer),
          hint: {
            latex: "P(D \\mid +) = \\dfrac{P(D)\\,P(+ \\mid D)}{P(D)\\,P(+ \\mid D) + P(D')\\,P(+ \\mid D')}",
            text: 'True positives over all positives. Numerator: prevalence times sensitivity. Denominator: add the false positives, (1 minus prevalence) times the false-positive rate.',
          },
        }
      },
    },
    {
      id: 'ex36',
      generate() {
        let prodDef, legalDef, stolen
        if (BOOK()) [prodDef, legalDef, stolen] = [50, 5, 1]
        else {
          prodDef = choice([30, 40, 50, 60])
          legalDef = choice([2, 4, 5, 8])
          stolen = choice([1, 2, 5, 10])
        }
        const s = (stolen * prodDef) / 1e4 // stolen and defective
        const l = ((100 - stolen) * legalDef) / 1e4 // legal and defective
        const q = choice([
          {
            latex: 'P(\\text{stolen} \\mid \\text{defective}) = \\,?',
            answer: s / (s + l),
            answerLatex: bayesLatex(s, [s, l], s / (s + l)),
            distractors: probs(pct(stolen), s, pct(prodDef), l / (s + l)),
          },
          {
            latex: 'P(\\text{defective}) = \\,?',
            answer: s + l,
            answerLatex: totalLatex([s, l]),
            distractors: probs(pct(legalDef), pct(prodDef), s),
          },
        ])
        return {
          ask: 'Exercise 36: stolen chips. Bayes.',
          text: `${prodDef}% of all chips produced are defective. Inspection ensures that only ${legalDef}% of legally marketed chips are defective, but ${stolen}% of the chips on the market were stolen before inspection.`,
          ...q,
          placeholder: 'decimal',
          tolerance: tolFor(q.answer),
          hint: {
            latex: "P(S \\mid D) = \\dfrac{P(S)\\,P(D \\mid S)}{P(S)\\,P(D \\mid S) + P(S')\\,P(D \\mid S')}",
            text: 'Stolen chips skipped inspection, so P(defective | stolen) is the production rate. Legal chips carry the inspected rate. Weight each by its market share, then take the stolen share of all defectives.',
          },
        }
      },
    },
    {
      id: 'ex34',
      generate() {
        const ta = choice([85, 88, 90, 92, 95])
        const tb = choice([2, 3, 4, 5])
        const tab = choice([2, 4, 6])
        const to = choice([1, 2, 3])
        // P(true type and typed A) for A, B, AB, O
        const terms = [(41 * ta) / 1e4, (9 * tb) / 1e4, (4 * tab) / 1e4, (46 * to) / 1e4]
        const typedA = sum(terms)
        const q = choice([
          {
            latex: 'P(\\text{actually B} \\mid \\text{typed A}) = \\,?',
            answer: terms[1] / typedA,
            answerLatex: bayesLatex(terms[1], terms, terms[1] / typedA),
            distractors: probs(pct(tb), terms[1], 0.09, terms[0] / typedA),
          },
          {
            latex: 'P(\\text{actually A} \\mid \\text{typed A}) = \\,?',
            answer: terms[0] / typedA,
            answerLatex: bayesLatex(terms[0], terms, terms[0] / typedA),
            distractors: probs(pct(ta), terms[0], 0.41),
          },
          {
            latex: 'P(\\text{typed A}) = \\,?',
            answer: typedA,
            answerLatex: totalLatex(terms),
            distractors: probs(0.41, terms[0], pct(ta)),
          },
        ])
        return {
          ask: 'Exercise 34: blood typing errors. Bayes with four true types.',
          text: `Blood types in the population: 41% A, 9% B, 4% AB, 46% O. The typing procedure reports type A for ${ta}% of true A individuals, ${tb}% of true B, ${tab}% of true AB, and ${to}% of true O.`,
          ...q,
          placeholder: 'decimal',
          tolerance: tolFor(q.answer),
          hint: {
            latex: BAYES,
            text: 'Numerator: P(true type) times P(typed A | that type). Denominator: the same product for all four types, added up. Four ways to be typed A.',
          },
        }
      },
    },
    {
      id: 'ex41',
      generate() {
        let a, b, c, ja, jb, jc
        if (BOOK()) [a, b, c, ja, jb, jc] = [60, 30, 10, 1, 5, 4]
        else {
          a = choice([50, 60, 70])
          b = a === 70 ? 20 : choice([20, 30])
          c = 100 - a - b
          ja = choice([1, 2])
          jb = choice([3, 4, 5])
          jc = choice([2, 4, 6])
        }
        // P(routed to X and jam) for A, B, C
        const terms = [(a * ja) / 1e4, (b * jb) / 1e4, (c * jc) / 1e4]
        const jam = sum(terms)
        const printer = (name, i, share, rate) => ({
          latex: `P(\\text{printer ${name}} \\mid \\text{jam}) = \\,?`,
          answer: terms[i] / jam,
          answerLatex: bayesLatex(terms[i], terms, terms[i] / jam),
          distractors: probs(pct(share), terms[i], pct(rate)),
        })
        const q = choice([
          printer('A', 0, a, ja),
          printer('B', 1, b, jb),
          printer('C', 2, c, jc),
          {
            latex: 'P(\\text{jam}) = \\,?',
            answer: jam,
            answerLatex: totalLatex(terms),
            distractors: probs(pct(ja + jb + jc), terms[0], pct(jb)),
          },
        ])
        return {
          ask: 'Exercise 41: printer jams. Bayes.',
          text: `Programs go to printer A with probability ${fmt(pct(a))}, to B with probability ${fmt(pct(b))}, and to C with probability ${fmt(pct(c))}. The printers jam with probability ${fmt(pct(ja))}, ${fmt(pct(jb))}, and ${fmt(pct(jc))} respectively, and a jam destroys the program.`,
          ...q,
          placeholder: 'decimal',
          tolerance: tolFor(q.answer),
          hint: {
            latex: 'P(A \\mid J) = \\dfrac{P(A)\\,P(J \\mid A)}{P(A)\\,P(J \\mid A) + P(B)\\,P(J \\mid B) + P(C)\\,P(J \\mid C)}',
            text: 'Each printer contributes its routing share times its jam rate. The one you want, over the total of all three.',
          },
        }
      },
    },
  ],
}
