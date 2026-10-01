// Independent checkers for the Test 2 'chi-squared' topic. See ../../verify.mjs.
//
// The table is rebuilt from the density alone: the cdf by integrating
// x^(γ/2 - 1)e^(-x/2) numerically (its normalizing constant is integrated too),
// each quantile by bisection, then rounded to 3 significant figures the way the
// printed table is. Rows are built once and cached.
import { integrate } from './_lib.mjs'

// column headings: the area to the LEFT of each entry
const LEFT = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.975, 0.99, 0.995]

// x = u² turns x^(γ/2-1)e^(-x/2) dx into 2u^(γ-1)e^(-u²/2) du, smooth even for
// γ = 1. Past u = 16 the integrand is negligible for every γ up to 60.
const kernel = g => u => 2 * Math.pow(u, g - 1) * Math.exp(-(u * u) / 2)
const U_END = 16
const totals = new Map()
function total(g) {
  if (!totals.has(g)) totals.set(g, integrate(kernel(g), 0, U_END, 6000))
  return totals.get(g)
}
const cdf = (g, x) => integrate(kernel(g), 0, Math.sqrt(x), 2000) / total(g)

function quantile(g, area) {
  let lo = 0
  let hi = U_END
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2
    if (integrate(kernel(g), 0, mid, 2000) / total(g) < area) lo = mid
    else hi = mid
  }
  const u = (lo + hi) / 2
  return u * u
}
const rows = new Map()
function row(g) {
  if (!Number.isInteger(g) || g < 1 || g > 30) throw new Error(`γ = ${g} is not a row of the table`)
  if (!rows.has(g)) rows.set(g, LEFT.map(a => Number(quantile(g, a).toPrecision(3))))
  return rows.get(g)
}
function column(area) {
  const i = LEFT.findIndex(a => Math.abs(a - area) < 1e-9)
  if (i < 0) throw new Error(`${area} is not a column of the table`)
  return i
}
// the column holding the printed value c in row g (exactly one, or the problem is broken)
function columnOf(g, c) {
  const hits = row(g)
    .map((v, i) => (Math.abs(v - c) <= 1e-9 * c ? i : -1))
    .filter(i => i >= 0)
  if (hits.length !== 1) throw new Error(`${c} is not an entry of row ${g}`)
  // the entry is rounded, so its true left area is only near the column heading
  if (Math.abs(cdf(g, c) - LEFT[hits[0]]) > 0.01) throw new Error(`P(χ² < ${c}) is far from ${LEFT[hits[0]]}`)
  return hits[0]
}

// mean and variance by integrating x and x² against the density
const momentCache = new Map()
function moments(g) {
  if (!momentCache.has(g)) {
    const k = kernel(g)
    const m1 = integrate(u => u * u * k(u), 0, U_END, 6000) / total(g)
    const m2 = integrate(u => u ** 4 * k(u), 0, U_END, 6000) / total(g)
    const mean = Math.round(m1)
    const variance = Math.round(m2 - m1 * m1)
    if (Math.abs(m1 - mean) > 1e-7 || Math.abs(m2 - m1 * m1 - variance) > 1e-6) throw new Error(`moments of γ = ${g} are not whole`)
    momentCache.set(g, { mean, variance })
  }
  return momentCache.get(g)
}
// the degrees of freedom whose moment matches
function dfWith(key, value) {
  const hits = []
  for (let g = 1; g <= 60; g++) if (moments(g)[key] === value) hits.push(g)
  if (hits.length !== 1) throw new Error(`${hits.length} chi-squared distributions have ${key} ${value}`)
  return hits[0]
}

const dfOf = text => {
  const m = text.match(/γ = (\d+) degrees? of freedom/)
  if (!m) throw new Error(`no degrees of freedom in "${text}"`)
  return Number(m[1])
}
const N = '(\\d+(?:\\.\\d+)?)'
const rightArea = latex => {
  const m = latex.match(new RegExp(`^\\\\chi\\^2_\\{${N}\\} = `)) ?? latex.match(new RegExp(`^P\\(\\\\chi\\^2 > c\\) = ${N}$`))
  if (!m) throw new Error(`no right area in ${latex}`)
  return Number(m[1])
}

export const derive = {
  'chi-squared/critical': p => row(dfOf(p.text))[column(1 - rightArea(p.latex))],
  'chi-squared/left-value'(p) {
    const m = p.latex.match(new RegExp(`^P\\(\\\\chi\\^2 (?:\\\\le|<) c\\) = ${N}$`))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return row(dfOf(p.text))[column(Number(m[1]))]
  },
  'chi-squared/right-area'(p) {
    const m = p.latex.match(new RegExp(`P\\(\\\\chi\\^2 > ${N}\\) = `))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return 1 - LEFT[columnOf(dfOf(p.text), Number(m[1]))]
  },
  'chi-squared/left-area'(p) {
    const m = p.latex.match(new RegExp(`P\\(\\\\chi\\^2 (?:\\\\le|<) ${N}\\) = `))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    return LEFT[columnOf(dfOf(p.text), Number(m[1]))]
  },
  'chi-squared/between'(p) {
    const m = p.latex.match(new RegExp(`P\\(${N} < \\\\chi\\^2 < ${N}\\) = `))
    if (!m) throw new Error(`unrecognized ${p.latex}`)
    const g = dfOf(p.text)
    const i = columnOf(g, Number(m[1]))
    const j = columnOf(g, Number(m[2]))
    if (j <= i) throw new Error('the interval is backwards')
    return LEFT[j] - LEFT[i]
  },
  'chi-squared/mean-var'(p) {
    let g
    let m
    if ((m = p.text.match(/γ = (\d+) degrees? of freedom/))) g = Number(m[1])
    else if ((m = p.text.match(/with variance (\d+)\./))) g = dfWith('variance', Number(m[1]))
    else if ((m = p.text.match(/with standard deviation (\d+(?:\.\d+)?)\./))) g = dfWith('variance', Number(m[1]) ** 2)
    else if ((m = p.text.match(/with mean (\d+)\./))) g = dfWith('mean', Number(m[1]))
    else throw new Error(`unrecognized ${p.text}`)
    const L = p.latex
    if (L.startsWith('E[X]')) return moments(g).mean
    if (L.startsWith('\\operatorname{Var}')) return moments(g).variance
    if (L.startsWith('\\sigma_X')) return Math.sqrt(moments(g).variance)
    if (L.startsWith('\\gamma')) return g
    if (L.startsWith('\\chi^2_')) return row(g)[column(1 - rightArea(L))]
    throw new Error(`unrecognized ask ${L}`)
  },
}

export const SAMPLES = {
  'chi-squared/critical': 600,
  'chi-squared/left-value': 600,
  'chi-squared/right-area': 600,
  'chi-squared/left-area': 600,
  'chi-squared/between': 600,
  'chi-squared/mean-var': 600,
}
