import { randInt, choice } from '../../../engine/rand.js'
import { BINOMIAL_P, binomTable } from '../dist.js'
import { dec, probs } from './util.js'

// The n = 20 cumulative table the test hands out. Every answer is arithmetic on
// the printed 4-decimal entries (binomTable), so it matches the Tables panel.
// The problems never show an entry: you look it up.

const F = (p, x) => binomTable(p, x)
const f4 = v => v.toFixed(4)
const ASK = 'Use the binomial table (Tables button).'
const TOL = 0.0002

const STORIES = [
  { lead: 'Each of 20 patients responds to a treatment with probability', x: 'the number who respond' },
  { lead: 'A batch has 20 parts, and each is defective with probability', x: 'the number of defective parts' },
  { lead: 'A basketball player takes 20 free throws and makes each with probability', x: 'the number she makes' },
  { lead: 'Each of the next 20 customers makes a purchase with probability', x: 'the number who buy' },
  { lead: 'Each of 20 planted seeds germinates with probability', x: 'the number that germinate' },
  { lead: 'Each of 20 flights arrives on time with probability', x: 'the number that arrive on time' },
]

const story = p => {
  const s = choice(STORIES)
  return `${s.lead} ${dec(p)}, independently. X is ${s.x}.`
}
const setting = p => (Math.random() < 0.4 ? `X is binomial with n = 20 and p = ${dec(p)}.` : story(p))

// an entry that is not stuck at 0.0000 or 1.0000
const live = (p, x) => x >= 0 && x <= 19 && F(p, x) >= 0.001 && F(p, x) <= 0.999

// The event keeping the values lo..hi, in table entries: what to compute, the
// rows it reads, and the arithmetic with the numbers in.
function viaTable(p, lo, hi) {
  if (lo <= 0) return { v: F(p, hi), rows: [hi], expr: `F(${hi})`, shown: `F(${hi}) = ${f4(F(p, hi))}` }
  if (hi >= 20) {
    const v = 1 - F(p, lo - 1)
    return { v, rows: [lo - 1], expr: `1 - F(${lo - 1})`, shown: `1 - F(${lo - 1}) = 1 - ${f4(F(p, lo - 1))} = ${f4(v)}` }
  }
  const v = F(p, hi) - F(p, lo - 1)
  return {
    v,
    rows: [hi, lo - 1],
    expr: `F(${hi}) - F(${lo - 1})`,
    shown: `F(${hi}) - F(${lo - 1}) = ${f4(F(p, hi))} - ${f4(F(p, lo - 1))} = ${f4(v)}`,
  }
}

// Usable: every row it reads is a real entry, and the answer is not near 0 or 1.
const usable = (p, t) => t.rows.every(x => live(p, x)) && t.v >= 0.01 && t.v <= 0.99

// The usual slips: one row off at either end, or forgetting the complement.
const slips = (p, lo, hi) => {
  const at = (a, b) => viaTable(p, a, b).v
  const out = lo <= 0 ? [at(0, hi - 1), at(0, hi + 1), 1 - at(0, hi)] : hi >= 20 ? [at(lo + 1, 20), at(lo - 1, 20), 1 - at(lo, 20)] : [at(lo + 1, hi), at(lo, hi + 1), at(lo - 1, hi), at(lo, hi - 1)]
  return probs(...out)
}

function problem(p, latex, t, hint, distractors, text = setting(p)) {
  return {
    ask: ASK,
    text,
    latex: `${latex} = \\,?`,
    answer: t.v,
    answerLatex: t.shown,
    placeholder: 'e.g. 0.5841',
    tolerance: TOL,
    hint,
    distractors,
  }
}

// LaTeX inequality signs as plain text
const plain = s => s.replaceAll('\\le', '≤').replaceAll('\\ge', '≥')

// Words for each kind of event, and how to read them.
const WORDS = {
  le: { say: [x => `at most ${x}`, x => `no more than ${x}`], sym: '\\le' },
  lt: { say: [x => `fewer than ${x}`], sym: '<' },
  ge: { say: [x => `at least ${x}`, x => `no fewer than ${x}`], sym: '\\ge' },
  gt: { say: [x => `more than ${x}`], sym: '>' },
  eq: { say: [x => `exactly ${x}`], sym: '=' },
}

export default {
  id: 'binomial-table',
  name: 'Binomial table (n = 20)',
  description: '§3.5: read P(X ≤ x) from the cumulative table and turn it into any event.',
  learn: {
    formulas: [
      { label: 'The table gives the cdf', latex: 'F(x) = P(X \\le x), \\quad n = 20' },
      { label: 'Below', latex: 'P(X < x) = P(X \\le x - 1) = F(x - 1)' },
      { label: 'Above (complement)', latex: 'P(X \\ge x) = 1 - F(x - 1), \\quad P(X > x) = 1 - F(x)' },
      { label: 'Exactly', latex: 'P(X = x) = F(x) - F(x - 1)' },
      { label: 'Between, inclusive', latex: 'P(a \\le X \\le b) = F(b) - F(a - 1)' },
    ],
    how: [
      'Find the column for p and the row for x: the entry is P(X ≤ x), everything from 0 up to x.',
      'Rewrite every event with "≤". X is a whole number, so X < 8 is the same as X ≤ 7.',
      'At least 8 is everything except 0 through 7, so 1 − F(7). More than 8 is 1 − F(8).',
      'Exactly 8: F(8) − F(7), everything up to 8 minus everything up to 7.',
      'Between 5 and 9 inclusive: F(9) − F(4). Subtract the row just below the lower end.',
      'Words: at most is ≤, fewer than is <, at least is ≥, more than is >.',
    ],
  },
  templates: [
    {
      id: 'at-most',
      generate() {
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, 19)
          const strict = Math.random() < 0.5
          const hi = strict ? x - 1 : x
          const t = viaTable(p, 0, hi)
          if (!usable(p, t)) continue
          const P = dec(p)
          const hint = strict
            ? {
                latex: `P(X < ${x}) = P(X \\le ${hi}) = F(${hi})`,
                text: `X is a whole number, so fewer than ${x} means at most ${hi}. Read row ${hi}, not row ${x}, in the p = ${P} column.`,
              }
            : { latex: `P(X \\le ${x}) = F(${x})`, text: `The table gives P(X ≤ x) directly: row ${x}, column p = ${P}.` }
          return problem(p, `P(X ${strict ? '<' : '\\le'} ${x})`, t, hint, slips(p, 0, hi))
        }
      },
    },
    {
      id: 'at-least',
      generate() {
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, 19)
          const strict = Math.random() < 0.5
          const lo = strict ? x + 1 : x
          const t = viaTable(p, lo, 20)
          if (!usable(p, t)) continue
          const P = dec(p)
          const hint = strict
            ? {
                latex: `P(X > ${x}) = 1 - P(X \\le ${x}) = 1 - F(${x})`,
                text: `The table only gives "at most". More than ${x} is everything except 0 through ${x}: read row ${x} (p = ${P}) and subtract from 1.`,
              }
            : {
                latex: `P(X \\ge ${x}) = 1 - P(X \\le ${x - 1}) = 1 - F(${x - 1})`,
                text: `The table only gives "at most". At least ${x} is everything except 0 through ${x - 1}: read row ${x - 1} (p = ${P}), not row ${x}, and subtract from 1.`,
              }
          return problem(p, `P(X ${strict ? '>' : '\\ge'} ${x})`, t, hint, slips(p, lo, 20))
        }
      },
    },
    {
      id: 'exactly',
      generate() {
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, 19)
          const t = viaTable(p, x, x)
          if (!usable(p, t)) continue
          const hint = {
            latex: `P(X = ${x}) = P(X \\le ${x}) - P(X \\le ${x - 1}) = F(${x}) - F(${x - 1})`,
            text: `Everything up to ${x}, minus everything up to ${x - 1}, leaves just ${x}. Read rows ${x} and ${x - 1} in the p = ${dec(p)} column.`,
          }
          return problem(p, `P(X = ${x})`, t, hint, probs(F(p, x), F(p, x + 1) - F(p, x), 1 - F(p, x - 1), F(p, x) - F(p, x - 2)))
        }
      },
    },
    {
      id: 'between',
      generate() {
        for (;;) {
          const p = choice(BINOMIAL_P)
          const a = randInt(1, 17)
          const b = a + randInt(2, 6)
          if (b > 19) continue
          // inclusive at both ends most of the time
          const ends = choice(['ii', 'ii', 'ii', 'ei', 'ie', 'ee'])
          const lo = ends[0] === 'i' ? a : a + 1
          const hi = ends[1] === 'i' ? b : b - 1
          const t = viaTable(p, lo, hi)
          if (!usable(p, t)) continue
          const strict = ends === 'ii' ? '' : ` A strict < leaves its endpoint out, so the values kept are ${lo} through ${hi}.`
          const hint = {
            latex: `P(${lo} \\le X \\le ${hi}) = F(${hi}) - F(${lo - 1})`,
            text: `Everything up to ${hi}, minus everything up to ${lo - 1} (the row just below ${lo}).${strict}`,
          }
          const latex = `P(${a} ${ends[0] === 'i' ? '\\le' : '<'} X ${ends[1] === 'i' ? '\\le' : '<'} ${b})`
          return problem(p, latex, t, hint, slips(p, lo, hi))
        }
      },
    },
    {
      id: 'words',
      generate() {
        for (;;) {
          const p = choice(BINOMIAL_P)
          const kind = choice(['le', 'lt', 'ge', 'gt', 'eq', 'in'])
          let lo
          let hi
          let say
          let sym
          if (kind === 'in') {
            const a = randInt(1, 17)
            const b = a + randInt(2, 6)
            if (b > 19) continue
            ;[lo, hi] = [a, b]
            say = `between ${a} and ${b}, inclusive`
            sym = `${a} \\le X \\le ${b}`
          } else {
            const x = randInt(1, 19)
            ;[lo, hi] = { le: [0, x], lt: [0, x - 1], ge: [x, 20], gt: [x + 1, 20], eq: [x, x] }[kind]
            say = choice(WORDS[kind].say)(x)
            sym = `X ${WORDS[kind].sym} ${x}`
          }
          const t = viaTable(p, lo, hi)
          if (!usable(p, t)) continue
          const hint = {
            latex: `\\text{${say}} \\;\\Rightarrow\\; P(${sym}) = ${t.expr}`,
            text: `Translate first: "${say}" is ${plain(sym)}. The table gives P(X ≤ x), so keep ${lo <= 0 ? `0 through ${hi}` : hi >= 20 ? `${lo} through 20, which is 1 minus 0 through ${lo - 1}` : `${lo} through ${hi}, which is up to ${hi} minus up to ${lo - 1}`}. Column p = ${dec(p)}.`,
          }
          return {
            ...problem(p, `P(\\text{${say}})`, t, hint, slips(p, lo, hi), story(p)),
            answerLatex: `P(${sym}) = ${t.shown}`,
          }
        }
      },
    },
  ],
}
