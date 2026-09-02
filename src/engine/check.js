// Parse "14", "-3.5", "7/6", "x = 4", "1,5", "42%" into a number; null if unreadable.
export function parseAnswer(raw) {
  let t = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^[a-z]=/, '')
    .replace(',', '.')
  let percent = false
  if (t.endsWith('%')) {
    percent = true
    t = t.slice(0, -1)
  }
  let n = null
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
  if (frac) {
    const d = Number(frac[2])
    n = d === 0 ? null : Number(frac[1]) / d
  } else {
    const v = Number(t)
    n = t !== '' && Number.isFinite(v) ? v : null
  }
  return percent && n !== null ? n / 100 : n
}

export function checkAnswer(raw, problem) {
  if (problem.accept) return problem.accept(raw)
  if (typeof problem.answer === 'string') {
    const norm = s => s.trim().toLowerCase().replace(/\s+/g, '')
    return norm(raw) === norm(problem.answer)
  }
  const n = parseAnswer(raw)
  if (n === null) return false
  const tol = problem.tolerance ?? 1e-6
  if (Math.abs(n - problem.answer) < tol) return true
  // probability answers: "16" for 0.16 counts — they meant percent
  if (problem.answer > 0 && problem.answer < 1 && n > 1 && Math.abs(n / 100 - problem.answer) < tol) {
    return true
  }
  return false
}
