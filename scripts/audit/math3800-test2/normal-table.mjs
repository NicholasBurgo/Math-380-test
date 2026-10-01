// Independent checkers for the Test 2 'normal-table' topic. See ../../verify.mjs.
//
// The z table is rebuilt from _lib's phi (the normal density integrated
// numerically), rounded to 4 decimals, for every z from -3.99 to 3.99. Reading
// it backwards is a plain search over that grid for the closest entry; when two
// entries are equally close the answer is the z halfway between them.
import { phi } from './_lib.mjs'

const TABLE = new Map() // hundredths of z -> entry
for (let h = -399; h <= 399; h++) TABLE.set(h, Math.round(phi(h / 100) * 1e4) / 1e4)

function entry(z) {
  const h = Math.round(z * 100)
  if (Math.abs(h / 100 - z) > 1e-9 || !TABLE.has(h)) throw new Error(`${z} is not a z on the table`)
  return TABLE.get(h)
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
  if (hi - lo > 0.0101) throw new Error(`area ${area} matches a flat stretch of the table (${lo} to ${hi})`)
  return Math.round(((lo + hi) / 2) * 1000) / 1000
}

const Z = '(-?\\d+(?:\\.\\d+)?)'
const A = '(\\d+(?:\\.\\d+)?)'
const read = (latex, pattern) => {
  const m = latex.match(new RegExp(pattern))
  if (!m) throw new Error(`unrecognized ${latex}`)
  return m.slice(1).map(Number)
}

export const derive = {
  'normal-table/left'(p) {
    const [z] = read(p.latex, `^P\\(Z (?:<|\\\\le) ${Z}\\) = `)
    return entry(z)
  },
  'normal-table/right'(p) {
    const [z] = read(p.latex, `^P\\(Z (?:>|\\\\ge) ${Z}\\) = `)
    return 1 - entry(z)
  },
  'normal-table/between'(p) {
    const [a, b] = read(p.latex, `^P\\(${Z} < Z < ${Z}\\) = `)
    if (a >= b) throw new Error('empty interval')
    return entry(b) - entry(a)
  },
  'normal-table/tails'(p) {
    let c
    if (p.latex.startsWith('P(|Z|')) [c] = read(p.latex, `^P\\(\\|Z\\| > ${A}\\) = `)
    else {
      const [lo, hi] = read(p.latex, `^P\\(Z < -${A} \\\\text\\{ or \\} Z > ${A}\\) = `)
      if (lo !== hi) throw new Error('tails are not symmetric')
      c = hi
    }
    return entry(-c) + (1 - entry(c))
  },
  'normal-table/z-one-side'(p) {
    const m = p.latex.match(new RegExp(`^P\\(Z (<|>) z_0\\) = ${A}$`))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const area = Number(m[2])
    return zFor(m[1] === '<' ? area : 1 - area)
  },
  'normal-table/z-middle'(p) {
    if (p.latex.startsWith('P(-z_0')) {
      const [area] = read(p.latex, `^P\\(-z_0 < Z < z_0\\) = ${A}$`)
      return zFor((1 + area) / 2)
    }
    const [a, area] = read(p.latex, `^P\\(${Z} < Z < z_0\\) = ${A}$`)
    return zFor(area + entry(a))
  },
  'normal-table/z-r'(p) {
    const [r] = read(p.latex, `^z_\\{${A}\\} = `)
    return zFor(1 - r)
  },
}

export const SAMPLES = {
  'normal-table/left': 1000,
  'normal-table/right': 1000,
  'normal-table/between': 1000,
  'normal-table/tails': 1000,
  'normal-table/z-one-side': 600,
  'normal-table/z-middle': 600,
  'normal-table/z-r': 400,
}
