import { choice, randInt } from '../../../engine/rand.js'
import { binomPdf, hyperPdf, negBinPdf } from '../dist.js'
import { BOX, derivation, dec, formula, lettered, someP } from './util.js'

// The derivations the study guide asks for (binomial, negative binomial and
// hypergeometric pdfs; binomial and Poisson pdfs sum to 1), drilled one step
// at a time like geometric-derive.js: the lines so far, then a box to fill.

const VARS = ['n', 'x', 'p', 'q', 'r', 'N', 'k']
// Every point sets all seven letters, with q = 1 - p and the whole numbers
// valid together for that distribution, so every wrong form misses somewhere.
const BIN = [
  { n: 5, x: 2, p: 0.3, q: 0.7, r: 2, N: 9, k: 1.5 },
  { n: 7, x: 4, p: 0.55, q: 0.45, r: 3, N: 12, k: 2.2 },
  { n: 4, x: 1, p: 0.8, q: 0.2, r: 1, N: 6, k: 0.7 },
  { n: 9, x: 6, p: 0.15, q: 0.85, r: 4, N: 15, k: 3.1 },
]
// negative binomial: x >= r
const NEG = [
  { n: 6, x: 5, p: 0.3, q: 0.7, r: 2, N: 10, k: 1.5 },
  { n: 8, x: 7, p: 0.55, q: 0.45, r: 4, N: 12, k: 2.2 },
  { n: 4, x: 3, p: 0.8, q: 0.2, r: 3, N: 9, k: 0.7 },
  { n: 9, x: 8, p: 0.15, q: 0.85, r: 5, N: 15, k: 3.1 },
]
// hypergeometric: max(0, n - (N - r)) <= x <= min(n, r), and r is neither n nor N - n
const HYP = [
  { n: 4, x: 2, p: 0.3, q: 0.7, r: 5, N: 12, k: 1.5 },
  { n: 7, x: 4, p: 0.55, q: 0.45, r: 6, N: 10, k: 2.2 },
  { n: 6, x: 1, p: 0.8, q: 0.2, r: 4, N: 15, k: 0.7 },
  { n: 5, x: 3, p: 0.15, q: 0.85, r: 3, N: 9, k: 3.1 },
]
// Poisson: k > 0, k never 1
const POI = [
  { n: 5, x: 2, p: 0.3, q: 0.7, r: 2, N: 9, k: 1.5 },
  { n: 7, x: 0, p: 0.55, q: 0.45, r: 3, N: 12, k: 3.2 },
  { n: 4, x: 4, p: 0.8, q: 0.2, r: 1, N: 6, k: 0.6 },
  { n: 9, x: 3, p: 0.15, q: 0.85, r: 4, N: 15, k: 4 },
]
// p and q as separate letters: the binomial theorem step, before p + q = 1 is used
const FREE = [
  { n: 5, x: 2, p: 0.3, q: 0.5, r: 2, N: 9, k: 1.5 },
  { n: 3, x: 1, p: 0.2, q: 0.9, r: 1, N: 6, k: 0.7 },
  { n: 7, x: 4, p: 0.6, q: 0.15, r: 3, N: 12, k: 2.2 },
]
const box = (points, rest, opts) =>
  formula({ vars: VARS, points, placeholder: 'formula in n, x, p, q, r, N, k', size: 'derivation', ...opts, ...rest })

// one particular order of x successes and n - x failures
const ORDER = 'P(\\underbrace{S \\cdots S}_{x}\\,\\underbrace{F \\cdots F}_{n-x})'
const BIN_LINES = [`${ORDER} &= p^xq^{n-x}`, '\\text{number of orders} &= \\binom{n}{x}']
const BIN_SUM = '\\sum_{x=0}^{n} f(x) &= \\sum_{x=0}^{n} \\binom{n}{x}p^xq^{n-x}'
// The class notes' derivation: the last trial is the r-th success, so it is r - 1
// successes somewhere in the first x - 1 trials, times p for the last one.
const NEG_FIRST = 'P(r-1 \\text{ successes in } x-1 \\text{ trials})'
const NEG_LINES = [`f(x) &= ${NEG_FIRST} \\cdot p`, '&= \\binom{x-1}{r-1}p^{r-1}q^{(x-1)-(r-1)} \\cdot p']
const NEG_ASK = 'X is the number of trials needed for r successes, so the last trial is a success.'
const HYP_LINES = ['\\#\\,\\text{samples} &= \\binom{N}{n}', '\\#\\,\\text{favorable} &= \\binom{r}{x}\\binom{N-r}{n-x}']
const HYP_ASK = 'A sample of n is drawn without replacement from N items, r of them successes. Favorable samples hold exactly x successes.'
const POI_LINES = [
  '\\sum_{x=0}^{\\infty} f(x) &= \\sum_{x=0}^{\\infty} \\frac{e^{-k}k^x}{x!}',
  '&= e^{-k}\\sum_{x=0}^{\\infty} \\frac{k^x}{x!}',
]

const ORD = r => `${r}${r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'}`

// Typed-formula points where the pdf is not tiny (f(x) >= 0.005), at most six,
// spread out: far in a tail every form is near 0 and the forms can't be told apart.
function bulk(xs, pdf) {
  const big = xs.filter(x => pdf(x) >= 0.005)
  if (big.length <= 6) return big.map(x => ({ x }))
  return [0, 1, 2, 3, 4, 5].map(i => ({ x: big[Math.round((i * (big.length - 1)) / 5)] }))
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

export default {
  id: 'discrete-derive',
  name: 'Deriving discrete pdfs',
  description: '§3.5–3.8: derive the binomial, negative binomial and hypergeometric pdfs; show a pdf sums to 1.',
  learn: {
    formulas: [
      { label: 'Binomial, x = 0, 1, …, n', latex: 'f(x) = \\binom{n}{x}p^xq^{n-x}' },
      { label: 'Negative binomial, x = r, r + 1, …', latex: 'f(x) = \\binom{x-1}{r-1}p^rq^{x-r}' },
      { label: 'Hypergeometric', latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}' },
      { label: 'Binomial theorem', latex: '(a+b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^kb^{n-k}' },
      { label: 'Maclaurin series', latex: 'e^z = \\sum_{k=0}^{\\infty}\\frac{z^k}{k!}' },
      { label: 'A pdf', latex: 'f(x) \\ge 0 \\text{ for all } x, \\quad \\sum_x f(x) = 1' },
    ],
    how: [
      'Binomial: one particular order of x successes and n − x failures has probability p^x q^(n−x), because independent trials multiply.',
      'There are C(n, x) such orders (choose which x trials succeed), each with that same probability, so f(x) = C(n, x)p^x q^(n−x).',
      'Binomial sums to 1: every term is ≥ 0, and by the binomial theorem with a = p, b = q the sum is (p + q)^n = 1^n = 1.',
      'Negative binomial (the class notes): X counts the trials needed for r successes, so the last trial is a success. f(x) = P(r − 1 successes in x − 1 trials) · p = C(x − 1, r − 1)p^(r−1)q^((x−1)−(r−1)) · p = C(x − 1, r − 1)p^r q^(x−r).',
      'Hypergeometric: all C(N, n) samples are equally likely. The favorable ones pick x of the r successes and n − x of the N − r failures: C(r, x)C(N − r, n − x).',
      'Poisson sums to 1: pull e^(−k) out of the sum; Σ k^x/x! is the Maclaurin series of e^z at z = k, so the total is e^(−k)e^k = 1.',
    ],
  },
  templates: [
    {
      id: 'binom-order',
      generate() {
        return box(
          BIN,
          {
            ask: 'X counts successes in n independent trials. Derive the pdf: what is the probability of one particular order?',
            latex: derivation([`${ORDER} &= ${BOX}`]),
            hint: {
              latex: 'P(S)\\cdots P(S)\\,P(F)\\cdots P(F) = p^xq^{n-x}',
              text: 'Independent trials multiply: x factors of p for the successes, n − x factors of q for the failures.',
            },
          },
          { answer: 'p^xq^(n-x)', choices: ['p^(n-x)q^x', 'p^x', 'C(n,x)p^xq^(n-x)'] },
        )
      },
    },
    {
      id: 'binom-count',
      generate() {
        return box(
          BIN,
          {
            ask: 'Derive the binomial pdf. How many orders of x successes and n − x failures are there?',
            latex: derivation([BIN_LINES[0], `\\text{number of orders} &= ${BOX}`]),
            hint: {
              latex: '\\binom{n}{x} = \\frac{n!}{x!\\,(n-x)!}',
              text: 'An order is fixed once you choose which x of the n trial positions are successes. Order among them does not matter.',
            },
          },
          { answer: 'C(n,x)', choices: ['n!', 'n!/(n-x)!', 'n^x'] },
        )
      },
    },
    {
      id: 'binom-result',
      generate() {
        return box(
          BIN,
          {
            ask: 'Derive the binomial pdf. Put the pieces together: what goes in the box?',
            latex: derivation([...BIN_LINES, `f(x) &= ${BOX}`]),
            hint: {
              latex: 'f(x) = \\binom{n}{x}p^xq^{n-x}, \\quad x = 0, 1, \\ldots, n',
              text: 'The orders are disjoint and each has probability p^x q^(n−x), so add C(n, x) copies of it.',
            },
          },
          { answer: 'C(n,x)p^xq^(n-x)', choices: ['p^xq^(n-x)', 'C(n,x)p^(n-x)q^x', 'C(n,x)p^x'] },
        )
      },
    },
    {
      id: 'binom-sum',
      generate() {
        const part = choice([
          { lines: ['&= (a + b)^n', `a &= ${BOX}`], answer: 'p', choices: ['q', '1', 'x'], what: 'the a of the binomial theorem' },
          { lines: ['&= (a + b)^n', `a &= p, \\quad b = ${BOX}`], answer: 'q', choices: ['p', 'pq', '1'], what: 'the b of the binomial theorem' },
          {
            lines: [`&= ${BOX}`],
            answer: '(p+q)^n',
            choices: ['p^n+q^n', '(p+q)^x', '1'],
            what: 'the sum, keeping p and q as letters (before using p + q = 1)',
            points: FREE,
          },
        ])
        return box(
          part.points ?? BIN,
          {
            ask: `Show the binomial pdf sums to 1 with the binomial theorem. Fill in ${part.what}.`,
            latex: derivation([BIN_SUM, ...part.lines]),
            hint: {
              latex: '\\sum_{x=0}^{n}\\binom{n}{x}p^xq^{n-x} = (p+q)^n = 1^n = 1',
              text: 'Match Σ C(n, k)a^k b^(n−k): the base raised to the x is a = p, the other is b = q. Then p + q = 1.',
            },
          },
          { answer: part.answer, choices: part.choices },
        )
      },
    },
    {
      id: 'negbin-split',
      generate() {
        const part = choice([
          {
            lines: [`f(x) &= ${NEG_FIRST} \\cdot ${BOX}`],
            answer: 'p',
            choices: ['q', 'p^r', '1'],
            hint: {
              latex: 'P(S \\text{ on trial } x) = p',
              text: 'The last trial is the r-th success itself. It is independent of the earlier trials, so it adds a factor p.',
            },
          },
          {
            lines: [NEG_LINES[0], `&= ${BOX} \\cdot p`],
            answer: 'C(x-1,r-1)p^(r-1)q^(x-r)',
            choices: ['C(x,r)p^(r-1)q^(x-r)', 'C(x-1,r-1)p^rq^(x-r)', 'p^(r-1)q^(x-r)'],
            hint: {
              latex: '\\binom{x-1}{r-1}p^{r-1}q^{(x-1)-(r-1)}',
              text: 'The first x − 1 trials are binomial: C(x − 1, r − 1) ways to place the r − 1 successes, each way with probability p^(r−1) times q for every failure.',
            },
          },
          {
            lines: [NEG_LINES[0], `&= \\binom{x-1}{r-1}p^{r-1}q^{${BOX}} \\cdot p`],
            answer: '(x-1)-(r-1)',
            choices: ['x-1', 'r-1', 'x'],
            hint: {
              latex: '(x-1) - (r-1) = x - r',
              text: 'The power of q counts the failures: x − 1 trials, r − 1 of them successes, so (x − 1) − (r − 1) = x − r failures.',
            },
          },
        ])
        return box(
          NEG,
          {
            ask: `${NEG_ASK} Derive the pdf: what goes in the box?`,
            latex: derivation(part.lines),
            hint: part.hint,
          },
          { answer: part.answer, choices: part.choices },
        )
      },
    },
    {
      id: 'negbin-result',
      generate() {
        return box(
          NEG,
          {
            ask: `${NEG_ASK} Put the pieces together: what goes in the box?`,
            latex: derivation([...NEG_LINES, `&= ${BOX}`]),
            hint: {
              latex: 'f(x) = \\binom{x-1}{r-1}p^rq^{x-r}, \\quad x = r, r+1, \\ldots',
              text: 'p^(r−1) times p is p^r, and (x − 1) − (r − 1) = x − r. The count stays C(x − 1, r − 1): the last trial is not free to move.',
            },
          },
          { answer: 'C(x-1,r-1)p^rq^(x-r)', choices: ['C(x,r)p^rq^(x-r)', 'C(x-1,r-1)p^(r-1)q^(x-r)', 'C(x-1,r)p^rq^(x-r)'] },
        )
      },
    },
    {
      id: 'hyper-count',
      generate() {
        const part = choice([
          {
            lines: [`\\#\\,\\text{samples} &= ${BOX}`],
            answer: 'C(N,n)',
            choices: ['N^n', 'N!/(N-n)!', 'C(N,r)'],
            hint: {
              latex: '\\binom{N}{n}',
              text: 'Without replacement and without order, a sample is a subset of size n: C(N, n) of them, all equally likely.',
            },
          },
          {
            lines: [HYP_LINES[0], `\\#\\,\\text{favorable} &= ${BOX}`],
            answer: 'C(r,x)C(N-r,n-x)',
            choices: ['C(r,x)C(N,n-x)', 'C(r,x)+C(N-r,n-x)', 'C(r,x)C(N-r,n)'],
            hint: {
              latex: '\\binom{r}{x}\\binom{N-r}{n-x}',
              text: 'Multiplication rule: choose which x of the r successes, and which n − x of the N − r failures.',
            },
          },
        ])
        return box(
          HYP,
          {
            ask: `${HYP_ASK} Count: what goes in the box?`,
            latex: derivation(part.lines),
            hint: part.hint,
          },
          { answer: part.answer, choices: part.choices },
        )
      },
    },
    {
      id: 'hyper-result',
      generate() {
        return box(
          HYP,
          {
            ask: `${HYP_ASK} Derive the pdf: what goes in the box?`,
            latex: derivation([...HYP_LINES, `f(x) &= ${BOX}`]),
            hint: {
              latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}',
              text: 'Every sample is equally likely, so the probability is favorable samples over all samples.',
            },
          },
          { answer: 'C(r,x)C(N-r,n-x)/C(N,n)', choices: ['C(r,x)C(N-r,n-x)/C(N,r)', 'C(r,x)/C(N,n)', 'C(n,x)(r/N)^x(1-r/N)^(n-x)'] },
        )
      },
    },
    {
      id: 'poisson-sum',
      generate() {
        const part = choice([
          {
            lines: [POI_LINES[0], `&= ${BOX}\\sum_{x=0}^{\\infty} \\frac{k^x}{x!}`],
            answer: 'e^(-k)',
            choices: ['e^k', 'k', 'e^(-x)'],
            what: 'Pull out what does not depend on x',
            hint: {
              latex: '\\frac{e^{-k}k^x}{x!} = e^{-k} \\cdot \\frac{k^x}{x!}',
              text: 'e^(−k) is the same in every term, so it comes out in front of the sum.',
            },
          },
          {
            lines: [...POI_LINES, `&= e^{-k} \\cdot ${BOX}`],
            answer: 'e^k',
            choices: ['1/(1-k)', 'ke^k', 'e^(-k)'],
            what: 'Sum the series',
            hint: {
              latex: 'e^z = \\sum_{k=0}^{\\infty} \\frac{z^k}{k!}',
              text: 'The Maclaurin series of e^z with z = k: Σ k^x/x! = e^k. Then e^(−k)e^k = 1.',
            },
          },
        ])
        return box(
          POI,
          {
            ask: `Show the Poisson pdf sums to 1. ${part.what}: what goes in the box?`,
            latex: derivation(part.lines),
            hint: part.hint,
          },
          { answer: part.answer, choices: part.choices },
        )
      },
    },
    {
      id: 'why',
      generate() {
        const STEPS = [
          {
            step: 'P(SS\\cdots S\\,FF\\cdots F) = p^xq^{n-x}',
            right: 'The trials are independent, so the probabilities multiply.',
          },
          {
            step: '\\#\\{\\text{orders with } x \\text{ successes}\\} = \\binom{n}{x}',
            right: 'Choose which x of the n trials are the successes.',
          },
          {
            step: '\\sum_{x=0}^{n}\\binom{n}{x}p^xq^{n-x} = (p+q)^n',
            right: 'The binomial theorem, with a = p and b = q.',
          },
          {
            step: '(p+q)^n = 1^n = 1',
            right: 'Since q = 1 − p, p + q = 1.',
          },
          {
            step: '\\sum_{x=0}^{\\infty}\\frac{k^x}{x!} = e^k',
            right: 'The Maclaurin series of e^z, with z = k.',
          },
          {
            step: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}',
            right: 'All C(N, n) samples are equally likely: favorable samples over all samples.',
          },
          {
            step: '\\#\\,\\text{favorable} = \\binom{r}{x}\\binom{N-r}{n-x}',
            right: 'Multiplication rule: x of the r successes and n − x of the N − r failures.',
          },
          {
            step: `f(x) = ${NEG_FIRST} \\cdot p`,
            right: 'The last trial is the r-th success: r − 1 successes in the first x − 1 trials, then a success.',
          },
          {
            step: '\\frac{e^{-k}k^x}{x!} \\ge 0',
            right: 'e^(−k), k^x and x! are all positive when k > 0.',
          },
        ]
        const s = choice(STEPS)
        const wrong = STEPS.filter(o => o !== s)
          .map(o => o.right)
          .sort(() => Math.random() - 0.5)
        const pick = lettered(s.right, wrong)
        return {
          ask: 'Deriving discrete pdfs: why is this step true?',
          latex: s.step,
          size: 'small',
          ...pick,
          // the hint below spells the reason out as wrapping text; inside KaTeX it would not wrap
          answerLatex: `\\text{(${pick.answer})}`,
          placeholder: 'a, b, c or d',
          hint: { latex: s.step, text: s.right },
        }
      },
    },
    {
      id: 'numbers',
      generate() {
        const kind = choice(['bin', 'neg', 'hyp'])
        const p = someP([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.9])
        const P = dec(p)
        const Q = dec(1 - p)
        if (kind === 'bin') {
          const n = randInt(4, 12)
          return formula({
            ask: `X counts the successes in ${n} independent trials with p = ${P}. Derive its pdf and type f(x).`,
            latex: 'f(x) = \\,?',
            vars: ['x'],
            points: bulk(range(0, n), x => binomPdf(n, p, x)),
            answer: `C(${n},x)*${P}^x*${Q}^(${n}-x)`,
            choices: [`C(${n},x)*${Q}^x*${P}^(${n}-x)`, `${P}^x*${Q}^(${n}-x)`, `C(${n},x)*${P}^x`],
            placeholder: 'f(x) in terms of x, e.g. C(8,x)*0.3^x*0.7^(8-x)',
            hint: {
              latex: 'f(x) = \\binom{n}{x}p^xq^{n-x}',
              text: `One order of x successes has probability ${P}^x · ${Q}^(${n} − x), and there are C(${n}, x) orders.`,
            },
          })
        }
        if (kind === 'neg') {
          const r = randInt(2, 4)
          return formula({
            ask: `Independent trials succeed with p = ${P}. X is the trial on which the ${ORD(r)} success occurs. Derive its pdf and type f(x).`,
            latex: `f(x) = \\,?, \\quad x = ${r}, ${r + 1}, \\ldots`,
            vars: ['x'],
            points: bulk(range(r, r + 200), x => negBinPdf(r, p, x)),
            answer: `C(x-1,${r - 1})*${P}^${r}*${Q}^(x-${r})`,
            choices: [`C(x,${r})*${P}^${r}*${Q}^(x-${r})`, `C(x-1,${r - 1})*${P}^${r - 1}*${Q}^(x-${r})`, `C(x-1,${r})*${P}^${r}*${Q}^(x-${r})`],
            placeholder: 'f(x) in terms of x, e.g. C(x-1,2)*0.4^3*0.6^(x-3)',
            hint: {
              latex: 'f(x) = \\binom{x-1}{r-1}p^rq^{x-r}',
              text: `${r - 1} successes somewhere in the first x − 1 trials, then a success on trial x: C(x − 1, ${r - 1})·${P}^${r}·${Q}^(x − ${r}).`,
            },
          })
        }
        let N
        let r
        let n
        do {
          N = randInt(10, 20)
          r = randInt(3, 8)
          n = randInt(3, 6)
        } while (r === n || r === N - n)
        const lo = Math.max(0, n - (N - r))
        const hi = Math.min(n, r)
        return formula({
          ask: `A sample of ${n} is drawn without replacement from ${N} items, ${r} of them successes. X counts the successes in the sample. Derive its pdf and type f(x).`,
          latex: 'f(x) = \\,?',
          vars: ['x'],
          points: bulk(range(lo, hi), x => hyperPdf(N, r, n, x)),
          answer: `C(${r},x)*C(${N - r},${n}-x)/C(${N},${n})`,
          choices: [`C(${r},x)*C(${N - r},${n}-x)/C(${N},${r})`, `C(${r},x)/C(${N},${n})`, `C(${n},x)*(${r}/${N})^x*(${N - r}/${N})^(${n}-x)`],
          placeholder: 'f(x) in terms of x, e.g. C(5,x)*C(7,4-x)/C(12,4)',
          hint: {
            latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}',
            text: `Here N = ${N}, r = ${r}, n = ${n}: favorable samples C(${r}, x)C(${N - r}, ${n} − x) over all C(${N}, ${n}).`,
          },
        })
      },
    },
  ],
}
