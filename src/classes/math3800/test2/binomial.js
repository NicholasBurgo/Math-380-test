import { randInt, choice } from '../../../engine/rand.js'
import { binomCdf, binomPdf, comb } from '../dist.js'
import { dec, num, probs, tolFor } from './util.js'

// n independent trials, each a success with the same p; X counts successes.
// Most stories state p. A fair coin or a guessed quiz makes you find it.
const PS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]

const STORIES = [
  { lead: 'A signal is identified correctly with probability', x: n => `the number of the next ${n} signals identified correctly` },
  { lead: 'A seed germinates with probability', x: n => `the number of ${n} planted seeds that germinate` },
  { lead: 'A basketball player makes each free throw with probability', x: n => `the number she makes in ${n} free throws` },
  { lead: 'A part from a machine is defective with probability', x: n => `the number of defective parts in a batch of ${n}` },
  { lead: 'A patient responds to a treatment with probability', x: n => `the number of ${n} patients who respond` },
  { lead: 'A flight arrives on time with probability', x: n => `the number of ${n} flights that arrive on time` },
  { lead: 'A customer pays by card with probability', x: n => `the number of the next ${n} customers who pay by card` },
]

function story(n) {
  const r = Math.random()
  if (r < 0.1) return { p: 0.5, text: `A fair coin is flipped ${n} times. X is the number of heads.` }
  if (r < 0.22) {
    const m = choice([4, 5])
    return {
      p: 1 / m,
      text: `A ${n}-question multiple-choice quiz has ${m} choices per question, and you guess on every one. X is the number you get right.`,
    }
  }
  const s = choice(STORIES)
  const p = choice(PS)
  return { p, text: `${s.lead} ${dec(p)}, independently. X is ${s.x(n)}.` }
}

// p^k as a factor: (0.3)^{4}
const pw = (p, k) => `(${dec(p)})^{${k}}`

export default {
  id: 'binomial',
  name: 'Binomial distribution',
  description: '§3.5: exactly, at most, at least; mean and variance; the binomial theorem.',
  learn: {
    formulas: [
      { label: 'pdf (q = 1 − p)', latex: 'f(x) = \\binom{n}{x}p^x q^{n-x}, \\quad x = 0, 1, \\ldots, n' },
      { label: 'Binomial coefficient', latex: '\\binom{n}{x} = \\frac{n!}{x!\\,(n-x)!}' },
      { label: 'At least one', latex: 'P(X \\ge 1) = 1 - P(X = 0) = 1 - q^n' },
      { label: 'Mean and variance', latex: 'E[X] = np, \\quad \\operatorname{Var}X = npq, \\quad \\sigma = \\sqrt{npq}' },
      { label: 'Binomial theorem', latex: '(a + b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^k b^{n-k}' },
    ],
    how: [
      'Binomial: a fixed number n of independent trials, each a success with the same probability p. X counts the successes.',
      'Exactly x: C(n, x) ways to choose which trials succeed, and each way has probability p^x q^(n−x). The signals example: C(10, 7)(0.9)^7(0.1)^3.',
      'At most x: add f(0) through f(x). At least x: add f(x) through f(n), or take 1 − P(X ≤ x − 1), whichever has fewer terms.',
      'At least one: 1 − P(X = 0) = 1 − q^n.',
      'Mean np, variance npq, standard deviation √(npq).',
      'Binomial theorem: the x^k term of (ax + b)^n is C(n, k)(ax)^k b^(n−k), so its coefficient is C(n, k)a^k b^(n−k). Keep the sign: in (2x − 3)^5, b = −3.',
    ],
  },
  templates: [
    {
      id: 'exactly',
      generate() {
        for (;;) {
          const n = randInt(5, 15)
          const s = story(n)
          const p = s.p
          const q = 1 - p
          const x = Math.min(n, Math.max(0, Math.round(n * p) + randInt(-2, 2)))
          const ans = binomPdf(n, p, x)
          if (ans < 0.01) continue
          return {
            ask: 'Binomial: probability of exactly this many successes.',
            text: s.text,
            latex: `P(X = ${x}) = \\,?`,
            answer: ans,
            answerLatex: `\\binom{${n}}{${x}}${pw(p, x)}${pw(q, n - x)} = ${comb(n, x)}(${num(p ** x)})(${num(q ** (n - x))}) = ${num(ans)}`,
            placeholder: 'e.g. 0.0574',
            tolerance: tolFor(ans),
            hint: {
              latex: 'P(X = x) = \\binom{n}{x}p^x q^{n-x}',
              text: `Here n = ${n}, x = ${x}, p = ${dec(p)} and q = ${dec(q)}. C(${n}, ${x}) = ${comb(n, x)} counts the ways to place the ${x} successes; each way has ${x} factors of p and ${n - x} of q.`,
            },
            distractors: probs(p ** x * q ** (n - x), comb(n, x) * q ** x * p ** (n - x), binomCdf(n, p, x), comb(n, x) * p ** x),
          }
        }
      },
    },
    {
      id: 'cumulative',
      generate() {
        for (;;) {
          const n = randInt(4, 10)
          const s = story(n)
          const p = s.p
          const q = 1 - p
          const f = k => binomPdf(n, p, k)
          const sum = (lo, hi) => {
            let t = 0
            for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) t += f(k)
            return t
          }
          const kind = choice(['le', 'lt', 'ge', 'gt', 'one'])
          const x = kind === 'one' ? 1 : randInt(1, n - 1)
          // the event keeps the values lo..hi
          const ev = {
            le: { lo: 0, hi: x, latex: `P(X \\le ${x})` },
            lt: { lo: 0, hi: x - 1, latex: `P(X < ${x})` },
            ge: { lo: x, hi: n, latex: `P(X \\ge ${x})` },
            gt: { lo: x + 1, hi: n, latex: `P(X > ${x})` },
            one: { lo: 1, hi: n, latex: 'P(X \\ge 1)' },
          }[kind]
          const { lo, hi } = ev
          const kept = hi - lo + 1
          const rest = n + 1 - kept
          // keep the arithmetic short: three terms at most on the side we add
          if (kept < 1 || rest < 1 || Math.min(kept, rest) > 3) continue
          const ans = sum(lo, hi)
          if (ans < 0.01 || ans > 0.99) continue
          const direct = kept <= rest
          // the values on the side we add up
          const [a, b] = direct ? [lo, hi] : lo === 0 ? [hi + 1, n] : [0, lo - 1]
          const ks = []
          for (let k = a; k <= b; k++) ks.push(k)
          const fs = ks.map(k => `f(${k})`).join(' + ')
          const vs = ks.map(k => num(f(k))).join(' + ')
          let shown
          if (kind === 'one') shown = `1 - P(X = 0) = 1 - ${pw(q, n)} = ${num(ans)}`
          else if (direct) shown = ks.length === 1 ? `f(${a}) = ${num(ans)}` : `${fs} = ${vs} = ${num(ans)}`
          else shown = ks.length === 1 ? `1 - f(${a}) = 1 - ${vs} = ${num(ans)}` : `1 - [${fs}] = 1 - (${vs}) = ${num(ans)}`
          const other = lo === 0 ? `P(X \\ge ${hi + 1})` : `P(X \\le ${lo - 1})`
          // off by one at the end that moves, or the complement
          const wrong = lo === 0 ? [sum(0, hi - 1), sum(0, hi + 1), 1 - ans] : [sum(lo + 1, n), sum(lo - 1, n), 1 - ans]
          if (kind === 'one') wrong.push(f(1))
          return {
            ask: kind === 'one' ? 'Binomial: at least one. Use the complement.' : 'Binomial: add the short side, or use the complement.',
            text: s.text,
            latex: `${ev.latex} = \\,?`,
            answer: ans,
            answerLatex: shown,
            placeholder: 'e.g. 0.6778',
            tolerance: tolFor(ans),
            hint: {
              latex: direct ? `${ev.latex} = ${ks.map(k => `f(${k})`).join(' + ')}` : `${ev.latex} = 1 - ${other}`,
              text: `f(k) = C(${n}, k)(${dec(p)})^k(${dec(q)})^(${n} − k), for k = 0 to ${n}. Add whichever side has fewer terms; if it is the other side, subtract it from 1.`,
            },
            distractors: probs(...wrong),
          }
        }
      },
    },
    {
      id: 'mean-var',
      generate() {
        const n = Math.random() < 0.5 ? randInt(5, 30) : 10 * randInt(2, 10)
        const s = story(n)
        const p = s.p
        const q = 1 - p
        const P = dec(p)
        const Q = dec(q)
        const mean = n * p
        const v = n * p * q
        const sd = Math.sqrt(v)
        const ask = choice([
          { latex: 'E[X] = \\,?', v: mean, shown: `np = ${n}(${P}) = ${num(mean)}`, wrong: [n * q, v, n * p * p] },
          { latex: '\\operatorname{Var}X = \\,?', v, shown: `npq = ${n}(${P})(${Q}) = ${num(v)}`, wrong: [mean, sd, n * p * p] },
          { latex: '\\sigma = \\,?', v: sd, shown: `\\sqrt{npq} = \\sqrt{${num(v)}} = ${num(sd)}`, wrong: [v, Math.sqrt(mean), Math.sqrt(n) * p] },
        ])
        return {
          ask: 'Binomial mean and variance.',
          text: s.text,
          latex: ask.latex,
          answer: ask.v,
          answerLatex: ask.shown,
          placeholder: 'e.g. 4.8',
          tolerance: Math.max(0.005, Math.abs(ask.v) * 0.002),
          hint: {
            latex: 'E[X] = np, \\quad \\operatorname{Var}X = npq, \\quad \\sigma = \\sqrt{npq}',
            text: `n = ${n} trials, p = ${P}, q = ${Q}. On average you expect a fraction p of the trials to succeed; the variance carries the extra factor q, and σ is its square root.`,
          },
          distractors: ask.wrong.filter(w => Math.abs(w - ask.v) > 1e-9),
        }
      },
    },
    {
      id: 'theorem',
      generate() {
        for (;;) {
          const n = randInt(3, 7)
          const a = choice([1, 1, 2, 3])
          const b = choice([-3, -2, -1, 1, 2, 3])
          const k = randInt(1, n - 1)
          const coef = comb(n, k) * a ** k * b ** (n - k)
          if (Math.abs(coef) > 5000) continue
          const ax = a === 1 ? 'x' : `${a}x`
          const xk = k === 1 ? 'x' : `x^{${k}}`
          const B = b < 0 ? `−${-b}` : `${b}`
          // C(n,k) a^k b^(n-k), leaving out factors that are 1
          const factors = [`\\binom{${n}}{${k}}`]
          const values = [comb(n, k)]
          if (a !== 1) {
            factors.push(`(${a})^{${k}}`)
            values.push(a ** k)
          }
          if (b !== 1) {
            factors.push(`(${b})^{${n - k}}`)
            values.push(b ** (n - k))
          }
          const product = values.length > 1 ? ` = ${values.map(v => (v < 0 ? `(${v})` : `${v}`)).join(' \\cdot ')}` : ''
          return {
            ask: 'Binomial theorem.',
            latex: `\\text{coefficient of } ${xk} \\text{ in } (${ax} ${b < 0 ? '-' : '+'} ${Math.abs(b)})^{${n}}`,
            size: 'small',
            answer: coef,
            answerLatex: `${factors.join('')}${product} = ${coef}`,
            placeholder: 'e.g. 720',
            hint: {
              latex: '(a + b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^k b^{n-k}',
              text: `Use a = ${ax} and b = ${B}. The ${k === 1 ? 'x' : `x^${k}`} term is C(${n}, ${k})(${ax})^${k}(${B})^${n - k}: the power on x picks k, and b gets the other ${n - k}. Keep the sign of b.`,
            },
            distractors: [comb(n, k), comb(n, k) * a ** (n - k) * b ** k, a ** k * b ** (n - k), -coef],
          }
        }
      },
    },
  ],
}
