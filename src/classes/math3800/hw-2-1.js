import { randInt, choice } from '../../engine/rand.js'
import { fmt, fracLatex, pct, probs } from './util.js'

// Section 2.1 textbook exercises (2, 7, 6, 8, 12c): the book's setups with
// fresh numbers. About one rep in four uses the book's own numbers so an
// answer can be checked against the homework.

const BOOK = () => Math.random() < 0.25

const METALS = [
  'tin',
  'platinum',
  'nickel',
  'steel',
  'gold',
  'zinc',
  'copper',
  'aluminum',
  'silver',
  'titanium',
]
const BOOK_METALS = {
  tin: 1,
  platinum: 1,
  nickel: 1,
  steel: 11,
  gold: 5,
  zinc: 1,
  copper: 8,
  aluminum: 2,
  silver: 4,
  titanium: 1,
}

function metalCounts() {
  if (BOOK()) return { ...BOOK_METALS }
  return {
    tin: randInt(1, 2),
    platinum: randInt(1, 2),
    nickel: randInt(1, 2),
    steel: randInt(8, 14),
    gold: randInt(3, 7),
    zinc: randInt(1, 2),
    copper: randInt(5, 10),
    aluminum: randInt(1, 4),
    silver: randInt(2, 6),
    titanium: randInt(1, 2),
  }
}

const HINT_12C = {
  latex: "B = A \\cup (A' \\cap B) \\;\\Rightarrow\\; P(B) = P(A) + P(A' \\cap B) \\ge P(A)",
  text: 'Split B into the part inside A and the ring outside A. The two pieces are mutually exclusive, so axiom 3 adds them, and the ring is at least 0 by axiom 2. So P(B) can never be below P(A).',
}

// Textbook-exercise pack, folded into its section topic via withPack().
export default {
  learn: {
    formulas: [
      { label: 'Mutually exclusive events add', latex: 'P(A_1 \\cup A_2) = P(A_1) + P(A_2)' },
      { label: 'Complement rule', latex: "P(A') = 1 - P(A)" },
      { label: 'Addition rule', latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
      { label: 'A but not B', latex: "P(A \\cap B') = P(A) - P(A \\cap B)" },
      { label: 'Neither', latex: "P(A' \\cap B') = 1 - P(A \\cup B)" },
      { label: 'Subset rule (12c)', latex: 'A \\subseteq B \\;\\Rightarrow\\; P(A) \\le P(B)' },
    ],
    how: [
      'Exercise 2: one theft, one metal, so the metals are mutually exclusive. "Gold, silver, or platinum": add the three fractions. "Not steel": 1 minus P(steel).',
      'Exercise 7: given P(hot), P(blackout), and P(both). Draw the Venn diagram and fill the overlap first. "Hot but no blackout" is the hot circle minus the overlap.',
      'Exercise 6: given both singles and the union, the addition rule solves for the overlap. "Software but no overload" is P(software) minus the overlap.',
      'Exercise 8: "only deterioration" is the deterioration circle minus the overlap, so overlap = P(deterioration) minus P(only deterioration). "Neither" is 1 minus the union.',
      'Exercise 12(c): A inside B means B = A plus the ring A′ ∩ B. The pieces cannot overlap, so P(B) = P(A) + P(A′ ∩ B), and the ring is at least 0.',
    ],
  },
  templates: [
    {
      id: 'ex2',
      generate() {
        const c = metalCounts()
        const N = METALS.reduce((s, m) => s + c[m], 0)
        const list = METALS.map(m => `${m} ${c[m]}/${N}`).join(', ')
        const q = choice([
          {
            latex: 'P(\\text{gold, silver, or platinum}) = \\,?',
            k: c.gold + c.silver + c.platinum,
            wrong: [c.gold, c.gold + c.silver, N - c.gold - c.silver - c.platinum],
          },
          {
            latex: 'P(\\text{copper or aluminum}) = \\,?',
            k: c.copper + c.aluminum,
            wrong: [c.copper, N - c.copper - c.aluminum],
          },
          { latex: 'P(\\text{not steel}) = \\,?', k: N - c.steel, wrong: [c.steel, N - c.steel - 1] },
          { latex: 'P(\\text{not copper}) = \\,?', k: N - c.copper, wrong: [c.copper, N - c.copper - 1] },
        ])
        return {
          ask: 'Exercise 2: metal thefts. Mutually exclusive categories add.',
          text: `Precious-metal thefts: each theft involves one metal. Probability by metal: ${list}.`,
          latex: q.latex,
          answer: q.k / N,
          answerLatex: fracLatex(q.k, N),
          placeholder: 'fraction or decimal',
          tolerance: 0.006,
          hint: {
            latex: "P(A \\cup B \\cup C) = P(A) + P(B) + P(C), \\quad P(A') = 1 - P(A)",
            text: 'One theft, one metal, so the metals cannot overlap: add the listed fractions. "Not steel" is 1 minus P(steel).',
          },
          distractors: probs(...q.wrong.map(k => k / N)),
        }
      },
    },
    {
      id: 'ex7',
      generate() {
        let hot, bo, both
        if (BOOK()) [hot, bo, both] = [60, 30, 20]
        else {
          hot = 5 * randInt(9, 16) // 45..80
          bo = 5 * randInt(4, 8) // 20..40
          const lo = Math.max(2, Math.ceil((hot + bo - 95) / 5))
          const hi = Math.min(hot, bo) / 5 - 1
          both = 5 * randInt(lo, hi)
        }
        const un = hot + bo - both
        const q = choice([
          { latex: 'P(\\text{hot but no blackout}) = \\,?', v: hot - both, wrong: [hot, both, hot - bo, un] },
          { latex: 'P(\\text{blackout but not hot}) = \\,?', v: bo - both, wrong: [bo, both, un] },
          { latex: 'P(\\text{hot or blackout}) = \\,?', v: un, wrong: [hot + bo, both, hot] },
          {
            latex: 'P(\\text{neither hot nor blackout}) = \\,?',
            v: 100 - un,
            wrong: [100 - hot - bo, 100 - both, 100 - hot],
          },
        ])
        return {
          ask: 'Exercise 7: rolling blackouts. Venn diagram.',
          text: `July in California: ${hot}% chance the temperature exceeds 85° F on a given day (hot), ${bo}% chance a rolling blackout is needed, ${both}% chance of both.`,
          latex: q.latex,
          answer: pct(q.v),
          answerLatex: fmt(pct(q.v)),
          placeholder: 'decimal',
          tolerance: 0.005,
          hint: {
            latex: "P(A \\cap B') = P(A) - P(A \\cap B), \\quad P(A' \\cap B') = 1 - P(A \\cup B)",
            text: 'Two overlapping circles: put the "both" number in the overlap first. "Hot but no blackout" is what is left of the hot circle. "Neither" is everything outside both circles.',
          },
          distractors: probs(...q.wrong.map(pct)),
        }
      },
    },
    {
      id: 'ex6',
      generate() {
        let over, soft, un
        if (BOOK()) [over, soft, un] = [75, 15, 85]
        else {
          over = 5 * randInt(12, 17) // 60..85
          soft = 5 * randInt(2, 5) // 10..25
          const lo = Math.max(1, Math.ceil((over + soft - 95) / 5))
          const hi = soft / 5 - 1
          un = over + soft - 5 * randInt(lo, hi)
        }
        const both = over + soft - un
        const q = choice([
          {
            latex: 'P(\\text{overload and software}) = \\,?',
            v: both,
            wrong: [(over * soft) / 100, un - over, over - soft],
          },
          { latex: 'P(\\text{software but no overload}) = \\,?', v: soft - both, wrong: [soft, both, over - both] },
          { latex: 'P(\\text{overload but no software}) = \\,?', v: over - both, wrong: [over, both, soft - both] },
          { latex: 'P(\\text{neither}) = \\,?', v: 100 - un, wrong: [100 - over - soft, 100 - both, 100 - over] },
        ])
        return {
          ask: 'Exercise 6: computer crashes. Addition rule.',
          text: `When a computer goes down: ${over}% chance it is due to an overload, ${soft}% chance it is due to a software problem, ${un}% chance it is due to an overload or a software problem.`,
          latex: q.latex,
          answer: pct(q.v),
          answerLatex: fmt(pct(q.v)),
          placeholder: 'decimal',
          tolerance: 0.005,
          hint: {
            latex: 'P(A \\cap B) = P(A) + P(B) - P(A \\cup B)',
            text: 'Given the two singles and the union, solve the addition rule for the overlap. "Software but no overload" is P(software) minus that overlap.',
          },
          distractors: probs(...q.wrong.map(pct)),
        }
      },
    },
    {
      id: 'ex8',
      generate() {
        let st, det, detOnly
        if (BOOK()) [st, det, detOnly] = [25, 50, 35]
        else {
          st = 5 * randInt(3, 7) // 15..35
          det = 5 * randInt(8, 12) // 40..60
          detOnly = det - 5 * randInt(1, st / 5 - 1) // overlap 5..st-5
        }
        const both = det - detOnly
        const un = st + detOnly
        const q = choice([
          {
            latex: 'P(\\text{static and deterioration}) = \\,?',
            v: both,
            wrong: [(st * det) / 100, det - st, detOnly, st],
          },
          { latex: 'P(\\text{neither}) = \\,?', v: 100 - un, wrong: [100 - st - det, 100 - det, both] },
          { latex: 'P(\\text{only static}) = \\,?', v: st - both, wrong: [st, both, detOnly] },
          { latex: 'P(\\text{static or deterioration}) = \\,?', v: un, wrong: [st + det, det, un + both] },
        ])
        return {
          ask: 'Exercise 8: phone complaints. Find the overlap first.',
          text: `Complaints about home telephone lines: ${st}% involve static on the line, ${det}% involve line deterioration, and ${detOnly}% involve only line deterioration.`,
          latex: q.latex,
          answer: pct(q.v),
          answerLatex: fmt(pct(q.v)),
          placeholder: 'decimal',
          tolerance: 0.005,
          hint: {
            latex: "P(A \\cap B) = P(B) - P(A' \\cap B), \\quad P(A' \\cap B') = 1 - P(A \\cup B)",
            text: '"Only deterioration" is the deterioration circle minus the overlap, so overlap = P(deterioration) minus P(only deterioration). Union = P(static) + P(only deterioration). "Neither" is 1 minus the union.',
          },
          distractors: probs(...q.wrong.map(pct)),
        }
      },
    },
    {
      id: 'ex12c',
      generate() {
        const pa = 5 * randInt(2, 12) // 10..60
        const kind = choice(['ring', 'total', 'could'])
        if (kind === 'ring') {
          const pb = pa + 5 * randInt(1, 7)
          return {
            ask: 'Exercise 12(c): A inside B.',
            text: `A is a subset of B (every outcome of A is also in B), with P(A) = ${fmt(pct(pa))} and P(B) = ${fmt(pct(pb))}. Write B = A ∪ (A′ ∩ B).`,
            latex: "P(A' \\cap B) = \\,?",
            answer: pct(pb - pa),
            answerLatex: fmt(pct(pb - pa)),
            placeholder: 'decimal',
            tolerance: 0.005,
            hint: HINT_12C,
            distractors: probs(pa / pb, pct(pa) * pct(pb), 1 - pct(pb), pct(pa)),
          }
        }
        if (kind === 'total') {
          const ring = 5 * randInt(1, 7)
          return {
            ask: 'Exercise 12(c): A inside B.',
            text: `A is a subset of B, with P(A) = ${fmt(pct(pa))} and P(A′ ∩ B) = ${fmt(pct(ring))}.`,
            latex: 'P(B) = \\,?',
            answer: pct(pa + ring),
            answerLatex: fmt(pct(pa + ring)),
            placeholder: 'decimal',
            tolerance: 0.005,
            hint: HINT_12C,
            distractors: probs(pct(pa - ring), pct(pa) * pct(ring), 1 - pct(pa + ring), pct(pa)),
          }
        }
        const d = 5 * randInt(1, 6)
        let x = Math.random() < 0.5 ? pa + d : pa - d
        if (x < 5) x = pa + d
        const yes = x > pa
        return {
          ask: 'Exercise 12(c): A inside B, so P(A) ≤ P(B).',
          text: `A is a subset of B, with P(A) = ${fmt(pct(pa))}.`,
          latex: `\\text{Could } P(B) = ${fmt(pct(x))}\\,?`,
          answer: yes ? 'yes' : 'no',
          answerLatex: `\\text{${yes ? 'yes' : 'no'}}`,
          placeholder: 'yes / no',
          hint: HINT_12C,
        }
      },
    },
  ],
}
