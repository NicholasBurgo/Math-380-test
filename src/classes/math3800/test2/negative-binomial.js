import { randInt, choice, shuffle } from '../../../engine/rand.js'
import { comb, negBinPdf } from '../dist.js'
import { dec, lettered, num, probs, tolFor } from './util.js'

// Independent trials with the same p, run until the r-th success; X counts the
// trials. (Deriving the pdf itself is drilled in discrete-derive.)

const ord = r => `${r}${r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'}`
const succ = k => `${k} success${k === 1 ? '' : 'es'}`
const fail = k => `${k} failure${k === 1 ? '' : 's'}`

// Each story states p (as a decimal or a percent) and r (as an ordinal).
const STORIES = [
  {
    ps: [0.1, 0.15, 0.2, 0.25],
    say: (p, r) => `${Math.round(p * 100)}% of the lots a plant produces are defective, independently. X is the number of lots produced to get the ${ord(r)} defective lot.`,
  },
  {
    ps: [0.6, 0.7, 0.75, 0.8, 0.85, 0.9],
    say: (p, r) => `A basketball player makes each free throw with probability ${dec(p)}. X is the number of shots it takes to make the ${ord(r)} one.`,
  },
  {
    ps: [0.1, 0.2, 0.25, 0.3],
    say: (p, r) => `An oil company strikes oil at each new well with probability ${dec(p)}. X is the number of wells drilled to get the ${ord(r)} strike.`,
  },
  {
    ps: [0.2, 0.25, 0.3, 0.4],
    say: (p, r) => `Each sales call ends in a sale with probability ${dec(p)}, independently. X is the number of calls needed for the ${ord(r)} sale.`,
  },
  {
    ps: [0.4, 0.45, 0.55, 0.6, 0.65, 0.7],
    say: (p, r) => `A team wins each game with probability ${dec(p)}, independently. X is the number of games played to get the ${ord(r)} win.`,
  },
  {
    ps: [0.2, 0.25, 0.3, 0.35, 0.4],
    say: (p, r) => `Each job applicant is qualified with probability ${dec(p)}. X is the number of applicants interviewed to find the ${ord(r)} qualified one.`,
  },
]

function story(r) {
  const s = choice(STORIES)
  const p = choice(s.ps)
  return { p, text: s.say(p, r) }
}

const PDF = 'f(x) = \\binom{x-1}{r-1}p^r q^{x-r}, \\quad x = r, r+1, \\ldots'

export default {
  id: 'negative-binomial',
  name: 'Negative binomial',
  description: '§3.6: the trial on which the r-th success happens.',
  learn: {
    formulas: [
      { label: 'pdf (q = 1 − p)', latex: PDF },
      { label: 'Possible values', latex: 'X = r, r + 1, r + 2, \\ldots' },
      { label: 'Failures before the r-th success', latex: 'x - r' },
      { label: 'At most, more than', latex: 'P(X \\le x) = \\sum_{k=r}^{x} f(k), \\quad P(X > x) = 1 - P(X \\le x)' },
      { label: 'r = 1 is geometric', latex: 'f(x) = \\binom{x-1}{0}p\\,q^{x-1} = q^{x-1}p' },
    ],
    how: [
      'Negative binomial: independent trials with the same p, repeated until the r-th success. X is the number of trials that takes.',
      'X = x means trial x is a success and exactly r − 1 of the first x − 1 trials are successes.',
      'So f(x) = C(x − 1, r − 1) p^r q^(x−r): place the other r − 1 successes among the first x − 1 trials, then multiply r factors of p and x − r of q.',
      'The notes: 10% of lots defective, 20 lots to get the 3rd defective is C(19, 2)(0.1)^3(0.9)^17.',
      'X can never be less than r: you need at least r trials to get r successes. The other x − r trials are failures.',
      'At most x: add f(r) up to f(x). More than x: 1 minus that sum.',
      'Common slip: C(x, r) instead of C(x − 1, r − 1). The last trial is fixed as a success, so only the first x − 1 are arranged.',
    ],
  },
  templates: [
    {
      id: 'exactly',
      generate() {
        for (;;) {
          const r = randInt(2, 4)
          const s = story(r)
          const p = s.p
          const q = 1 - p
          const x = r + randInt(0, Math.max(4, Math.round((1.6 * r) / p) - r))
          const ans = negBinPdf(r, p, x)
          if (ans < 0.01) continue
          return {
            ask: 'Negative binomial: probability the r-th success comes on this trial.',
            text: s.text,
            latex: `P(X = ${x}) = \\,?`,
            answer: ans,
            answerLatex: `\\binom{${x - 1}}{${r - 1}}(${dec(p)})^{${r}}(${dec(q)})^{${x - r}} = ${num(ans)}`,
            placeholder: 'e.g. 0.0285',
            tolerance: tolFor(ans),
            hint: {
              latex: PDF,
              text: `Trial ${x} is the ${ord(r)} success, so the first ${x - 1} trials hold exactly ${succ(r - 1)}: C(${x - 1}, ${r - 1}) = ${comb(x - 1, r - 1)} ways. Each way has ${succ(r)} and ${fail(x - r)}.`,
            },
            distractors: probs(
              comb(x, r) * p ** r * q ** (x - r),
              comb(x - 1, r - 1) * p ** (r - 1) * q ** (x - r),
              comb(x - 1, r - 1) * q ** r * p ** (x - r),
              p ** r * q ** (x - r),
            ),
          }
        }
      },
    },
    {
      id: 'cumulative',
      generate() {
        for (;;) {
          const r = randInt(2, 4)
          const s = story(r)
          const p = s.p
          const f = k => negBinPdf(r, p, k)
          const kind = choice(['le', 'lt', 'gt', 'ge'])
          const x = r + { le: randInt(1, 3), lt: randInt(2, 4), gt: randInt(0, 3), ge: randInt(1, 4) }[kind]
          // the short sum runs from r to top; "more" events are 1 minus it
          const top = kind === 'le' || kind === 'gt' ? x : x - 1
          const comp = kind === 'gt' || kind === 'ge'
          const sum = to => {
            let t = 0
            for (let k = r; k <= to; k++) t += f(k)
            return t
          }
          const ans = comp ? 1 - sum(top) : sum(top)
          if (ans < 0.01 || ans > 0.99) continue
          const ks = []
          for (let k = r; k <= top; k++) ks.push(k)
          const fs = ks.map(k => `f(${k})`).join(' + ')
          const vs = ks.map(k => num(f(k))).join(' + ')
          const shown = !comp
            ? `${fs} = ${vs} = ${num(ans)}`
            : ks.length === 1
              ? `1 - f(${r}) = 1 - ${vs} = ${num(ans)}`
              : `1 - [${fs}] = 1 - (${vs}) = ${num(ans)}`
          const sym = { le: '\\le', lt: '<', gt: '>', ge: '\\ge' }[kind]
          // one term too few or too many, or the complement mixed up
          const wrong = comp ? [1 - sum(top - 1), 1 - sum(top + 1), sum(top)] : [sum(top - 1), sum(top + 1), 1 - sum(top)]
          return {
            ask: 'Negative binomial: add the terms, or use the complement.',
            text: s.text,
            latex: `P(X ${sym} ${x}) = \\,?`,
            answer: ans,
            answerLatex: shown,
            placeholder: 'e.g. 0.3174',
            tolerance: tolFor(ans),
            hint: {
              latex: `P(X ${sym} ${x}) = ${comp ? '1 - ' : ''}\\sum_{k=${r}}^{${top}} \\binom{k-1}{${r - 1}}(${dec(p)})^{${r}}(${dec(1 - p)})^{k-${r}}`,
              text: `X starts at r = ${r}, the fewest trials that can give ${r} successes. ${comp ? `This event is everything except X ≤ ${top}, so add f(${r}) through f(${top}) and subtract from 1.` : `Add f(k) for k = ${r} up to ${top}.`}`,
            },
            distractors: probs(...wrong),
          }
        }
      },
    },
    {
      id: 'possible',
      generate() {
        const r = randInt(2, 6)
        const s = story(r)
        const yes = Math.random() < 0.5
        const x = yes ? r + randInt(0, 8) : randInt(Math.max(1, r - 4), r - 1)
        return {
          ask: 'Can X take this value? Answer yes or no.',
          text: s.text,
          latex: `X = ${x}`,
          answer: yes ? 'yes' : 'no',
          placeholder: 'yes or no',
          hint: {
            latex: `X = ${r}, ${r + 1}, ${r + 2}, \\ldots`,
            text: `Getting ${r} successes takes at least ${r} trials, so X ≥ ${r}. Every whole number from ${r} up can happen.`,
          },
        }
      },
    },
    {
      id: 'failures',
      generate() {
        const r = randInt(2, 6)
        const kind = choice(['failures', 'trials', 'least'])
        if (kind === 'failures') {
          const x = r + randInt(1, 9)
          return {
            ask: 'Count the failures.',
            text: `X is the number of trials needed to get the ${ord(r)} success, and X = ${x}.`,
            latex: '\\text{number of failures} = \\,?',
            answer: x - r,
            answerLatex: `x - r = ${x} - ${r} = ${x - r}`,
            placeholder: 'e.g. 5',
            hint: {
              latex: `\\underbrace{${r}}_{\\text{successes}} + \\underbrace{${x - r}}_{\\text{failures}} = ${x}`,
              text: `The ${x} trials hold exactly ${succ(r)} (the last one is the ${ord(r)}), so ${x - r === 1 ? 'the other one is a failure' : `the other ${x - r} are failures`}. That is the q^(x − r) in f(x).`,
            },
            distractors: [x - r + 1, x - r - 1, x - 1, r],
          }
        }
        if (kind === 'trials') {
          const k = randInt(1, 9)
          return {
            ask: 'Find X.',
            text: `There ${k === 1 ? 'was' : 'were'} ${fail(k)} before the ${ord(r)} success. X is the number of trials it took.`,
            latex: 'X = \\,?',
            answer: r + k,
            answerLatex: `X = r + (\\text{failures}) = ${r} + ${k} = ${r + k}`,
            placeholder: 'e.g. 8',
            hint: {
              latex: 'X = r + (\\text{failures})',
              text: `Every trial is a success or a failure: ${succ(r)} (counting the last trial) plus ${fail(k)}.`,
            },
            distractors: [r + k - 1, r + k + 1, k],
          }
        }
        return {
          ask: 'Smallest possible value.',
          text: `X is the number of trials needed to get the ${ord(r)} success.`,
          latex: '\\min X = \\,?',
          answer: r,
          answerLatex: `\\min X = r = ${r}`,
          placeholder: 'e.g. 3',
          hint: {
            latex: 'X = r, r + 1, r + 2, \\ldots',
            text: `The fastest way to ${r} successes is ${r} successes in a row, so X starts at ${r}.`,
          },
          distractors: [r - 1, r + 1, 1],
        }
      },
    },
    {
      id: 'setup',
      generate() {
        for (;;) {
          const r = randInt(2, 4)
          const s = story(r)
          const p = s.p
          const x = r + randInt(1, 8)
          // keep every wrong form different from the right one
          if (p === 0.5 || x === 2 * r) continue
          const P = dec(p)
          const Q = dec(1 - p)
          const pick = lettered(
            { latex: `\\binom{${x - 1}}{${r - 1}}(${P})^{${r}}(${Q})^{${x - r}}` },
            shuffle([
              { latex: `\\binom{${x}}{${r}}(${P})^{${r}}(${Q})^{${x - r}}` },
              { latex: `\\binom{${x - 1}}{${r - 1}}(${P})^{${x - r}}(${Q})^{${r}}` },
              { latex: `\\binom{${x - 1}}{${r - 1}}(${P})^{${r - 1}}(${Q})^{${x - r}}` },
            ]),
          )
          return {
            ask: 'Which expression gives this probability?',
            text: s.text,
            latex: `P(X = ${x})`,
            ...pick,
            placeholder: 'a, b, c or d',
            hint: {
              latex: `f(${x}) = \\binom{${x} - 1}{${r} - 1}p^{${r}}q^{${x} - ${r}}`,
              text: `The last trial is the ${ord(r)} success, so only the first ${x - 1} trials are arranged: choose where the other ${succ(r - 1)} go. Then p = ${P} appears ${r} times and q = ${Q} appears ${x - r} ${x - r === 1 ? 'time' : 'times'}.`,
            },
          }
        }
      },
    },
  ],
}
