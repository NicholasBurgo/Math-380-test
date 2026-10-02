// Independent checkers for the Test 2 'normal-apps' topic. See ../../verify.mjs.
//
// μ and σ (or σ²) are read back out of the story, every x out of the displayed
// event. z = (x - μ)/σ is rounded to 2 decimals and looked up in a z table
// rebuilt from _lib's phi (the density integrated numerically) to 4 decimals.
// Backwards problems search that table for the closest entry (the midpoint of a
// tie) and convert with x = μ + zσ. A percentile is the area to the left.
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
// English suffixes: 1st, 2nd, 3rd, 4th, 11th to 13th; after a decimal point
// the digits are read one by one, so 99.53rd.
function suffixOk(n, suffix) {
  const s = String(n)
  const last = s.includes('.') ? Number(s.slice(-1)) : Number(s) % 100
  const want = last >= 11 && last <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][last % 10] ?? 'th'
  if (suffix !== want) throw new Error(`"${n}${suffix}" should be "${n}${want}"`)
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
  'normal-apps/percentile'(p) {
    const { mu, sigma } = params(p.text)
    let m
    if ((m = p.text.match(/What percentile is an? [^?]* of (\d+(?:\.\d+)?)[^?\d]*\?/))) {
      // a score's percentile: the table entry at its z
      const x = Number(m[1])
      const [shown] = read(p.latex, `^x = ${NUM}, \\\\quad \\\\text\\{percentile\\} = `)
      if (shown !== x) throw new Error(`the text asks about ${x}, the math shows ${shown}`)
      const e = lookup((x - mu) / sigma)
      // the solution names it as a percentile too
      const said = p.answerLatex.match(/\\text\{the (\d+(?:\.\d+)?)(st|nd|rd|th) percentile\}/)
      if (!said || Math.abs(Number(said[1]) - e * 100) > 1e-9) throw new Error(`the solution does not call ${e} the ${e * 100}th percentile`)
      suffixOk(said[1], said[2])
      return e
    }
    if ((m = p.text.match(/is the (\d+(?:\.\d+)?)(st|nd|rd|th) percentile\?/))) {
      // a percentile's score: left area pct/100
      suffixOk(m[1], m[2])
      if (!p.latex.includes(`the ${m[1]}${m[2]} percentile`)) throw new Error(`the math does not show the ${m[1]}${m[2]} percentile`)
      return mu + zFor(Number(m[1]) / 100) * sigma
    }
    throw new Error(`unrecognized "${p.text}"`)
  },
  'normal-apps/middle'(p) {
    const { mu, sigma } = params(p.text)
    const m = p.latex.match(/^P\(x_1 < X < x_2\) = (\d+(?:\.\d+)?)$/)
    const pct = p.text.match(/find the middle (\d+)% of the population\?/)
    const which = p.text.match(/find the (lower|upper) one, x(₁|₂)\./)
    if (!m || !pct || !which) throw new Error(`unrecognized ${p.text} :: ${p.latex}`)
    const A = Number(m[1])
    if (Math.abs(Number(pct[1]) / 100 - A) > 1e-9) throw new Error(`the text says ${pct[1]}%, the math ${A}`)
    if ((which[1] === 'upper') !== (which[2] === '₂')) throw new Error(`the ${which[1]} one is not x${which[2]}`)
    return mu + zFor(which[1] === 'upper' ? (1 + A) / 2 : (1 - A) / 2) * sigma
  },
}

export const SAMPLES = {
  'normal-apps/z-score': 1000,
  'normal-apps/less-more': 1000,
  'normal-apps/between': 1000,
  'normal-apps/outside': 1000,
  'normal-apps/x-from-area': 500,
  'normal-apps/percentile': 1000,
  'normal-apps/middle': 500,
}
