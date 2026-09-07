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

// \frac{k}{n}, its reduced form when different, and a decimal approximation.
export function fracLatex(k, n) {
  const g = gcd(k, n)
  const reduced = g > 1 ? ` = \\frac{${k / g}}{${n / g}}` : ''
  return `\\frac{${k}}{${n}}${reduced} \\approx ${fmt(k / n, 4)}`
}

// Percent -> probability.
export const pct = v => v / 100

// Keep only usable probability distractors.
export const probs = (...vals) => vals.filter(v => v > 0 && v < 1)

// Answer tolerance: 0.005 absolute for ordinary probabilities, 5% relative
// for small ones so 0.01 is not accepted for 0.0125.
export const tolFor = v => Math.max(1e-6, Math.min(0.005, Math.abs(v) * 0.05))

// Fold a textbook-exercise pack ({ learn, templates }) into a section topic.
// Formulas with a label the topic already has are skipped.
export function withPack(topic, pack) {
  const seen = new Set(topic.learn.formulas.map(f => f.label))
  return {
    ...topic,
    learn: {
      formulas: [
        ...topic.learn.formulas,
        ...pack.learn.formulas.filter(f => !seen.has(f.label) && seen.add(f.label)),
      ],
      how: [...topic.learn.how, ...pack.learn.how],
    },
    templates: [...topic.templates, ...pack.templates],
  }
}
