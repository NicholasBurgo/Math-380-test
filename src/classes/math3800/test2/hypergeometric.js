import { choice, randInt, shuffle } from '../../../engine/rand.js'
import { binomPdf, comb, hyperPdf } from '../dist.js'
import { lettered, num, probs, tolFor } from './util.js'

// A population of N that holds r successes, a sample of n drawn without
// replacement, and X = the number of successes in the sample (the notes' N, r, n).

const low = s => Math.max(0, s.n - (s.N - s.r))
const high = s => Math.min(s.n, s.r)
const f = (s, x) => hyperPdf(s.N, s.r, s.n, x)
const total = (s, a, b) => {
  let t = 0
  for (let x = a; x <= b; x++) t += f(s, x)
  return t
}
const support = s => Array.from({ length: high(s) - low(s) + 1 }, (_, i) => low(s) + i)
// 2598960 -> 2{,}598{,}960 (KaTeX keeps the commas tight)
const big = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}')
// A 5-card hand, An 8-card hand
const An = n => (/^(8|1[18](?!\d))/.test(String(n)) ? 'An' : 'A')

const PDF = 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}'
const filled = (s, x) => `\\frac{\\binom{${s.r}}{${x}}\\binom{${s.N - s.r}}{${s.n - x}}}{\\binom{${s.N}}{${s.n}}}`
const names = s => `N = ${s.N} in all, r = ${s.r} of the kind X counts, n = ${s.n} drawn.`

// Small populations, where every count prints. `wide` allows big samples, so
// the smallest possible value of X can be above 0 (the notes' N = 15, r = 6, n = 12).
const SMALL = [
  wide => {
    const N = randInt(10, 20)
    const r = randInt(3, N - 3)
    const n = wide ? randInt(4, N - 1) : randInt(3, Math.min(8, N - 2))
    return { N, r, n, text: `X is hypergeometric with N = ${N}, r = ${r}, n = ${n}.` }
  },
  wide => {
    const W = randInt(4, 9)
    const M = randInt(4, 9)
    const n = wide ? randInt(4, W + M - 2) : randInt(3, 6)
    const women = Math.random() < 0.5
    return {
      N: W + M,
      r: women ? W : M,
      n,
      text: `A club has ${W} women and ${M} men. A committee of ${n} is chosen at random. X is the number of ${women ? 'women' : 'men'} on the committee.`,
    }
  },
  wide => {
    const N = randInt(12, 30)
    const r = randInt(3, 8)
    const n = wide ? randInt(Math.max(3, N - r - 2), N - 2) : randInt(3, 7)
    return {
      N,
      r,
      n,
      text: `A shipment of ${N} parts contains ${r} defective ones. An inspector tests ${n} of the parts, chosen at random without replacement. X is the number of defective parts tested.`,
    }
  },
  () => {
    const kind = choice([
      { w: 'hearts', r: 13 },
      { w: 'aces', r: 4 },
      { w: 'face cards (jacks, queens and kings)', r: 12 },
      { w: 'red cards', r: 26 },
      { w: 'spades', r: 13 },
    ])
    const n = randInt(3, 6)
    return {
      N: 52,
      r: kind.r,
      n,
      text: `${An(n)} ${n}-card hand is dealt from a standard 52-card deck. X is the number of ${kind.w} in the hand (the deck has ${kind.r}).`,
    }
  },
  wide => {
    const R = randInt(3, 8)
    const B = randInt(3, 8)
    const n = wide ? randInt(3, R + B - 1) : randInt(3, 5)
    const red = Math.random() < 0.5
    return {
      N: R + B,
      r: red ? R : B,
      n,
      text: `A jar holds ${R} red and ${B} blue marbles. You draw ${n} of them without replacement. X is the number of ${red ? 'red' : 'blue'} marbles drawn.`,
    }
  },
  wide => {
    const N = randInt(15, 40)
    const r = randInt(4, 10)
    const n = wide ? randInt(Math.max(4, N - r - 3), N - 2) : randInt(4, 8)
    return {
      N,
      r,
      n,
      text: `A pond has ${N} fish, and ${r} of them are tagged. A biologist nets ${n} different fish. X is the number of tagged fish in the net.`,
    }
  },
  () => {
    const N = randInt(15, 30)
    const r = randInt(5, N - 5)
    const n = randInt(3, 6)
    return {
      N,
      r,
      n,
      text: `A class of ${N} students includes ${r} who did the reading. The professor calls on ${n} different students at random. X is the number of students called on who did the reading.`,
    }
  },
]

// Large populations, as in the notes' bottle example (N = 1000, r = 100, n = 20),
// plus a few small ones where the complement still saves work.
const LARGE = [
  () => {
    const N = choice([500, 800, 1000, 1200, 2000])
    const r = Math.round(N * choice([0.05, 0.08, 0.1, 0.12, 0.15]))
    const n = choice([10, 12, 15, 20, 25])
    return {
      N,
      r,
      n,
      text: `A machine fills ${N} bottles, and ${r} of them are underfilled. A sample of ${n} bottles is chosen at random and checked. X is the number of underfilled bottles in the sample.`,
    }
  },
  () => {
    const N = choice([400, 600, 750, 1000, 1500])
    const r = Math.round(N * choice([0.04, 0.06, 0.1, 0.2]))
    const n = choice([8, 10, 12, 15, 20])
    return {
      N,
      r,
      n,
      text: `A warehouse holds ${N} light bulbs, ${r} of them defective. A buyer tests ${n} bulbs chosen at random without replacement. X is the number of defective bulbs tested.`,
    }
  },
  () => {
    const N = choice([600, 900, 1500, 2400])
    const r = Math.round(N * choice([0.3, 0.4, 0.45, 0.55, 0.6]))
    const n = choice([6, 8, 10, 12])
    return {
      N,
      r,
      n,
      text: `A town has ${N} registered voters, and ${r} of them support a new park. A reporter interviews ${n} different voters chosen at random. X is the number of supporters interviewed.`,
    }
  },
  () => {
    const n = randInt(4, 8)
    return {
      N: 52,
      r: 4,
      n,
      text: `${An(n)} ${n}-card hand is dealt from a standard 52-card deck. X is the number of aces in the hand (the deck has 4).`,
    }
  },
  () => SMALL[1](false),
  () => SMALL[5](false),
]

// Probability events, with the mistakes students make on each.
function event(s, kind, k) {
  const below = c => total(s, 0, c) // P(X <= c)
  const termList = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
  const fs = xs => xs.map(x => `f(${x})`).join(' + ')
  const vs = xs => xs.map(x => num(f(s, x))).join(' + ')
  const group = (xs, inner) => (xs.length === 1 ? inner : `(${inner})`)
  const complement = (rel, c) => {
    const xs = termList(0, c)
    const lead = `P(X ${rel} ${k}) = 1 - ${xs.length === 1 ? fs(xs) : `[${fs(xs)}]`}`
    return `${lead} = 1 - ${group(xs, vs(xs))} = ${num(1 - below(c))}`
  }
  const direct = (rel, c) => {
    const xs = termList(0, c)
    return `P(X ${rel} ${k}) = ${fs(xs)} = ${xs.length === 1 ? '' : `${vs(xs)} = `}${num(below(c))}`
  }
  if (kind === 'ge')
    return {
      words: `at least ${k}`,
      latex: `P(X \\ge ${k})`,
      v: 1 - below(k - 1),
      shown: complement('\\ge', k - 1),
      wrong: [1 - below(k), below(k - 1), f(s, k)],
    }
  if (kind === 'gt')
    return {
      words: `more than ${k}`,
      latex: `P(X > ${k})`,
      v: 1 - below(k),
      shown: complement('>', k),
      wrong: [1 - below(k - 1), below(k), f(s, k)],
    }
  if (kind === 'le')
    return {
      words: `at most ${k}`,
      latex: `P(X \\le ${k})`,
      v: below(k),
      shown: direct('\\le', k),
      wrong: [below(k - 1), 1 - below(k), f(s, k)],
    }
  return {
    words: `fewer than ${k}`,
    latex: `P(X < ${k})`,
    v: below(k - 1),
    shown: direct('<', k - 1),
    wrong: [below(k), 1 - below(k - 1), f(s, k)],
  }
}

export default {
  id: 'hypergeometric',
  name: 'Hypergeometric',
  description: '§3.7: successes in a sample drawn without replacement.',
  learn: {
    formulas: [
      { label: 'pdf', latex: PDF },
      { label: 'Possible values', latex: '\\begin{gathered} x \\ge \\max(0,\\, n-(N-r)) \\\\ x \\le \\min(n,\\, r) \\end{gathered}' },
      { label: 'At least k: complement', latex: 'P(X \\ge k) = 1 - \\sum_{x=0}^{k-1} f(x)' },
      {
        label: 'Notes example: N = 15, r = 6, n = 12',
        latex: '\\begin{gathered} x = 3, 4, 5, 6 \\\\ P(X = 4) = \\frac{\\binom{6}{4}\\binom{9}{8}}{\\binom{15}{12}} \\approx 0.2967 \\end{gathered}',
      },
    ],
    how: [
      'Hypergeometric: a sample of n is drawn without replacement from a population of N that holds r successes. X counts the successes in the sample.',
      'Name the numbers first: N is everything, r is how many of the kind X counts, n is how many are drawn.',
      'All C(N, n) samples are equally likely. Exactly x successes: pick x of the r successes and n − x of the N − r failures, so f(x) = C(r, x)C(N − r, n − x)/C(N, n).',
      'Possible values: X is at most n and at most r. The sample can hold at most N − r failures, so X is at least n − (N − r) when that is positive.',
      'At least k: take 1 minus f(0) through f(k − 1), as in the notes\' bottle example (1000 bottles, 100 underfilled, 20 checked, P(X ≥ 3)).',
      'Without replacement is what makes it hypergeometric. Put each item back and the draws are independent: that is binomial.',
    ],
  },
  templates: [
    {
      id: 'exactly',
      generate() {
        const s = choice(SMALL)(false)
        const xs = support(s)
        const fair = xs.filter(x => f(s, x) >= 0.01)
        const x = choice(fair.length ? fair : xs)
        const v = f(s, x)
        const a = comb(s.r, x)
        const b = comb(s.N - s.r, s.n - x)
        const c = comb(s.N, s.n)
        return {
          ask: 'Sampling without replacement: find the probability.',
          text: s.text,
          latex: `P(X = ${x}) = \\,?`,
          answer: v,
          answerLatex: `\\displaystyle ${filled(s, x)} = \\frac{${big(a)} \\cdot ${big(b)}}{${big(c)}} = ${num(v)}`,
          placeholder: 'e.g. 0.297',
          tolerance: tolFor(v),
          hint: {
            latex: PDF,
            text: `${names(s)} Choose x of the r and n − x of the N − r, over all C(N, n) samples.`,
          },
          distractors: probs(
            binomPdf(s.n, s.r / s.N, x), // as if each draw were put back
            a / c, // forgot the failures
            total(s, 0, x), // P(X <= x)
            (a * b) / comb(s.N, s.r), // wrong bottom
            (comb(s.N - s.r, x) * comb(s.r, s.n - x)) / c, // counted the other kind
            1 - total(s, 0, x - 1), // P(X >= x)
          ).filter(d => Math.abs(d - v) > tolFor(v)),
        }
      },
    },
    {
      id: 'values',
      generate() {
        // more often than not, a sample big enough that X has a floor above 0
        const wantFloor = Math.random() < 0.6
        let s = choice(SMALL)(true)
        for (let i = 0; i < 40 && low(s) > 0 !== wantFloor; i++) s = choice(SMALL)(true)
        const lo = low(s)
        const hi = high(s)
        const ask = choice(['smallest', 'largest', 'count'])
        const fail = s.N - s.r
        if (ask === 'smallest') {
          return {
            ask: 'Find the possible values of X. What is the smallest one?',
            text: s.text,
            latex: '\\text{smallest } x = \\,?',
            answer: lo,
            answerLatex: `\\max(0,\\, n - (N - r)) = \\max(0,\\, ${s.n} - ${fail}) = ${lo}`,
            placeholder: 'a whole number',
            tolerance: 1e-6,
            hint: {
              latex: '\\max(0,\\, n-(N-r)) \\le x \\le \\min(n,\\, r)',
              text:
                lo > 0
                  ? `Only N − r = ${fail} items are failures, so a sample of ${s.n} holds at least ${s.n} − ${fail} = ${lo} successes.`
                  : `There are N − r = ${fail} failures, enough to fill all ${s.n} places in the sample, so X can be 0.`,
            },
            distractors: [0, s.n - s.r, lo + 1].filter(d => d >= 0 && d !== lo),
          }
        }
        if (ask === 'largest') {
          return {
            ask: 'Find the possible values of X. What is the largest one?',
            text: s.text,
            latex: '\\text{largest } x = \\,?',
            answer: hi,
            answerLatex: `\\min(n,\\, r) = \\min(${s.n},\\, ${s.r}) = ${hi}`,
            placeholder: 'a whole number',
            tolerance: 1e-6,
            hint: {
              latex: '\\max(0,\\, n-(N-r)) \\le x \\le \\min(n,\\, r)',
              text: `The sample has only ${s.n} items, and the population has only ${s.r} successes, so X is at most the smaller of the two.`,
            },
            distractors: [s.n, s.r, fail, s.n - 1].filter(d => d >= 0 && d !== hi),
          }
        }
        return {
          ask: 'Find all possible values of X. How many are there?',
          text: s.text,
          latex: '\\text{how many values} = \\,?',
          answer: hi - lo + 1,
          answerLatex: `\\min(n, r) - \\max(0, n - (N - r)) + 1 = ${hi} - ${lo} + 1 = ${hi - lo + 1}`,
          placeholder: 'a whole number',
          tolerance: 1e-6,
          hint: {
            latex: '\\max(0,\\, n-(N-r)) \\le x \\le \\min(n,\\, r)',
            text: `X runs from ${lo} to ${hi}. Count both ends: ${hi} − ${lo} + 1.`,
          },
          distractors: [hi - lo, s.n + 1, hi + 1].filter(d => d >= 0 && d !== hi - lo + 1),
        }
      },
    },
    {
      id: 'tail',
      generate() {
        for (;;) {
          const s = choice(LARGE)()
          const kind = choice(['ge', 'ge', 'gt', 'le', 'lt'])
          const k = randInt(1, 3)
          if (k + 1 > high(s)) continue
          const ev = event(s, kind, k)
          if (ev.v < 0.01 || ev.v > 0.99) continue
          return {
            ask: `Find the probability that X is ${ev.words}.`,
            text: s.text,
            latex: `${ev.latex} = \\,?`,
            answer: ev.v,
            answerLatex: ev.shown,
            placeholder: 'e.g. 0.32',
            tolerance: tolFor(ev.v),
            hint: {
              latex: 'P(X \\ge k) = 1 - \\sum_{x=0}^{k-1} f(x)',
              text: `${names(s)} Add the few small values of f; for "at least" or "more than", subtract them from 1.`,
            },
            distractors: probs(...ev.wrong),
          }
        }
      },
    },
    {
      id: 'setup',
      generate() {
        let s = choice(SMALL)(false)
        while (s.text.startsWith('X is hypergeometric')) s = choice(SMALL)(false)
        const xs = support(s).filter(x => f(s, x) >= 0.01)
        const x = choice(xs.length ? xs : support(s))
        const { N, r, n } = s
        const v = f(s, x)
        const cands = [
          {
            latex: `\\frac{\\binom{${r}}{${x}}\\binom{${N - r}}{${n - x}}}{\\binom{${N}}{${r}}}`,
            v: (comb(r, x) * comb(N - r, n - x)) / comb(N, r),
          },
          {
            latex: `\\binom{${n}}{${x}}\\left(\\frac{${r}}{${N}}\\right)^{${x}}\\left(\\frac{${N - r}}{${N}}\\right)^{${n - x}}`,
            v: binomPdf(n, r / N, x),
          },
          { latex: `\\frac{\\binom{${r}}{${x}}}{\\binom{${N}}{${n}}}`, v: comb(r, x) / comb(N, n) },
          {
            latex: `\\frac{\\binom{${r}}{${x}}\\binom{${N}}{${n - x}}}{\\binom{${N}}{${n}}}`,
            v: (comb(r, x) * comb(N, n - x)) / comb(N, n),
          },
          {
            latex: `\\frac{\\binom{${N - r}}{${x}}\\binom{${r}}{${n - x}}}{\\binom{${N}}{${n}}}`,
            v: (comb(N - r, x) * comb(r, n - x)) / comb(N, n),
          },
        ]
        const right = filled(s, x)
        const wrong = shuffle(cands.filter(c => c.latex !== right && Math.abs(c.v - v) > 1e-9 * Math.max(1, v)))
        const pick = lettered({ latex: `\\displaystyle ${right}` }, wrong.map(c => ({ latex: `\\displaystyle ${c.latex}` })))
        return {
          ask: `Set it up: which expression is P(X = ${x})?`,
          text: s.text,
          latex: `P(X = ${x}) = \\,?`,
          ...pick,
          answerLatex: `(${pick.answer})\\;\\; \\displaystyle ${right} = ${num(v)}`,
          placeholder: 'a, b, c or d',
          hint: {
            latex: PDF,
            text: `${names(s)} The draws are without replacement, so it is not binomial.`,
          },
        }
      },
    },
  ],
}
