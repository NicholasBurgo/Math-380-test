// Independent checkers for the Test 2 'geometric' topic. See ../../verify.mjs.
import { decimals, ints } from './_lib.mjs'

// p from the story: stated outright, or the share of digits that count.
function pOf(text) {
  const set = text.match(/digit in \{([^}]*)\}/)
  if (set) return set[1].split(',').length / 10
  if (/get a \d\./.test(text)) return 1 / 10
  return decimals(text)[0]
}

// P(X = x) by walking trial by trial: survive x - 1 failures, then succeed.
function firstSuccessAt(p, x) {
  let alive = 1
  for (let t = 1; t < x; t++) alive *= 1 - p
  return alive * p
}
const sumPdf = (p, lo, hi) => {
  let s = 0
  for (let x = lo; x <= hi; x++) s += firstSuccessAt(p, x)
  return s
}

export const derive = {
  'geometric/pmf'(p) {
    const x = ints(p.latex)[0]
    return firstSuccessAt(pOf(p.text), x)
  },
  'geometric/cdf'(p) {
    const pr = pOf(p.text)
    const L = p.latex
    let m
    if ((m = L.match(/P\((\d+) \\le X \\le (\d+)\)/))) return sumPdf(pr, +m[1], +m[2])
    if ((m = L.match(/X \\le (\d+)/))) return sumPdf(pr, 1, +m[1])
    if ((m = L.match(/X < (\d+)/))) return sumPdf(pr, 1, +m[1] - 1)
    if ((m = L.match(/X > (\d+)/))) return 1 - sumPdf(pr, 1, +m[1])
    if ((m = L.match(/X \\ge (\d+)/))) return 1 - sumPdf(pr, 1, +m[1] - 1)
    throw new Error(`unrecognized event ${L}`)
  },
  'geometric/mean-var'(p) {
    const pr = pOf(p.text)
    // moments by summing the series far out
    let m1 = 0
    let m2 = 0
    for (let x = 1; x < 5000; x++) {
      const f = firstSuccessAt(pr, x)
      m1 += x * f
      m2 += x * x * f
    }
    if (p.latex.startsWith('E[X]')) return m1
    if (p.latex.includes('Var')) return m2 - m1 * m1
    if (p.latex.includes('sigma')) return Math.sqrt(m2 - m1 * m1)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
}

export const SAMPLES = { 'geometric/mean-var': 400 }
