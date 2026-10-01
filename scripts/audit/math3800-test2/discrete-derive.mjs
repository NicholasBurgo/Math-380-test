// Independent checkers for the Test 2 'discrete-derive' topic. See ../../verify.mjs.
//
// Every box is checked against brute force at this module's own points:
// listing all success/failure sequences, listing all samples, or adding up
// series term by term. No pdf formula is used.
import { confirmFormula, successCounts } from './_lib.mjs'

// q tied to p, whole numbers valid together for each distribution
const BIN = [
  { n: 6, x: 2, p: 0.35, q: 0.65, r: 2, N: 10, k: 1.2 },
  { n: 8, x: 5, p: 0.6, q: 0.4, r: 3, N: 11, k: 2.5 },
  { n: 3, x: 0, p: 0.25, q: 0.75, r: 1, N: 7, k: 0.8 },
  { n: 10, x: 7, p: 0.72, q: 0.28, r: 4, N: 14, k: 3.3 },
]
const NEG = [
  { n: 5, x: 6, p: 0.35, q: 0.65, r: 3, N: 10, k: 1.2 },
  { n: 7, x: 4, p: 0.6, q: 0.4, r: 2, N: 11, k: 2.5 },
  { n: 3, x: 9, p: 0.25, q: 0.75, r: 4, N: 7, k: 0.8 },
  { n: 9, x: 5, p: 0.72, q: 0.28, r: 5, N: 14, k: 3.3 },
]
const HYP = [
  { n: 5, x: 2, p: 0.35, q: 0.65, r: 4, N: 11, k: 1.2 },
  { n: 6, x: 3, p: 0.6, q: 0.4, r: 5, N: 9, k: 2.5 },
  { n: 4, x: 1, p: 0.25, q: 0.75, r: 3, N: 13, k: 0.8 },
  { n: 3, x: 0, p: 0.72, q: 0.28, r: 2, N: 8, k: 3.3 },
]
const POI = [
  { n: 5, x: 1, p: 0.35, q: 0.65, r: 2, N: 10, k: 0.9 },
  { n: 7, x: 3, p: 0.6, q: 0.4, r: 3, N: 11, k: 2.7 },
  { n: 3, x: 0, p: 0.25, q: 0.75, r: 1, N: 7, k: 5.5 },
  { n: 9, x: 5, p: 0.72, q: 0.28, r: 4, N: 14, k: 1.3 },
]
// p and q free
const FREE = [
  { n: 4, x: 1, p: 0.3, q: 0.45, r: 2, N: 10, k: 1.2 },
  { n: 6, x: 3, p: 0.7, q: 0.2, r: 3, N: 11, k: 2.5 },
  { n: 3, x: 2, p: 0.15, q: 0.9, r: 1, N: 7, k: 0.8 },
]

// ---------- brute force ----------

// every success (1) / failure (0) sequence of length n
function* sequences(n) {
  for (let m = 0; m < 1 << n; m++) yield Array.from({ length: n }, (_, t) => (m >> t) & 1)
}
const weight = (seq, ps, qs) => seq.reduce((w, s) => w * (s ? ps : qs), 1)
const hits = seq => seq.reduce((a, b) => a + b, 0)
// add up the probability of every sequence of length n that passes `keep`
function total(n, keep, ps, qs) {
  let s = 0
  for (const seq of sequences(n)) if (keep(seq)) s += weight(seq, ps, qs)
  return s
}
// trial (1-based) on which the r-th success happens, or 0
function rthAt(seq, r) {
  let c = 0
  for (let t = 0; t < seq.length; t++) if (seq[t] && ++c === r) return t + 1
  return 0
}

// every subset of size n of items 0..N-1, items below r are successes
function samples(N, n, visit) {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (;;) {
    visit(idx)
    let i = n - 1
    while (i >= 0 && idx[i] === N - n + i) i--
    if (i < 0) return
    idx[i]++
    for (let j = i + 1; j < n; j++) idx[j] = idx[j - 1] + 1
  }
}
function sampleCounts(N, r, n) {
  const counts = new Array(n + 1).fill(0)
  samples(N, n, idx => counts[idx.filter(i => i < r).length]++)
  return counts
}

// k^x/x! term by term
function expSeries(k, terms = 80) {
  let t = 1
  let s = 1
  for (let x = 1; x < terms; x++) {
    t = (t * k) / x
    s += t
  }
  return s
}

const memo = f => {
  const cache = new Map()
  return e => {
    const key = JSON.stringify(e)
    if (!cache.has(key)) cache.set(key, f(e))
    return cache.get(key)
  }
}

const oneOrder = e => weight([...Array(e.x).fill(1), ...Array(e.n - e.x).fill(0)], e.p, 1 - e.p)
const orders = memo(e => total(e.n, s => hits(s) === e.x, 1, 1))
const binom = memo(e => total(e.n, s => hits(s) === e.x, e.p, 1 - e.p))
const allSeqFree = memo(e => total(e.n, () => true, e.p, e.q))
// first x - 1 trials hold r - 1 successes
const negFirst = memo(e => total(e.x - 1, s => hits(s) === e.r - 1, e.p, 1 - e.p))
// the r-th success is on trial x
const negAll = memo(e => total(e.x, s => rthAt(s, e.r) === e.x, e.p, 1 - e.p))
const hypCounts = memo(e => sampleCounts(e.N, e.r, e.n))
const allSamples = e => hypCounts(e).reduce((a, b) => a + b, 0)
const favorable = e => hypCounts(e)[e.x]

// ---------- the "why" drill ----------

function reasonFor(step) {
  if (step.includes('1^n')) return /p \+ q = 1/
  if (step.includes('S\\cdots S')) return /independent/
  if (step.includes('\\text{orders with }')) return /Choose which x of the n trials/
  if (step.includes('= (p+q)^n')) return /binomial theorem/
  if (step.includes('= e^k')) return /Maclaurin/
  if (step.includes('\\frac{\\binom{r}{x}')) return /equally likely/
  if (step.includes('\\text{favorable}')) return /Multiplication rule/
  if (step.includes('\\cdot p')) return /trial x is the r-th success/
  if (step.includes('\\ge 0')) return /all positive/
  throw new Error(`unrecognized step ${step}`)
}

// The r-th success, run trial by trial: track how many successes so far
// (0..r-1); at[t] is the chance the r-th lands exactly on trial t.
function rthSuccessTimes(r, pr, T) {
  let state = new Array(r).fill(0)
  state[0] = 1
  const at = [0]
  for (let t = 1; t <= T; t++) {
    const next = new Array(r).fill(0)
    let done = 0
    state.forEach((w, s) => {
      next[s] += w * (1 - pr)
      if (s + 1 === r) done += w * pr
      else next[s + 1] += w * pr
    })
    at.push(done)
    state = next
  }
  return at
}

// points in the bulk of a distribution (probability >= 0.005), at most six
function bulk(dist) {
  const xs = dist.map((w, x) => (w >= 0.005 ? x : -1)).filter(x => x >= 0)
  const pick = xs.length <= 6 ? xs : [0, 1, 2, 3, 4, 5].map(i => xs[Math.round((i * (xs.length - 1)) / 5)])
  return pick.map(x => ({ x }))
}

const ordinal = s => {
  const m = s.match(/the (\d+)(?:st|nd|rd|th) success/)
  if (!m) throw new Error(`no ordinal in ${s}`)
  return +m[1]
}

export const derive = {
  'discrete-derive/binom-order': p => confirmFormula(p, oneOrder, BIN),
  'discrete-derive/binom-count': p => confirmFormula(p, orders, BIN),
  'discrete-derive/binom-result': p => confirmFormula(p, binom, BIN),
  'discrete-derive/binom-sum'(p) {
    // a and b: the per-trial weights of a success and a failure, read off the
    // all-success and all-failure sequences
    if (p.ask.includes('the a of')) return confirmFormula(p, e => Math.pow(binom({ ...e, x: e.n }), 1 / e.n), BIN)
    if (p.ask.includes('the b of')) return confirmFormula(p, e => Math.pow(binom({ ...e, x: 0 }), 1 / e.n), BIN)
    if (p.ask.includes('the sum')) return confirmFormula(p, allSeqFree, FREE)
    throw new Error(`unrecognized part ${p.ask}`)
  },
  'discrete-derive/negbin-split'(p) {
    // A: the first x - 1 trials hold r - 1 successes; B: trial x is a success
    if (p.latex.includes('P(A) &= \\boxed')) return confirmFormula(p, negFirst, NEG)
    if (p.latex.includes('P(B) &= \\boxed')) return confirmFormula(p, e => negAll(e) / negFirst(e), NEG)
    throw new Error(`no box found in ${p.latex}`)
  },
  'discrete-derive/negbin-result': p => confirmFormula(p, negAll, NEG),
  'discrete-derive/hyper-count'(p) {
    if (p.latex.includes('\\text{favorable} &= \\boxed')) return confirmFormula(p, favorable, HYP)
    if (p.latex.includes('\\text{samples} &= \\boxed')) return confirmFormula(p, allSamples, HYP)
    throw new Error(`no box found in ${p.latex}`)
  },
  'discrete-derive/hyper-result': p => confirmFormula(p, e => favorable(e) / allSamples(e), HYP),
  'discrete-derive/poisson-sum'(p) {
    if (p.ask.includes('Pull out')) {
      // the factor in front: (sum of the pdf terms) / (sum of k^x/x!)
      return confirmFormula(p, e => (Math.exp(-e.k) * expSeries(e.k)) / expSeries(e.k), POI)
    }
    return confirmFormula(p, e => expSeries(e.k), POI)
  },
  'discrete-derive/why'(p) {
    const want = reasonFor(p.latex)
    const i = p.options.findIndex(o => want.test(o))
    if (i < 0 || p.options.filter(o => want.test(o)).length !== 1) throw new Error('no unique reason matches')
    return 'abcd'[i]
  },
  'discrete-derive/numbers'(p) {
    let m
    if ((m = p.ask.match(/successes in (\d+) independent trials with p = (\d*\.\d+)/))) {
      const dist = successCounts(+m[1], +m[2])
      return confirmFormula(p, e => dist[e.x], bulk(dist))
    }
    if ((m = p.ask.match(/succeed with p = (\d*\.\d+)\. X is the trial on which/))) {
      const at = rthSuccessTimes(ordinal(p.ask), +m[1], 300)
      return confirmFormula(p, e => at[e.x], bulk(at))
    }
    if ((m = p.ask.match(/A sample of (\d+) is drawn without replacement from (\d+) items, (\d+) of them successes/))) {
      const [n, N, r] = [+m[1], +m[2], +m[3]]
      const counts = sampleCounts(N, r, n)
      const all = counts.reduce((a, b) => a + b, 0)
      const dist = counts.map(c => c / all)
      return confirmFormula(p, e => dist[e.x], bulk(dist))
    }
    throw new Error(`unrecognized ask ${p.ask}`)
  },
}

export const SAMPLES = {
  'discrete-derive/binom-order': 300,
  'discrete-derive/binom-count': 300,
  'discrete-derive/binom-result': 300,
  'discrete-derive/binom-sum': 400,
  'discrete-derive/negbin-split': 300,
  'discrete-derive/negbin-result': 300,
  'discrete-derive/hyper-count': 300,
  'discrete-derive/hyper-result': 300,
  'discrete-derive/poisson-sum': 300,
  'discrete-derive/numbers': 400,
}
