import { formulaAnswer, toLatex } from '../../../engine/expr.js'
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

// Lettered options with the right one at a random position.
export function lettered(right, wrong) {
  const opts = [...wrong.slice(0, 3)]
  const at = Math.floor(Math.random() * (opts.length + 1))
  opts.splice(at, 0, right)
  return { options: opts, answer: 'abcd'[at] }
}
