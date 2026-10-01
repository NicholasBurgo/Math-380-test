// Independent checkers for the Test 2 'negative-binomial' topic. See ../../verify.mjs.
//
// P(the r-th success lands on trial x) comes from following the number of
// successes so far, one trial at a time (no negative binomial formula).
import { choose } from './_lib.mjs'

// p and r from the story
function setup(text) {
  const pct = text.match(/(\d+)% of/)
  const dec = text.match(/probability (\d*\.\d+)/)
  if (!pct === !dec) throw new Error(`cannot read p from "${text}"`)
  const r = text.match(/the (\d+)(?:st|nd|rd|th) /)
  if (!r) throw new Error(`cannot read r from "${text}"`)
  return { p: pct ? +pct[1] / 100 : +dec[1], r: +r[1] }
}

// hit[x] = P(the r-th success happens on trial x), for x = 0..maxX
function rthSuccess(r, p, maxX) {
  let open = new Array(r).fill(0) // open[k]: k successes so far, still going
  open[0] = 1
  const hit = [0]
  for (let t = 1; t <= maxX; t++) {
    const next = new Array(r).fill(0)
    let done = 0
    open.forEach((w, k) => {
      next[k] += w * (1 - p)
      if (k + 1 === r) done += w * p
      else next[k + 1] += w * p
    })
    hit.push(done)
    open = next
  }
  return hit
}

// P(lo <= X <= hi), adding outcome by outcome
const between = (hit, lo, hi) => {
  let s = 0
  for (let x = Math.max(0, lo); x <= hi; x++) s += hit[x]
  return s
}

const xIn = (s, re) => {
  const m = s.match(re)
  if (!m) throw new Error(`cannot read x from ${s}`)
  return +m[1]
}

export const derive = {
  'negative-binomial/exactly'(p) {
    const { p: pr, r } = setup(p.text)
    const x = xIn(p.latex, /^P\(X = (\d+)\) = \\,\?$/)
    return rthSuccess(r, pr, x)[x]
  },
  'negative-binomial/cumulative'(p) {
    const { p: pr, r } = setup(p.text)
    const m = p.latex.match(/^P\(X (\\le|<|>|\\ge) (\d+)\) = \\,\?$/)
    if (!m) throw new Error(`unrecognized event ${p.latex}`)
    const x = +m[2]
    const hit = rthSuccess(r, pr, x + 1)
    if (m[1] === '\\le') return between(hit, 0, x)
    if (m[1] === '<') return between(hit, 0, x - 1)
    // "more than" events: everything not yet finished by the cut-off
    if (m[1] === '>') return 1 - between(hit, 0, x)
    return 1 - between(hit, 0, x - 1)
  },
  'negative-binomial/possible'(p) {
    const { p: pr, r } = setup(p.text)
    const x = xIn(p.latex, /^X = (\d+)$/)
    return rthSuccess(r, pr, x)[x] > 0 ? 'yes' : 'no'
  },
  'negative-binomial/failures'(p) {
    const r = +p.text.match(/the (\d+)(?:st|nd|rd|th) success/)[1]
    if (p.latex.startsWith('\\text{number of failures}')) {
      const x = xIn(p.text, /X = (\d+)\./)
      if (!(rthSuccess(r, 0.5, x)[x] > 0)) throw new Error(`X = ${x} is impossible for r = ${r}`)
      // a run that ends with the r-th success on trial x: r - 1 successes,
      // then the failures, then the last success
      const run = [...'S'.repeat(r - 1), ...'F'.repeat(x - r), 'S']
      return run.filter(c => c === 'F').length
    }
    if (p.latex === 'X = \\,?') {
      const k = xIn(p.text, /There (?:was|were) (\d+) failures?/)
      // trials are successes or failures: count them in a run
      return [...'S'.repeat(r), ...'F'.repeat(k)].length
    }
    if (p.latex === '\\min X = \\,?') {
      const hit = rthSuccess(r, 0.5, 4 * r)
      return hit.findIndex(w => w > 0)
    }
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'negative-binomial/setup'(p) {
    const { p: pr, r } = setup(p.text)
    const x = xIn(p.latex, /^P\(X = (\d+)\)$/)
    const want = rthSuccess(r, pr, x)[x]
    const hits = p.options.map((o, i) => {
      const m = o.latex.match(/^\\binom\{(\d+)\}\{(\d+)\}\(([\d.]+)\)\^\{(\d+)\}\(([\d.]+)\)\^\{(\d+)\}$/)
      if (!m) throw new Error(`unreadable option ${o.latex}`)
      const v = choose(+m[1], +m[2]) * Math.pow(+m[3], +m[4]) * Math.pow(+m[5], +m[6])
      return Math.abs(v - want) <= 1e-9 * Math.max(1e-300, want) ? 'abcd'[i] : null
    })
    const right = hits.filter(Boolean)
    if (right.length !== 1) throw new Error(`${right.length} options equal the probability`)
    return right[0]
  },
}

export const SAMPLES = {}
