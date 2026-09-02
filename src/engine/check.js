// Parse "14", "-3.5", "7/6", "x = 4", "1,5" into a number; null if unreadable.
export function parseAnswer(raw) {
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^[a-z]=/, '')
    .replace(',', '.')
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
  if (frac) {
    const d = Number(frac[2])
    return d === 0 ? null : Number(frac[1]) / d
  }
  const n = Number(t)
  return t !== '' && Number.isFinite(n) ? n : null
}

export function checkAnswer(raw, problem) {
  if (problem.accept) return problem.accept(raw)
  const n = parseAnswer(raw)
  return n !== null && Math.abs(n - problem.answer) < 1e-6
}
