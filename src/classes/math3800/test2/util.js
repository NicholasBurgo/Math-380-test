import { evalExpr, formulaAnswer, parseExpr, toLatex } from '../../../engine/expr.js'
import { choice } from '../../../engine/rand.js'

export { tolFor, probs } from '../util.js'

// A number as text: 4 significant figures below 1, otherwise up to 4 decimals.
export function num(x) {
  if (!Number.isFinite(x)) return String(x)
  return String(Math.abs(x) < 1 && x !== 0 ? Number(x.toPrecision(4)) : parseFloat(x.toFixed(4)))
}

// A probability or rate as written in a problem: 0.35, 0.05, 0.125 (no trailing zeros).
export const dec = x => String(parseFloat(x.toFixed(6)))

// One of these, at random: probabilities that read cleanly in a problem.
export const someP = (list = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]) => choice(list)

// Lines of a derivation, aligned on their "=".
export const derivation = lines => `\\begin{aligned} ${lines.join(' \\\\ ')} \\end{aligned}`

// The blank in a derivation.
export const BOX = '\\boxed{\\;?\\;}'

// A problem whose answer is a formula. `vars` are the letters it may use,
// `points` values of them where every wrong form differs from the answer.
// Choices mode shows `choices` (wrong formulas) as rendered math.
export function formula({ answer, vars, points, choices = [], ...rest }) {
  return {
    placeholder: 'type the formula',
    ...rest,
    answer,
    answerLatex: rest.answerLatex ?? toLatex(answer, vars),
    accept: formulaAnswer(answer, vars, points),
    expr: { vars },
    choices,
  }
}

// Typed antiderivatives: a trailing + C is optional, and C (or c) anywhere is a
// constant. Both letters are variables so a lowercase "+ c" still parses.
const ANTI_VARS = ['x', 'C', 'c']
// where slopes are compared: away from x = 0, where integrands like x·e^(ax) vanish
const ANTI_XS = [-1.3, -0.6, 0.7, 1.4]

// Slopes of a typed formula in x at ANTI_XS (five-point central differences),
// or null when it does not parse or evaluate.
function slopes(raw) {
  try {
    const ast = parseExpr(String(raw).replace(/\+\s*c\s*$/i, ''), ANTI_VARS)
    const F = x => evalExpr(ast, { x, C: 0.7, c: 0.7 })
    const h = 1e-3
    return ANTI_XS.map(x => (8 * (F(x + h) - F(x - h)) - (F(x + 2 * h) - F(x - 2 * h))) / (12 * h))
  } catch {
    return null
  }
}
const sameSlopes = (s, t) =>
  s !== null && s.every((v, i) => Number.isFinite(v) && Math.abs(v - t[i]) <= 1e-6 * Math.max(Math.abs(v), Math.abs(t[i])) + 1e-9)

// A problem whose answer is an antiderivative of `integrand` (a formula in x).
// Typed answers are graded by their derivative, so any constant is right,
// written + C or not. `choices` are wrong antiderivatives: any that turn out
// right after all (a slip can vanish for a = 1) or repeat an earlier one up to
// a constant are dropped, and the first three kept.
export function antiderivative({ integrand, answer, choices = [], ...rest }) {
  const f = parseExpr(integrand, ['x'])
  const want = ANTI_XS.map(x => evalExpr(f, { x }))
  const kept = []
  for (const c of choices) {
    const s = slopes(c)
    if (s && !sameSlopes(s, want) && !kept.some(k => sameSlopes(k.s, s))) kept.push({ c, s })
  }
  return {
    placeholder: 'an antiderivative in x (+ C optional)',
    ...rest,
    answer,
    answerLatex: rest.answerLatex ?? toLatex(answer, ANTI_VARS),
    accept: raw => sameSlopes(slopes(raw), want),
    expr: { vars: ANTI_VARS },
    choices: kept.slice(0, 3).map(k => k.c),
  }
}

// Lettered options with the right one at a random position.
export function lettered(right, wrong) {
  const opts = [...wrong.slice(0, 3)]
  const at = Math.floor(Math.random() * (opts.length + 1))
  opts.splice(at, 0, right)
  return { options: opts, answer: 'abcd'[at] }
}
