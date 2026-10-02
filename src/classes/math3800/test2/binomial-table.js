import { randInt, choice } from '../../../engine/rand.js'
import { BINOMIAL_P, binomTable } from '../dist.js'
import { dec, probs } from './util.js'

// The cumulative tables the test hands out, n = 19 and n = 20. Every answer is
// arithmetic on the printed 4-decimal entries (binomTable), so it matches the
// Tables panel. The problems never show an entry: you look it up.

const NS = [19, 20]
const F = (n, p, x) => binomTable(p, x, n)
const f4 = v => v.toFixed(4)
const ASK = 'Use the binomial table (Tables button).'
const TOL = 0.0002

const STORIES = [
  { lead: n => `Each of ${n} patients responds to a treatment with probability`, x: 'the number who respond' },
  { lead: n => `A batch has ${n} parts, and each is defective with probability`, x: 'the number of defective parts' },
  { lead: n => `A basketball player takes ${n} free throws and makes each with probability`, x: 'the number she makes' },
  { lead: n => `Each of the next ${n} customers makes a purchase with probability`, x: 'the number who buy' },
  { lead: n => `Each of ${n} planted seeds germinates with probability`, x: 'the number that germinate' },
  { lead: n => `Each of ${n} flights arrives on time with probability`, x: 'the number that arrive on time' },
]

const story = (n, p) => {
  const s = choice(STORIES)
  return `${s.lead(n)} ${dec(p)}, independently. X is ${s.x}.`
}
const setting = (n, p) => (Math.random() < 0.4 ? `X is binomial with n = ${n} and p = ${dec(p)}.` : story(n, p))

// where to look: "the n = 19 table, column p = 0.4"
const where = (n, p) => `the n = ${n} table, column p = ${dec(p)}`

// an entry that is not stuck at 0.0000 or 1.0000
const live = (n, p, x) => x >= 0 && x <= n - 1 && F(n, p, x) >= 0.001 && F(n, p, x) <= 0.999

// The event keeping the values lo..hi, in table entries: what to compute, the
// rows it reads, and the arithmetic with the numbers in.
function viaTable(n, p, lo, hi) {
  if (lo <= 0) return { v: F(n, p, hi), rows: [hi], expr: `F(${hi})`, shown: `F(${hi}) = ${f4(F(n, p, hi))}` }
  if (hi >= n) {
    const v = 1 - F(n, p, lo - 1)
    return { v, rows: [lo - 1], expr: `1 - F(${lo - 1})`, shown: `1 - F(${lo - 1}) = 1 - ${f4(F(n, p, lo - 1))} = ${f4(v)}` }
  }
  const v = F(n, p, hi) - F(n, p, lo - 1)
  return {
    v,
    rows: [hi, lo - 1],
    expr: `F(${hi}) - F(${lo - 1})`,
    shown: `F(${hi}) - F(${lo - 1}) = ${f4(F(n, p, hi))} - ${f4(F(n, p, lo - 1))} = ${f4(v)}`,
  }
}

// Usable: every row it reads is a real entry, and the answer is not near 0 or 1.
const usable = (n, p, t) => t.rows.every(x => live(n, p, x)) && t.v >= 0.01 && t.v <= 0.99

// The usual slips: one row off at either end, or forgetting the complement.
const slips = (n, p, lo, hi) => {
  const at = (a, b) => viaTable(n, p, a, b).v
  const out = lo <= 0 ? [at(0, hi - 1), at(0, hi + 1), 1 - at(0, hi)] : hi >= n ? [at(lo + 1, n), at(lo - 1, n), 1 - at(lo, n)] : [at(lo + 1, hi), at(lo, hi + 1), at(lo - 1, hi), at(lo, hi - 1)]
  return probs(...out)
}

function problem(n, p, latex, t, hint, distractors, text = setting(n, p)) {
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
  name: 'Binomial table (n = 19, 20)',
  description: '§3.5: pick the n = 19 or n = 20 cumulative table, read P(X ≤ x), and turn it into any event.',
  learn: {
    formulas: [
      { label: 'The table gives the cdf', latex: 'F(x) = P(X \\le x), \\quad n = 19 \\text{ or } 20' },
      { label: 'Below', latex: 'P(X < x) = P(X \\le x - 1) = F(x - 1)' },
      { label: 'Above (complement)', latex: 'P(X \\ge x) = 1 - F(x - 1), \\quad P(X > x) = 1 - F(x)' },
      { label: 'Exactly', latex: 'P(X = x) = F(x) - F(x - 1)' },
      { label: 'Between, inclusive', latex: 'P(a \\le X \\le b) = F(b) - F(a - 1)' },
    ],
    how: [
      'There are two tables, n = 19 and n = 20. Pick the one for your n first: the same p and x give a different entry in each.',
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
        const n = choice(NS)
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, n - 1)
          const strict = Math.random() < 0.5
          const hi = strict ? x - 1 : x
          const t = viaTable(n, p, 0, hi)
          if (!usable(n, p, t)) continue
          const hint = strict
            ? {
                latex: `P(X < ${x}) = P(X \\le ${hi}) = F(${hi})`,
                text: `X is a whole number, so fewer than ${x} means at most ${hi}. Read row ${hi}, not row ${x}, in ${where(n, p)}.`,
              }
            : { latex: `P(X \\le ${x}) = F(${x})`, text: `The table gives P(X ≤ x) directly: ${where(n, p)}, row ${x}.` }
          return problem(n, p, `P(X ${strict ? '<' : '\\le'} ${x})`, t, hint, slips(n, p, 0, hi))
        }
      },
    },
    {
      id: 'at-least',
      generate() {
        const n = choice(NS)
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, n - 1)
          const strict = Math.random() < 0.5
          const lo = strict ? x + 1 : x
          const t = viaTable(n, p, lo, n)
          if (!usable(n, p, t)) continue
          const hint = strict
            ? {
                latex: `P(X > ${x}) = 1 - P(X \\le ${x}) = 1 - F(${x})`,
                text: `The table only gives "at most". More than ${x} is everything except 0 through ${x}: read row ${x} in ${where(n, p)}, and subtract from 1.`,
              }
            : {
                latex: `P(X \\ge ${x}) = 1 - P(X \\le ${x - 1}) = 1 - F(${x - 1})`,
                text: `The table only gives "at most". At least ${x} is everything except 0 through ${x - 1}: read row ${x - 1}, not row ${x}, in ${where(n, p)}, and subtract from 1.`,
              }
          return problem(n, p, `P(X ${strict ? '>' : '\\ge'} ${x})`, t, hint, slips(n, p, lo, n))
        }
      },
    },
    {
      id: 'exactly',
      generate() {
        const n = choice(NS)
        for (;;) {
          const p = choice(BINOMIAL_P)
          const x = randInt(1, n - 1)
          const t = viaTable(n, p, x, x)
          if (!usable(n, p, t)) continue
          const hint = {
            latex: `P(X = ${x}) = P(X \\le ${x}) - P(X \\le ${x - 1}) = F(${x}) - F(${x - 1})`,
            text: `Everything up to ${x}, minus everything up to ${x - 1}, leaves just ${x}. Read rows ${x} and ${x - 1} in ${where(n, p)}.`,
          }
          const row = k => F(n, p, k)
          return problem(n, p, `P(X = ${x})`, t, hint, probs(row(x), row(x + 1) - row(x), 1 - row(x - 1), row(x) - row(x - 2)))
        }
      },
    },
    {
      id: 'between',
      generate() {
        const n = choice(NS)
        for (;;) {
          const p = choice(BINOMIAL_P)
          const a = randInt(1, n - 3)
          const b = a + randInt(2, 6)
          if (b > n - 1) continue
          // inclusive at both ends most of the time
          const ends = choice(['ii', 'ii', 'ii', 'ei', 'ie', 'ee'])
          const lo = ends[0] === 'i' ? a : a + 1
          const hi = ends[1] === 'i' ? b : b - 1
          const t = viaTable(n, p, lo, hi)
          if (!usable(n, p, t)) continue
          const strict = ends === 'ii' ? '' : ` A strict < leaves its endpoint out, so the values kept are ${lo} through ${hi}.`
          const hint = {
            latex: `P(${lo} \\le X \\le ${hi}) = F(${hi}) - F(${lo - 1})`,
            text: `Everything up to ${hi}, minus everything up to ${lo - 1} (the row just below ${lo}), both from ${where(n, p)}.${strict}`,
          }
          const latex = `P(${a} ${ends[0] === 'i' ? '\\le' : '<'} X ${ends[1] === 'i' ? '\\le' : '<'} ${b})`
          return problem(n, p, latex, t, hint, slips(n, p, lo, hi))
        }
      },
    },
    {
      id: 'words',
      generate() {
        const n = choice(NS)
        for (;;) {
          const p = choice(BINOMIAL_P)
          const kind = choice(['le', 'lt', 'ge', 'gt', 'eq', 'in'])
          let lo
          let hi
          let say
          let sym
          if (kind === 'in') {
            const a = randInt(1, n - 3)
            const b = a + randInt(2, 6)
            if (b > n - 1) continue
            ;[lo, hi] = [a, b]
            say = `between ${a} and ${b}, inclusive`
            sym = `${a} \\le X \\le ${b}`
          } else {
            const x = randInt(1, n - 1)
            ;[lo, hi] = { le: [0, x], lt: [0, x - 1], ge: [x, n], gt: [x + 1, n], eq: [x, x] }[kind]
            say = choice(WORDS[kind].say)(x)
            sym = `X ${WORDS[kind].sym} ${x}`
          }
          const t = viaTable(n, p, lo, hi)
          if (!usable(n, p, t)) continue
          const hint = {
            latex: `\\text{${say}} \\;\\Rightarrow\\; P(${sym}) = ${t.expr}`,
            text: `Translate first: "${say}" is ${plain(sym)}. The table gives P(X ≤ x), so keep ${lo <= 0 ? `0 through ${hi}` : hi >= n ? `${lo} through ${n}, which is 1 minus 0 through ${lo - 1}` : `${lo} through ${hi}, which is up to ${hi} minus up to ${lo - 1}`}. Use ${where(n, p)}.`,
          }
          return {
            ...problem(n, p, `P(\\text{${say}})`, t, hint, slips(n, p, lo, hi), story(n, p)),
            answerLatex: `P(${sym}) = ${t.shown}`,
          }
        }
      },
    },
  ],
}
