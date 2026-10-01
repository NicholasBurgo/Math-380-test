// Independent checkers for the Test 2 'normal-apps' topic. See ../../verify.mjs.
//
// μ and σ (or σ²) are read back out of the story, every x out of the displayed
// event. z = (x - μ)/σ is rounded to 2 decimals and looked up in a z table
// rebuilt from _lib's phi (the density integrated numerically) to 4 decimals.
// Backwards problems search that table for the closest entry (the midpoint of a
// tie) and convert with x = μ + zσ.
import { phi } from './_lib.mjs'

const TABLE = new Map() // hundredths of z -> entry
for (let h = -399; h <= 399; h++) TABLE.set(h, Math.round(phi(h / 100) * 1e4) / 1e4)

// P(Z < z) as the table gives it, after rounding z to 2 decimals. A z within a
// hair of a rounding tie would make the answer depend on the convention: throw.
function lookup(z) {
  const h = z * 100
  const frac = h - Math.floor(h)
  if (Math.abs(frac - 0.5) < 1e-6) throw new Error(`z = ${z} sits on a rounding tie`)
  const k = Math.round(h)
  if (!TABLE.has(k)) throw new Error(`z = ${z} is off the table`)
  return TABLE.get(k)
}
function zFor(area) {
  let best = Infinity
  let hits = []
  for (const [h, v] of TABLE) {
    const d = Math.abs(v - area)
    if (d < best - 1e-9) {
      best = d
      hits = [h]
    } else if (Math.abs(d - best) <= 1e-9) hits.push(h)
  }
  const lo = Math.min(...hits) / 100
  const hi = Math.max(...hits) / 100
  if (hi - lo > 0.0101) throw new Error(`area ${area} matches a flat stretch of the table`)
  return Math.round(((lo + hi) / 2) * 1000) / 1000
}

const NUM = '(-?\\d+(?:\\.\\d+)?)'
function params(text) {
  const mu = text.match(new RegExp(`μ = ${NUM}`))
  const v = text.match(new RegExp(`σ² = ${NUM}`))
  const s = text.match(new RegExp(`σ = ${NUM}`))
  if (!mu || (!v && !s)) throw new Error(`no μ or σ in "${text}"`)
  return { mu: Number(mu[1]), sigma: v ? Math.sqrt(Number(v[1])) : Number(s[1]) }
}
const read = (latex, pattern) => {
  const m = latex.match(new RegExp(pattern))
  if (!m) throw new Error(`unrecognized ${latex}`)
  return m.slice(1).map(Number)
}

export const derive = {
  'normal-apps/z-score'(p) {
    const { mu, sigma } = params(p.text)
    const [x] = read(p.latex, `^x = ${NUM}, \\\\quad z = `)
    const z = (x - mu) / sigma
    lookup(z) // refuses a rounding tie
    return Math.round(z * 100) / 100
  },
  'normal-apps/less-more'(p) {
    const { mu, sigma } = params(p.text)
    const m = p.latex.match(new RegExp(`^P\\(X (<|>) ${NUM}\\) = `))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const e = lookup((Number(m[2]) - mu) / sigma)
    return m[1] === '<' ? e : 1 - e
  },
  'normal-apps/between'(p) {
    const { mu, sigma } = params(p.text)
    const [a, b] = read(p.latex, `^P\\(${NUM} < X < ${NUM}\\) = `)
    if (a >= b) throw new Error('empty interval')
    return lookup((b - mu) / sigma) - lookup((a - mu) / sigma)
  },
  'normal-apps/outside'(p) {
    const { mu, sigma } = params(p.text)
    const [a, b] = read(p.latex, `^P\\(X < ${NUM}\\) \\+ P\\(X > ${NUM}\\) = `)
    if (a >= b) throw new Error('limits are backwards')
    return lookup((a - mu) / sigma) + (1 - lookup((b - mu) / sigma))
  },
  'normal-apps/x-from-area'(p) {
    const { mu, sigma } = params(p.text)
    let m
    let left
    if ((m = p.text.match(/only (\d+(?:\.\d+)?)% of those exposed survive/))) left = 1 - Number(m[1]) / 100 // survivors are above x
    else if ((m = p.text.match(/cuts off the top (\d+(?:\.\d+)?)%/))) left = 1 - Number(m[1]) / 100
    else if ((m = p.text.match(/cuts off the bottom (\d+(?:\.\d+)?)%/))) left = Number(m[1]) / 100
    else throw new Error(`unrecognized "${p.text}"`)
    return mu + zFor(left) * sigma
  },
  'normal-apps/middle'(p) {
    const { mu, sigma } = params(p.text)
    const m = p.latex.match(/^P\(x_1 < X < x_2\) = (\d+(?:\.\d+)?)$/)
    const which = p.text.match(/Find x(₁|₂)\./)
    if (!m || !which) throw new Error(`unrecognized ${p.text} :: ${p.latex}`)
    const A = Number(m[1])
    return mu + zFor(which[1] === '₂' ? (1 + A) / 2 : (1 - A) / 2) * sigma
  },
}

export const SAMPLES = {
  'normal-apps/z-score': 1000,
  'normal-apps/less-more': 1000,
  'normal-apps/between': 1000,
  'normal-apps/outside': 1000,
  'normal-apps/x-from-area': 500,
  'normal-apps/middle': 500,
}
