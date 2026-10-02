// Independent checkers for the Test 2 'binomial' topic. See ../../verify.mjs.
//
// Probabilities come from the distribution of successes built one trial at a
// time (successCounts, no binomial formula).
import { successCounts } from './_lib.mjs'

// n and p, read from the story
function setup(text) {
  let m
  if ((m = text.match(/^A fair coin is flipped (\d+) times\./))) return { n: +m[1], p: 0.5 }
  if ((m = text.match(/^An? (\d+)-question multiple-choice quiz has (\d+) choices per question/))) return { n: +m[1], p: 1 / +m[2] }
  const pm = text.match(/probability (\d*\.\d+), independently\./)
  const nm = text.match(/X is \D*(\d+)\D*\.$/)
  if (!pm || !nm) throw new Error(`cannot read n and p from "${text}"`)
  return { n: +nm[1], p: +pm[1] }
}

const distOf = text => {
  const { n, p } = setup(text)
  return successCounts(n, p)
}

// P(X in the set) by adding the outcomes that are in it
const keep = (d, test) => d.reduce((s, w, k) => s + (test(k) ? w : 0), 0)

export const derive = {
  'binomial/exactly'(p) {
    const m = p.latex.match(/^P\(X = (\d+)\) = \\,\?$/)
    if (!m) throw new Error(`unreadable ${p.latex}`)
    const d = distOf(p.text)
    if (+m[1] >= d.length) throw new Error('x is more than n')
    return d[+m[1]]
  },
  'binomial/cumulative'(p) {
    const d = distOf(p.text)
    const L = p.latex
    let m
    if ((m = L.match(/^P\(X \\le (\d+)\)/))) return keep(d, k => k <= +m[1])
    if ((m = L.match(/^P\(X < (\d+)\)/))) return keep(d, k => k < +m[1])
    if ((m = L.match(/^P\(X \\ge (\d+)\)/))) return keep(d, k => k >= +m[1])
    if ((m = L.match(/^P\(X > (\d+)\)/))) return keep(d, k => k > +m[1])
    throw new Error(`unrecognized event ${L}`)
  },
  'binomial/mean-var'(p) {
    const d = distOf(p.text)
    const mean = d.reduce((s, w, k) => s + k * w, 0)
    const v = d.reduce((s, w, k) => s + (k - mean) ** 2 * w, 0)
    if (p.latex.startsWith('E[X]')) return mean
    if (p.latex.startsWith('\\operatorname{Var}X')) return v
    if (p.latex.startsWith('\\sigma')) return Math.sqrt(v)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
}

export const SAMPLES = {}
