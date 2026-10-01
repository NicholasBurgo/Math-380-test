// Distribution math for Test 2 (Chapter 3 part 2, Chapter 4), plus the printed
// tables the test hands out. Table answers are graded against these same
// table values, so what you read in the Tables panel is what's marked right.

export const comb = (n, k) => {
  if (k < 0 || k > n) return 0
  const m = Math.min(k, n - k)
  let c = 1
  for (let j = 1; j <= m; j++) c = (c * (n - m + j)) / j
  return n <= 60 ? Math.round(c) : c
}

export const factorial = n => {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

// ---------- discrete pdfs ----------

export const geomPdf = (p, x) => Math.pow(1 - p, x - 1) * p
export const binomPdf = (n, p, x) => comb(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x)
export const binomCdf = (n, p, x) => {
  let s = 0
  for (let i = 0; i <= Math.min(x, n); i++) s += binomPdf(n, p, i)
  return s
}
export const negBinPdf = (r, p, x) => comb(x - 1, r - 1) * Math.pow(p, r) * Math.pow(1 - p, x - r)
// population N with r successes, sample of n without replacement
export const hyperPdf = (N, r, n, x) => {
  if (x < 0 || x > r || n - x < 0 || n - x > N - r) return 0
  // product of ratios: stable even for N = 1000
  let logp = 0
  const lc = (a, b) => {
    let s = 0
    for (let j = 1; j <= b; j++) s += Math.log(a - b + j) - Math.log(j)
    return s
  }
  logp = lc(r, x) + lc(N - r, n - x) - lc(N, n)
  return Math.exp(logp)
}
export const poissonPdf = (k, x) => (Math.exp(-k) * Math.pow(k, x)) / factorial(x)

// ---------- normal ----------

// P(Z < z): 1/2 + phi(z) * (z + z^3/3 + z^5/(3*5) + ...), all terms positive.
export function normCdf(z) {
  if (z < 0) return 1 - normCdf(-z)
  if (z > 8.5) return 1
  let term = z
  let sum = z
  for (let k = 1; k < 500 && term > 1e-17 * sum; k++) {
    term *= (z * z) / (2 * k + 1)
    sum += term
  }
  return 0.5 + (sum * Math.exp(-(z * z) / 2)) / Math.sqrt(2 * Math.PI)
}

export const round = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp
export const sig = (x, figs = 3) => Number(x.toPrecision(figs))

// The z-table: z to 2 decimals, P(Z < z) to 4 decimals.
export const zTable = z => round(normCdf(round(z, 2)), 4)

// Every z the printed table lists, -3.99 ... 3.99.
export const Z_GRID = (() => {
  const out = []
  for (let h = -399; h <= 399; h++) out.push(h / 100)
  return out
})()

// Reading the table backwards: the listed z whose area is closest to `area`.
// When two neighbors tie (0.95 sits between 1.64 and 1.65), the answer is their
// midpoint and either one is right.
export function zForLeftArea(area) {
  let best = []
  let bestD = Infinity
  for (const z of Z_GRID) {
    const d = Math.abs(zTable(z) - area)
    if (d < bestD - 1e-12) {
      best = [z]
      bestD = d
    } else if (Math.abs(d - bestD) <= 1e-12) best.push(z)
  }
  const lo = Math.min(...best)
  const hi = Math.max(...best)
  return { z: round((lo + hi) / 2, 3), lo, hi }
}

// ---------- gamma family ----------

// ln Γ(a), Lanczos (g = 7)
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]
export function lnGamma(a) {
  if (a < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * a)) - lnGamma(1 - a)
  a -= 1
  let x = LANCZOS[0]
  for (let i = 1; i < 9; i++) x += LANCZOS[i] / (a + i)
  const t = a + 7.5
  return 0.5 * Math.log(2 * Math.PI) + (a + 0.5) * Math.log(t) - t + Math.log(x)
}

// P(a, x): regularized lower incomplete gamma, by its series
export function lowerGammaP(a, x) {
  if (x <= 0) return 0
  let term = 1 / a
  let sum = term
  for (let n = 1; n < 10000; n++) {
    term *= x / (a + n)
    sum += term
    if (term < sum * 1e-16) break
  }
  return Math.exp(Math.log(sum) - x + a * Math.log(x) - lnGamma(a))
}

export const chi2Cdf = (x, df) => lowerGammaP(df / 2, x / 2)

export function chi2Quantile(left, df) {
  let lo = 0
  let hi = Math.max(10, 10 * df)
  while (chi2Cdf(hi, df) < left) hi *= 2
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (chi2Cdf(mid, df) < left) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// The chi-squared table: the value with `left` area to its left, 3 significant figures.
export const chi2Table = (left, df) => sig(chi2Quantile(left, df), 3)

// ---------- the printed tables ----------

export const BINOMIAL_P = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]
export const CHI2_LEFT = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.975, 0.99, 0.995]

// The cumulative binomial table, n = 20: P(X <= x) to 4 decimals.
export const binomTable = (p, x, n = 20) => (x < 0 ? 0 : round(binomCdf(n, p, x), 4))

const f4 = v => v.toFixed(4)
const f3 = v => {
  const s = sig(v, 3)
  const mag = Math.floor(Math.log10(Math.abs(s)))
  return s.toFixed(Math.max(0, 2 - mag))
}

export function printedTables() {
  const zRows = []
  for (let tenth = -39; tenth <= 39; tenth++) {
    const neg = tenth < 0
    const base = Math.abs(tenth)
    const label = `${neg ? '-' : ''}${(base / 10).toFixed(1)}`
    const values = []
    for (let d = 0; d < 10; d++) values.push(f4(zTable(((neg ? -1 : 1) * (base * 10 + d)) / 100)))
    zRows.push({ label, values })
    if (tenth === -1) {
      const z0 = []
      for (let d = 0; d < 10; d++) z0.push(f4(zTable(-d / 100)))
      zRows.push({ label: '-0.0', values: z0 })
    }
  }
  return {
    binomial: {
      title: 'Cumulative binomial, n = 20',
      note: 'Row x, column p: the entry is P(X ≤ x).',
      corner: 'x \\ p',
      cols: BINOMIAL_P.map(String),
      rows: Array.from({ length: 21 }, (_, x) => ({
        label: String(x),
        values: BINOMIAL_P.map(p => f4(binomTable(p, x))),
      })),
    },
    normal: {
      title: 'Standard normal, P(Z < z)',
      note: 'Row: z to one decimal. Column: the second decimal. Row −1.2, column 0.05 is z = −1.25.',
      corner: 'z',
      cols: Array.from({ length: 10 }, (_, d) => (d / 100).toFixed(2)),
      rows: zRows,
    },
    chi2: {
      title: 'Chi-squared: value with this area to its LEFT',
      note: 'Row: degrees of freedom γ. χ²ᵣ has area r to the RIGHT, so read the column for 1 − r.',
      corner: 'γ \\ area',
      cols: CHI2_LEFT.map(String),
      rows: Array.from({ length: 30 }, (_, i) => ({
        label: String(i + 1),
        values: CHI2_LEFT.map(a => f3(chi2Table(a, i + 1))),
      })),
    },
  }
}
