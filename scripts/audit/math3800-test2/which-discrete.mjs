// Independent checkers for the Test 2 'which-discrete' topic. See ../../verify.mjs.
//
// The label is read off the displayed words with this module's own cue rules
// (the notes' summary): trials counted "until" the r-th success, a sample
// "without replacement" or from a finite group, an average rate "per" unit,
// draws "put back", a fixed number of trials. Parameters are read back from
// the numbers in the text, and the possible values of X by brute force: every
// count whose probability is positive.
import { choose, successCounts } from './_lib.mjs'

const BIN = 'binomial'
const NEG = 'negative binomial'
const GEO = 'geometric'
const HYP = 'hypergeometric'
const POI = 'Poisson'

const COUNT = { first: 1, once: 1, second: 2, twice: 2, third: 3, fourth: 4, fifth: 5 }
// trials counted until some number of successes
const SEQ = /\b(?:until|needed to|needs to|to get|to find|stops at|up to and including)\b([^.]*)/

// how many successes the clause after the cue asks for: the first ordinal,
// count word or number in it
function successesNeeded(clause) {
  const m = clause.match(/\b(\d+)(?:st|nd|rd|th)\b|\b(first|once|second|twice|third|fourth|fifth)\b|\b(\d+)\b/)
  if (!m) return null
  return m[1] ? +m[1] : m[2] ? COUNT[m[2]] : +m[3]
}

function classify(text) {
  const t = text.toLowerCase()
  const seq = t.match(SEQ)
  if (seq) {
    const r = successesNeeded(seq[1])
    if (!r) throw new Error(`no count after "${seq[0]}" in: ${text}`)
    return r === 1 ? GEO : NEG
  }
  if (/\bwithout replacement\b/.test(t)) return HYP
  if (/\bwith replacement\b|\b(?:put|puts|putting)\b[^.]*\bback\b/.test(t)) return BIN
  if (/\baverag/.test(t) && /\b(?:per|every)\b/.test(t)) return POI
  if (/\b(?:dealt|committee|lottery|grab|different (?:fish|students|numbers)|chosen at random and checked|sample of \d+)\b/.test(t)) return HYP
  if (/\b\d+ (?:[a-z-]+ )?(?:times|free throws|questions|chips|seeds|tickets|rolls|draws|flips)\b|\bnext \d+\b/.test(t)) return BIN
  throw new Error(`no cue in: ${text}`)
}

// ---------- parameters ----------

const UNITS = { minute: ['time', 60], hour: ['time', 3600], m: ['length', 1], km: ['length', 1000], page: ['page', 1] }
function poissonK(text) {
  const rate = text.match(/(\d*\.?\d+)[a-z ]*? per (hour|km|page)\b/)
  if (!rate) throw new Error(`no rate in: ${text}`)
  const rest = text.slice(0, rate.index) + text.slice(rate.index + rate[0].length)
  const win = rest.match(/(\d*\.?\d+)[ -](minute|page|hour|km|m)s?\b/)
  if (!win) throw new Error(`no interval in: ${text}`)
  if (UNITS[rate[2]][0] !== UNITS[win[2]][0]) throw new Error('units do not match')
  return (+rate[1] * +win[1] * UNITS[win[2]][1]) / UNITS[rate[2]][1]
}

function probabilityOf(text) {
  let m
  if ((m = text.match(/probability (\d*\.\d+)/))) return +m[1]
  if ((m = text.match(/(\d+)% are defective/))) return +m[1] / 100
  if ((m = text.match(/holds (\d+) red and (\d+) blue marbles/))) {
    const red = /X is the number of red/.test(text)
    return (red ? +m[1] : +m[2]) / (+m[1] + +m[2])
  }
  throw new Error(`no probability in: ${text}`)
}

function paramsOf(text, label) {
  let m
  if (label === BIN) {
    m = text.match(/the next (\d+)|takes (\d+)|repeated (\d+) times/)
    if (!m) throw new Error(`no n in: ${text}`)
    return { n: +(m[1] ?? m[2] ?? m[3]), p: probabilityOf(text) }
  }
  if (label === NEG) return { r: successesNeeded(text.toLowerCase().match(SEQ)[1]), p: probabilityOf(text) }
  if (label === GEO) return { p: probabilityOf(text) }
  if (label === HYP) {
    if ((m = text.match(/shipment of (\d+) parts contains (\d+) defective ones\. An inspector tests (\d+) of/))) return { N: +m[1], r: +m[2], n: +m[3] }
    if ((m = text.match(/committee of (\d+) is chosen at random from a club of (\d+) women and (\d+) men\. X is the number of (women|men) /)))
      return { N: +m[2] + +m[3], r: m[4] === 'women' ? +m[2] : +m[3], n: +m[1] }
    if ((m = text.match(/fills (\d+) bottles, and (\d+) of them are underfilled\. A sample of (\d+) bottles/))) return { N: +m[1], r: +m[2], n: +m[3] }
    if ((m = text.match(/box of (\d+) batteries holds (\d+) dead ones\. Then (\d+) of them are taken out/))) return { N: +m[1], r: +m[2], n: +m[3] }
    throw new Error(`no population in: ${text}`)
  }
  return { k: poissonK(text) }
}

function parseOption(o) {
  const m = o.match(/^(negative binomial|binomial|geometric|hypergeometric|Poisson): (.+)$/)
  if (!m) throw new Error(`unreadable option ${o}`)
  const params = {}
  for (const part of m[2].split(', ')) {
    const [key, val] = part.split(' = ')
    const [a, b] = val.split('/')
    params[key] = b === undefined ? +a : +a / +b
  }
  return { label: m[1], params }
}
const sameParams = (a, b) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => key in b && Math.abs(a[key] - b[key]) < 1e-9)

function onlyOne(options, test) {
  const hits = options.map((o, i) => (test(o) ? 'abcdefgh'[i] : null)).filter(Boolean)
  if (hits.length !== 1) throw new Error(`${hits.length} options fit: ${JSON.stringify(options)}`)
  return hits[0]
}

// ---------- possible values ----------

// [lowest, highest] value with positive probability; highest is Infinity when
// the probability is still positive far out (checked to T trials or events).
const T = 120
function supportOf(label, q) {
  let probs
  if (label === BIN) probs = successCounts(q.n, q.p)
  else if (label === HYP) probs = Array.from({ length: q.n + 1 }, (_, x) => choose(q.r, x) * choose(q.N - q.r, q.n - x))
  else if (label === NEG) {
    // successes so far (0..r-1), trial by trial; at[t] = chance the r-th lands on trial t
    let state = new Array(q.r).fill(0)
    state[0] = 1
    probs = [0]
    for (let t = 1; t <= T; t++) {
      const next = new Array(q.r).fill(0)
      let done = 0
      state.forEach((w, k) => {
        next[k] += w * (1 - q.p)
        if (k + 1 === q.r) done += w * q.p
        else next[k + 1] += w * q.p
      })
      probs.push(done)
      state = next
    }
  } else {
    // Poisson terms e^(-k) k^x / x!, built up one at a time
    probs = [Math.exp(-q.k)]
    for (let x = 1; x <= T; x++) probs.push((probs[x - 1] * q.k) / x)
  }
  const xs = probs.map((w, x) => (w > 0 ? x : -1)).filter(x => x >= 0)
  const open = (label === NEG || label === POI) && probs[T] > 0
  return [xs[0], open ? Infinity : xs[xs.length - 1]]
}

// {0, 1, …, 12}, {3, 4, 5, 6} or {2, 3, 4, …} back to [lowest, highest]
function setOf(latex) {
  const m = latex.match(/^\\\{(.*)\\\}$/)
  if (!m) throw new Error(`not a set: ${latex}`)
  const parts = m[1].split(', ')
  const nums = parts.filter(x => x !== '\\ldots').map(Number)
  if (nums.some(Number.isNaN)) throw new Error(`unreadable set ${latex}`)
  if (parts[parts.length - 1] === '\\ldots') return [nums[0], Infinity]
  // listed in full: they must run one at a time
  if (!parts.includes('\\ldots') && nums.some((x, i) => i > 0 && x !== nums[i - 1] + 1)) throw new Error(`gaps in ${latex}`)
  return [nums[0], nums[nums.length - 1]]
}

export const derive = {
  'which-discrete/label'(p) {
    const label = classify(p.text)
    return onlyOne(p.options, o => o === label)
  },
  'which-discrete/spot'(p) {
    const m = p.ask.match(/^Which X is (.+)\?$/)
    if (!m) throw new Error(`unrecognized ask ${p.ask}`)
    return onlyOne(p.options, o => classify(o) === m[1])
  },
  'which-discrete/params'(p) {
    const label = classify(p.text)
    const want = paramsOf(p.text, label)
    return onlyOne(p.options, o => {
      const got = parseOption(o)
      return got.label === label && sameParams(want, got.params)
    })
  },
  'which-discrete/values'(p) {
    const label = classify(p.text)
    const [lo, hi] = supportOf(label, paramsOf(p.text, label))
    return onlyOne(p.options, o => {
      const [a, b] = setOf(o.latex)
      return a === lo && b === hi
    })
  },
}

export const SAMPLES = {}
