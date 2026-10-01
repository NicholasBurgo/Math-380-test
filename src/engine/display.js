// How the right answer is shown after a miss (and in Learn and test reviews).

const LETTERS = 'abcdefgh'

// Plain words inside KaTeX's \text{}: escape what \text would read as commands.
const textSafe = s =>
  String(s)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/([#$%&_{}])/g, '\\$1')
    .replace(/\^/g, '\\textasciicircum ')
    .replace(/~/g, '\\textasciitilde ')

// The answer as one LaTeX string (for compact lists like a set summary). A
// lettered text option shows just its letter here; AnswerText shows the words.
export function answerDisplay(p) {
  if (p.answerLatex) return p.answerLatex
  if (p.options && typeof p.answer === 'string') {
    const o = p.options[LETTERS.indexOf(p.answer)]
    if (o !== undefined && typeof o !== 'string') return `\\text{(${p.answer}) } ${o.latex}`
    return `\\text{(${textSafe(p.answer)})}`
  }
  return String(p.answer)
}

// The right lettered option, if the problem has them: { letter, text } or { letter, latex }.
export function rightOption(p) {
  if (p.answerLatex || !p.options || typeof p.answer !== 'string') return null
  const o = p.options[LETTERS.indexOf(p.answer)]
  if (o === undefined) return null
  return typeof o === 'string' ? { letter: p.answer, text: o } : { letter: p.answer, latex: o.latex }
}
