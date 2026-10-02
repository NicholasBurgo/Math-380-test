// Independent checkers for the Test 2 'binomial-table' topic. See ../../verify.mjs.
//
// The printed tables are rebuilt here: the distribution of successes in n
// trials (n = 19 or 20, the two tables the test hands out) built one trial at a
// time (successCounts), accumulated, and each entry rounded to 4 decimals the
// way a printed table is. The event is read off the problem and done as
// arithmetic on those entries.
import { successCounts } from './_lib.mjs'

// p and n (which must be 19 or 20) from the problem text, and that table
function tableFor(text) {
  const pm = text.match(/\d*\.\d+/)
  if (!pm) throw new Error(`no p in "${text}"`)
  const p = +pm[0]
  const whole = [...text.replace(pm[0], '').matchAll(/\d+/g)].map(m => +m[0])
  if (whole.length !== 1 || (whole[0] !== 19 && whole[0] !== 20)) throw new Error(`expected n = 19 or 20 in "${text}"`)
  const n = whole[0]
  let total = 0
  const F = successCounts(n, p).map(w => Math.round((total += w) * 1e4) / 1e4)
  if (F.length !== n + 1 || F[n] !== 1) throw new Error('the table does not end at 1')
  return { n, F }
}

// P(lo <= X <= hi) as a reader of the table would compute it
function fromTable({ n, F }, lo, hi) {
  if (lo > hi) throw new Error(`empty event ${lo}..${hi}`)
  if (lo <= 0) return F[hi]
  if (hi >= n) return 1 - F[lo - 1]
  return F[hi] - F[lo - 1]
}

// The values an event keeps, lo..hi, from its symbols
function symbolic(L, n) {
  let m
  if ((m = L.match(/^P\((\d+) (<|\\le) X (<|\\le) (\d+)\)/))) {
    return [m[2] === '<' ? +m[1] + 1 : +m[1], m[3] === '<' ? +m[4] - 1 : +m[4]]
  }
  if ((m = L.match(/^P\(X \\le (\d+)\)/))) return [0, +m[1]]
  if ((m = L.match(/^P\(X < (\d+)\)/))) return [0, +m[1] - 1]
  if ((m = L.match(/^P\(X \\ge (\d+)\)/))) return [+m[1], n]
  if ((m = L.match(/^P\(X > (\d+)\)/))) return [+m[1] + 1, n]
  if ((m = L.match(/^P\(X = (\d+)\)/))) return [+m[1], +m[1]]
  throw new Error(`unrecognized event ${L}`)
}

// ...and from words
function verbal(L, n) {
  const m = L.match(/^P\(\\text\{(.+)\}\) = \\,\?$/)
  if (!m) throw new Error(`no event in words in ${L}`)
  const s = m[1]
  let w
  if ((w = s.match(/^between (\d+) and (\d+), inclusive$/))) return [+w[1], +w[2]]
  if ((w = s.match(/^(?:at most|no more than) (\d+)$/))) return [0, +w[1]]
  if ((w = s.match(/^fewer than (\d+)$/))) return [0, +w[1] - 1]
  if ((w = s.match(/^(?:at least|no fewer than) (\d+)$/))) return [+w[1], n]
  if ((w = s.match(/^more than (\d+)$/))) return [+w[1] + 1, n]
  if ((w = s.match(/^exactly (\d+)$/))) return [+w[1], +w[1]]
  throw new Error(`unrecognized phrase "${s}"`)
}

// The table named in the text, and the event read from the latex by `read`
const byTable = read => p => {
  const table = tableFor(p.text)
  return fromTable(table, ...read(p.latex, table.n))
}
const bySymbols = byTable(symbolic)

export const derive = {
  'binomial-table/at-most': bySymbols,
  'binomial-table/at-least': bySymbols,
  'binomial-table/exactly': bySymbols,
  'binomial-table/between': bySymbols,
  'binomial-table/words': byTable(verbal),
}

export const SAMPLES = {}
