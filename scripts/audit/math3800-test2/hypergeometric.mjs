// Independent checkers for the Test 2 'hypergeometric' topic. See ../../verify.mjs.
//
// N, r, n are read back off the story. The distribution of X comes from
// listing every possible sample (small populations) or from drawing one item
// at a time without replacement (large ones), never from the pdf formula.
import { evalExpr, parseExpr } from '../../../src/engine/expr.js'
import { choose } from './_lib.mjs'

// A real deck, to count the cards of each kind.
const DECK = []
for (const suit of ['hearts', 'diamonds', 'clubs', 'spades'])
  for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) DECK.push({ suit, rank })
const KIND = {
  hearts: c => c.suit === 'hearts',
  spades: c => c.suit === 'spades',
  aces: c => c.rank === 'A',
  'face cards': c => ['J', 'Q', 'K'].includes(c.rank),
  'red cards': c => c.suit === 'hearts' || c.suit === 'diamonds',
}

function population(text) {
  let m
  const out = (N, r, n) => {
    if (!(n <= N && r <= N && n > 0 && r > 0)) throw new Error(`inconsistent population N=${N} r=${r} n=${n}`)
    return { N, r, n }
  }
  if ((m = text.match(/^X is hypergeometric with N = (\d+), r = (\d+), n = (\d+)\.$/))) return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/has (\d+) women and (\d+) men\. A committee of (\d+) is chosen at random\. X is the number of (women|men) /)))
    return out(+m[1] + +m[2], m[4] === 'women' ? +m[1] : +m[2], +m[3])
  if ((m = text.match(/shipment of (\d+) parts contains (\d+) defective ones\. An inspector tests (\d+) of the parts/)))
    return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/^An? (\d+)-card hand is dealt from a standard 52-card deck\. X is the number of (hearts|spades|aces|face cards|red cards)\b.*\(the deck has (\d+)\)\.$/))) {
    const count = DECK.filter(KIND[m[2]]).length
    if (count !== +m[3]) throw new Error(`the deck has ${count} ${m[2]}, the text says ${m[3]}`)
    return out(DECK.length, count, +m[1])
  }
  if ((m = text.match(/holds (\d+) red and (\d+) blue marbles\. You draw (\d+) of them without replacement\. X is the number of (red|blue) /)))
    return out(+m[1] + +m[2], m[4] === 'red' ? +m[1] : +m[2], +m[3])
  if ((m = text.match(/pond has (\d+) fish, and (\d+) of them are tagged\. A biologist nets (\d+) different fish/)))
    return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/class of (\d+) students includes (\d+) who did the reading\. The professor calls on (\d+) different students/)))
    return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/fills (\d+) bottles, and (\d+) of them are underfilled\. A sample of (\d+) bottles/)))
    return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/holds (\d+) light bulbs, (\d+) of them defective\. A buyer tests (\d+) bulbs/)))
    return out(+m[1], +m[2], +m[3])
  if ((m = text.match(/has (\d+) registered voters, and (\d+) of them support a new park\. A reporter interviews (\d+) different voters/)))
    return out(+m[1], +m[2], +m[3])
  throw new Error(`unrecognized story: ${text}`)
}

// Every sample of n from items 0..N-1 (items below r are successes), counted
// by how many successes it holds.
function everySample(N, r, n) {
  const counts = new Array(n + 1).fill(0)
  const idx = Array.from({ length: n }, (_, i) => i)
  for (;;) {
    let s = 0
    for (const i of idx) if (i < r) s++
    counts[s]++
    let i = n - 1
    while (i >= 0 && idx[i] === N - n + i) i--
    if (i < 0) break
    idx[i]++
    for (let j = i + 1; j < n; j++) idx[j] = idx[j - 1] + 1
  }
  const all = counts.reduce((a, b) => a + b, 0)
  return counts.map(c => c / all)
}

// Draw one item at a time without putting it back: with s successes among the
// first d draws, the next is a success with chance (r - s)/(N - d).
function drawByDraw(N, r, n) {
  let dist = [1]
  for (let d = 0; d < n; d++) {
    const next = new Array(d + 2).fill(0)
    dist.forEach((w, s) => {
      const left = N - d
      const succ = r - s
      next[s + 1] += (w * succ) / left
      next[s] += (w * (left - succ)) / left
    })
    dist = next
  }
  return dist
}

const sampleDist = ({ N, r, n }) => (N <= 40 && choose(N, n) <= 5000 ? everySample(N, r, n) : drawByDraw(N, r, n))
const cum = (dist, c) => dist.slice(0, Math.max(0, c + 1)).reduce((a, b) => a + b, 0)

function eventProb(dist, latex) {
  let m
  if ((m = latex.match(/P\(X = (\d+)\)/))) return dist[+m[1]] ?? 0
  if ((m = latex.match(/P\(X \\le (\d+)\)/))) return cum(dist, +m[1])
  if ((m = latex.match(/P\(X < (\d+)\)/))) return cum(dist, +m[1] - 1)
  if ((m = latex.match(/P\(X \\ge (\d+)\)/))) return 1 - cum(dist, +m[1] - 1)
  if ((m = latex.match(/P\(X > (\d+)\)/))) return 1 - cum(dist, +m[1])
  throw new Error(`unrecognized event ${latex}`)
}

// \frac{a}{b} -> ((a)/(b)), \binom{a}{b} -> C(a,b), ^{e} -> ^(e), \left( \right) -> ( )
function latexToExpr(s) {
  let i = 0
  let out = ''
  const group = () => {
    if (s[i] !== '{') throw new Error(`expected { in ${s}`)
    let depth = 0
    const start = i
    for (; i < s.length; i++) {
      if (s[i] === '{') depth++
      else if (s[i] === '}' && --depth === 0) break
    }
    const inner = s.slice(start + 1, i)
    i++
    return latexToExpr(inner)
  }
  while (i < s.length) {
    if (s.startsWith('\\frac', i)) {
      i += 5
      const a = group()
      out += `((${a})/(${group()}))`
    } else if (s.startsWith('\\binom', i)) {
      i += 6
      const a = group()
      out += `C(${a},${group()})`
    } else if (s.startsWith('\\left', i)) i += 5
    else if (s.startsWith('\\right', i)) i += 6
    else if (s[i] === '^') {
      i++
      out += s[i] === '{' ? `^(${group()})` : `^${s[i++]}`
    } else if (s[i] === '\\') throw new Error(`unknown command in ${s.slice(i)}`)
    else out += s[i++]
  }
  return out
}
const optionValue = o => evalExpr(parseExpr(latexToExpr(o.latex), []), {})

export const derive = {
  'hypergeometric/exactly': p => eventProb(sampleDist(population(p.text)), p.latex),
  'hypergeometric/values'(p) {
    const dist = sampleDist(population(p.text))
    const xs = dist.map((w, x) => (w > 0 ? x : -1)).filter(x => x >= 0)
    if (p.latex.includes('smallest')) return Math.min(...xs)
    if (p.latex.includes('largest')) return Math.max(...xs)
    if (p.latex.includes('number of possible')) return xs.length
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'hypergeometric/tail': p => eventProb(sampleDist(population(p.text)), p.latex),
  'hypergeometric/setup'(p) {
    const want = eventProb(sampleDist(population(p.text)), p.latex)
    const hits = p.options.map((o, i) => (Math.abs(optionValue(o) - want) <= 1e-9 * Math.max(1, want) ? 'abcd'[i] : null)).filter(Boolean)
    if (hits.length !== 1) throw new Error(`${hits.length} options equal the brute-force probability ${want}`)
    return hits[0]
  },
}

export const SAMPLES = {}
