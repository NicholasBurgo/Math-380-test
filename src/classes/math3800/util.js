import { randInt, shuffle } from '../../engine/rand.js'

// Clean decimal string: fmt(0.30000000000004) -> "0.3"
export function fmt(x, dp = 4) {
  return String(parseFloat(x.toFixed(dp)))
}

export function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

export function factorial(n) {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

// n percents (multiples of 5) summing to 100, shuffled.
export function randProbs(n) {
  for (let tries = 0; tries < 200; tries++) {
    const ps = []
    let sum = 0
    for (let i = 0; i < n - 1; i++) {
      const v = randInt(1, 8) * 5
      ps.push(v)
      sum += v
    }
    const last = 100 - sum
    if (last >= 5 && last <= 60) return shuffle([...ps, last])
  }
  return Array(n).fill(100 / n)
}

// KaTeX table for a discrete pdf. hideIdx masks one probability with "?".
export function pdfTable(xs, ps, hideIdx = -1) {
  const row1 = xs.join(' & ')
  const row2 = ps.map((p, i) => (i === hideIdx ? '?' : fmt(p / 100))).join(' & ')
  const cols = 'c'.repeat(xs.length)
  return `\\begin{array}{c|${cols}} x & ${row1} \\\\ \\hline f(x) & ${row2} \\end{array}`
}
