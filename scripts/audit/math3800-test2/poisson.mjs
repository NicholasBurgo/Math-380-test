// Independent checkers for the Test 2 'poisson' topic. See ../../verify.mjs.
//
// k is rebuilt from the story with this module's own unit table, and the pmf
// comes from the recursion f(x + 1) = f(x) · k/(x + 1) starting at f(0) = e^(-k),
// never from the closed form.
import { confirmFormula } from './_lib.mjs'

// [dimension, size in a base unit]
const UNITS = {
  minute: ['time', 60],
  hour: ['time', 3600],
  day: ['time', 86400],
  year: ['time', 31557600],
  month: ['time', 31557600 / 12],
  m: ['length', 1],
  km: ['length', 1000],
  mile: ['length', 1609.344],
  page: ['page', 1],
  'cubic millimeter': ['volume', 1],
}

function kOf(text) {
  const given = text.match(/^X is Poisson with k = (\d*\.?\d+)\.$/)
  if (given) return +given[1]
  const rate = text.match(/(\d*\.?\d+)[a-z ]*? per (cubic millimeter|hour|day|year|km|mile|page)\b/)
  if (!rate) throw new Error(`no rate in: ${text}`)
  const rest = text.slice(0, rate.index) + text.slice(rate.index + rate[0].length)
  const win = rest.match(/(\d*\.?\d+)[ -](cubic millimeter|minute|month|mile|hour|page|day|km|m)s?\b/)
  if (!win) throw new Error(`no interval in: ${text}`)
  const [dimR, sizeR] = UNITS[rate[2]]
  const [dimW, sizeW] = UNITS[win[2]]
  if (dimR !== dimW) throw new Error(`rate per ${rate[2]} but interval in ${win[2]}`)
  return +rate[1] * ((+win[1] * sizeW) / sizeR)
}

function pmf(k, upto = 200) {
  const out = [Math.exp(-k)]
  for (let x = 0; x < upto; x++) out.push((out[x] * k) / (x + 1))
  return out
}
const cum = (dist, c) => dist.slice(0, Math.max(0, c + 1)).reduce((a, b) => a + b, 0)

function eventProb(dist, latex) {
  let m
  if ((m = latex.match(/P\(X = (\d+)\)/))) return dist[+m[1]]
  if ((m = latex.match(/P\(X \\le (\d+)\)/))) return cum(dist, +m[1])
  if ((m = latex.match(/P\(X < (\d+)\)/))) return cum(dist, +m[1] - 1)
  if ((m = latex.match(/P\(X \\ge (\d+)\)/))) return 1 - cum(dist, +m[1] - 1)
  if ((m = latex.match(/P\(X > (\d+)\)/))) return 1 - cum(dist, +m[1])
  throw new Error(`unrecognized event ${latex}`)
}

export const derive = {
  'poisson/find-k': p => kOf(p.text),
  'poisson/pmf': p => eventProb(pmf(kOf(p.text)), p.latex),
  'poisson/tail': p => eventProb(pmf(kOf(p.text)), p.latex),
  'poisson/moments'(p) {
    const dist = pmf(kOf(p.text))
    let m1 = 0
    let m2 = 0
    dist.forEach((w, x) => {
      m1 += x * w
      m2 += x * x * w
    })
    if (p.latex.startsWith('E[X]')) return m1
    if (p.latex.includes('Var')) return m2 - m1 * m1
    if (p.latex.includes('sigma')) return Math.sqrt(m2 - m1 * m1)
    throw new Error(`unrecognized ask ${p.latex}`)
  },
  'poisson/write-pdf'(p) {
    const dist = pmf(kOf(p.text), 30)
    return confirmFormula(p, e => dist[e.x], [0, 1, 2, 4, 6, 9].map(x => ({ x })))
  },
}

export const SAMPLES = { 'poisson/moments': 1000 }
