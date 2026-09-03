import { shuffle } from './rand.js'

const label = v => String(parseFloat(v.toFixed(4)))

function genericDistractors(p) {
  const a = p.answer
  const out = []
  if (a > 0 && a < 1) {
    out.push(1 - a, Math.min(0.99, a * 2), a / 2, Math.min(0.99, a + 0.1), Math.max(0.01, a - 0.1))
  } else if (Number.isInteger(a)) {
    out.push(a + 1, a - 1, a * 2, Math.round(a / 2), a + 10)
  } else {
    out.push(a * 2, a / 2, a + 0.5, a - 0.5)
  }
  return out
}

// Four options for a problem: the answer plus three wrong ones. Template
// distractors (common mistakes) go first; generic perturbations fill gaps.
export function buildChoices(problem) {
  if (typeof problem.answer === 'string') {
    return shuffle([
      { label: 'yes', correct: problem.answer === 'yes' },
      { label: 'no', correct: problem.answer === 'no' },
    ])
  }

  const tol = Math.max(problem.tolerance ?? 1e-6, 1e-9)
  const usedLabels = new Set([label(problem.answer)])
  const picked = []

  for (const c of [...(problem.distractors ?? []), ...genericDistractors(problem)]) {
    if (picked.length === 3) break
    if (!Number.isFinite(c)) continue
    if (Math.abs(c - problem.answer) < tol) continue
    if (problem.answer >= 0 && c < 0) continue
    const l = label(c)
    if (usedLabels.has(l)) continue
    usedLabels.add(l)
    picked.push(c)
  }

  let bump = 1
  while (picked.length < 3) {
    const step = Number.isInteger(problem.answer) ? bump : bump * 0.15
    const c = problem.answer + step
    const l = label(c)
    if (!usedLabels.has(l)) {
      usedLabels.add(l)
      picked.push(c)
    }
    bump += 1
  }

  return shuffle([
    { label: label(problem.answer), correct: true },
    ...picked.map(v => ({ label: label(v), correct: false })),
  ])
}
