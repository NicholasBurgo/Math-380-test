// Independent checkers for the Test 2 'uniform' topic. See ../../verify.mjs.
//
// "Equally likely on [a, b]" becomes a flat density whose height is fixed by
// area 1 (found by integrating, not by the 1/(b − a) formula); every answer is
// then an integral of it.
import { confirmFormula, integrate } from './_lib.mjs'
import { densityOf, eventOf, exprValue, near, rowsOf } from './continuous-pdf.mjs'

// [a, b] from the story: "from 2 to 12" or "[2, 12]".
function intervalOf(text) {
  const m = text.match(/from (-?[\d.]+) to (-?[\d.]+)/) ?? text.match(/\[(-?[\d.]+), (-?[\d.]+)\]/)
  if (!m) throw new Error(`no interval in ${text}`)
  return [+m[1], +m[2]]
}

// The flat density on [a, b] with total area 1.
function flat(a, b) {
  const c = 1 / integrate(() => 1, a, b, 2)
  return { a, b, c, f: x => (x < a || x > b ? 0 : c) }
}

// ∫ of H(x)·f(x) over the part of [lo, hi] inside [a, b]
function integral(u, lo, hi, H = () => 1) {
  const l = Math.max(lo, u.a)
  const h = Math.min(hi, u.b)
  return h <= l ? 0 : integrate(x => H(x) * u.c, l, h, 200)
}

const CHECK = [
  { a: 2, b: 7, c: 0.4, x: 3.1 },
  { a: -1, b: 1.5, c: 3, x: 0.2 },
  { a: 0.3, b: 2.2, c: 1.1, x: 1.9 },
]

export const derive = {
  // Read off the screen: the box equals the integral written just before it,
  // integrated numerically; for "c = box", the line above (area = 1) fixes c.
  'uniform/derive'(p) {
    const V = ['a', 'b', 'c', 'x', 't']
    const rows = rowsOf(p.latex)
    const boxRow = rows.find(r => r.includes('\\boxed'))
    const parts = boxRow.replace('&', '').split(' = ').map(s => s.trim())
    const before = parts[parts.length - 2]
    if (before.includes('\\int')) return confirmFormula(p, e => exprValue(before, e, V), CHECK)
    const prev = rows[rows.indexOf(boxRow) - 1].replace('&', '').split(' = ').map(s => s.trim())
    if (before !== 'c' || prev[prev.length - 1] !== '1') throw new Error(`unrecognized step ${p.latex}`)
    for (const e of CHECK) {
      const sides = prev.slice(0, -1).map(s => exprValue(s, e, V))
      if (sides.some(v => Math.abs(v - sides[0]) > 1e-9)) throw new Error(`the line ${rows[rows.indexOf(boxRow) - 1]} does not hold`)
    }
    // the area is c times the area at c = 1, and it must be 1
    return confirmFormula(p, e => 1 / exprValue(prev[0], { ...e, c: 1 }, V), CHECK)
  },
  'uniform/height'(p) {
    const [a, b] = intervalOf(p.text)
    const shown = densityOf(p.latex, { c: 1 })
    if (shown.lo !== a || shown.hi !== b) throw new Error('the density and the story disagree on [a, b]')
    const u = flat(a, b)
    const m = p.latex.match(/f\((-?[\d.]+)\) = \\,\?/)
    if (m) return near(u.f(+m[1]), p)
    if (!/c = \\,\?/.test(p.latex)) throw new Error('nothing asked')
    return near(u.c, p)
  },
  'uniform/prob'(p) {
    const u = flat(...intervalOf(p.text))
    const [lo, hi] = eventOf(p.latex)
    return near(integral(u, lo, hi), p)
  },
  'uniform/mean'(p) {
    const u = flat(...intervalOf(p.text))
    const m1 = integral(u, u.a, u.b, x => x)
    const m2 = integral(u, u.a, u.b, x => x * x)
    if (p.latex.startsWith('E[X]')) return near(m1, p)
    if (p.latex.startsWith('E[X^2]')) return near(m2, p)
    if (p.latex.includes('Var')) return near(m2 - m1 * m1, p)
    if (p.latex.startsWith('\\sigma')) return near(Math.sqrt(m2 - m1 * m1), p)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
}

export const SAMPLES = {
  'uniform/derive': 300,
  'uniform/height': 400,
  'uniform/prob': 400,
  'uniform/mean': 400,
}
