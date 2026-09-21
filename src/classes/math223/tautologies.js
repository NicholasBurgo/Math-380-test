import { choice, shuffle } from '../../engine/rand.js'
import { V, NOT, parse, toLatex, toText, column, colString, isTautology, isContradiction, substitute, evaluate } from '../../engine/logic.js'

const FORMULAS = [
  'P v ~P', 'P => P', '(P ^ Q) => P', 'P => (P v Q)', '(P => Q) <=> (~Q => ~P)', '((P => Q) ^ P) => Q',
  '~(P ^ ~P)', '(P => Q) v (Q => P)', 'P <=> ~~P', '(P v Q) v ~P', 'Q => (P => Q)', '~P => (P => Q)',
  '(P ^ Q) => (P v Q)', '(~P v Q) <=> (P => Q)', 'P => (Q => P)', '(P ^ (P => Q)) => Q',
  'P ^ ~P', 'P <=> ~P', '(P => Q) ^ (P ^ ~Q)', '~(P v ~P)', '(P ^ ~Q) ^ Q', '(P v Q) ^ (~P ^ ~Q)',
  'P ^ (P => ~P)', '~(P => P)', '(P ^ Q) ^ ~(P v Q)', '(P <=> Q) ^ (P ^ ~Q)',
  'P ^ Q', 'P v Q', 'P => Q', 'P <=> Q', '(P v Q) => P', '~P v Q', 'P => ~Q', '(P => Q) => P', 'P ^ ~Q',
  '~(P ^ Q)', '(P ^ Q) v R', 'P => (Q ^ R)', '(P v Q) ^ ~Q', 'Q => (P ^ Q)',
  '(P ^ Q) => Q', '((P => Q) ^ ~Q) => ~P', '((P v Q) ^ ~P) => Q', '((P => Q) ^ (Q => R)) => (P => R)',
  '~(P ^ Q) <=> (~P v ~Q)', '~(P v Q) <=> (~P ^ ~Q)', '~(P => Q) <=> (P ^ ~Q)', '(P <=> Q) <=> (Q <=> P)', '(P ^ Q) => (P <=> Q)',
  '((P => Q) ^ P) ^ ~Q', '(P <=> Q) ^ (P <=> ~Q)', '~((P ^ Q) => P)', '(P ^ Q) ^ (P => ~Q)', '~(P => (Q => P))', '~(P v Q) ^ P', '(P => Q) ^ ~(~P v Q)',
  '(P => Q) => (Q => P)', '(P => Q) ^ (Q => P)', '(P v Q) => (P ^ Q)', '~P => (P ^ Q)', '(P => Q) <=> (Q => P)', '(P ^ Q) => R',
  '(P v ~Q) ^ Q', 'P => (P ^ Q)', '(P v Q) => Q', '(P => Q) => Q', '~P <=> Q', '(P => Q) ^ ~P',
]
const kindOf = ast => (isTautology(ast) ? 'tautology' : isContradiction(ast) ? 'contradiction' : 'neither')
const CLASSIFIED = FORMULAS.map(src => {
  const ast = parse(src)
  return { ast, kind: kindOf(ast) }
})

// Same pattern, fresh letters: relabel P, Q, R (sometimes as a negated
// letter). A tautology or contradiction stays one under any substitution;
// a "neither" pattern can collapse, so those are re-checked.
function relabel(item) {
  for (let tries = 0; tries < 8; tries++) {
    const names = shuffle(['P', 'Q', 'R', 'S']).slice(0, 3)
    const map = {}
    ;['P', 'Q', 'R'].forEach((v, i) => (map[v] = Math.random() < 0.2 ? NOT(V(names[i])) : V(names[i])))
    const ast = substitute(item.ast, map)
    if (kindOf(ast) === item.kind) return ast
  }
  return item.ast
}

// A statement built from P, T, C whose value depends on at most P.
function randomSimplify() {
  const atoms = [V('P'), NOT(V('P')), V('T'), V('C')]
  const ops = ['and', 'or', 'imp', 'iff']
  for (;;) {
    let f = { t: choice(ops), a: choice(atoms), b: choice(atoms) }
    if (Math.random() < 0.4) {
      const outer = { t: choice(ops), a: f, b: choice(atoms) }
      f = Math.random() < 0.5 ? outer : { t: outer.t, a: outer.b, b: outer.a }
    }
    const src = toText(f)
    if (/[TC]/.test(src) && src.includes('P')) return f
  }
}

// P ∧ C, P ∨ T, ... simplified to P, ~P, T, or C.
const SIMPLIFY = [
  { latex: 'P \\wedge C', ans: 'C', why: 'a conjunction with a false statement is always false' },
  { latex: 'P \\wedge T', ans: 'P', why: '"P and true" is true exactly when P is' },
  { latex: 'P \\vee T', ans: 'T', why: 'a disjunction with a true statement is always true' },
  { latex: 'P \\vee C', ans: 'P', why: '"P or false" is true exactly when P is' },
  { latex: 'P \\Rightarrow T', ans: 'T', why: 'an implication with a true conclusion is always true' },
  { latex: 'C \\Rightarrow P', ans: 'T', why: 'a false hypothesis makes the implication vacuously true' },
  { latex: 'T \\Rightarrow P', ans: 'P', why: 'true ⇒ P is false only when P is false, so it matches P' },
  { latex: 'P \\Rightarrow C', ans: '~P', why: 'P ⇒ false is true only when P is false, so it matches ~P' },
  { latex: 'P \\Leftrightarrow T', ans: 'P', why: 'P matches T exactly when P is true' },
  { latex: 'P \\Leftrightarrow C', ans: '~P', why: 'P matches C exactly when P is false' },
  { latex: '\\sim T', ans: 'C', why: 'the negation of something always true is always false' },
  { latex: '\\sim C', ans: 'T', why: 'the negation of something always false is always true' },
  { latex: 'T \\wedge C', ans: 'C', why: 'true and false is false, in every row' },
  { latex: 'T \\vee C', ans: 'T', why: 'true or false is true, in every row' },
  { latex: 'P \\vee \\sim P', ans: 'T', why: 'one of P, ~P is always true' },
  { latex: 'P \\wedge \\sim P', ans: 'C', why: 'P and ~P can never both be true' },
  { latex: 'C \\Rightarrow T', ans: 'T', why: 'false hypothesis: vacuously true' },
  { latex: 'T \\Rightarrow C', ans: 'C', why: 'true hypothesis and false conclusion: the one false case, in every row' },
]
const SIMPLE_LATEX = { P: 'P', '~P': '\\sim P', T: 'T', C: 'C' }
const normSimple = s => String(s).toLowerCase().replace(/\s+/g, '').replace(/not|¬|!/g, '~').toUpperCase()

export default {
  id: 'tautologies',
  name: 'Tautologies & contradictions',
  description: '§2.7: always true, always false, simplifying with T and C. HW 46, 50.',
  learn: {
    formulas: [
      { label: 'Tautology: true in every row', latex: 'P \\vee \\sim P' },
      { label: 'Contradiction: false in every row', latex: 'P \\wedge \\sim P' },
      { label: 'Absorbing with T and C', latex: 'P \\wedge T \\equiv P, \\quad P \\wedge C \\equiv C, \\quad P \\vee T \\equiv T, \\quad P \\vee C \\equiv P' },
      { label: 'Implications with T and C', latex: 'C \\Rightarrow P \\equiv T, \\quad P \\Rightarrow T \\equiv T, \\quad T \\Rightarrow P \\equiv P, \\quad P \\Rightarrow C \\equiv \\sim P' },
    ],
    how: [
      'Build the full truth table and read the last column: all T means tautology, all F means contradiction, anything mixed means neither.',
      'Shortcut for implications: try to make it false (hypothesis T, conclusion F). If that is impossible, it is a tautology.',
      'T absorbs ∨ and disappears in ∧; C absorbs ∧ and disappears in ∨.',
      'For T ⇒ P and P ⇒ C, plug in: T ⇒ P copies P; P ⇒ C is true only when P is false, so it is ~P.',
    ],
  },
  templates: [
    {
      id: 'classify',
      generate() {
        const kind = choice(['tautology', 'contradiction', 'neither'])
        const ast = relabel(choice(CLASSIFIED.filter(c => c.kind === kind)))
        const item = { ast, kind }
        const col = colString(column(item.ast))
        return {
          ask: 'Tautology, contradiction, or neither?',
          latex: toLatex(item.ast),
          answer: kind,
          answerLatex: `\\text{${kind}}`,
          placeholder: 'tautology / contradiction / neither',
          choices: ['tautology', 'contradiction', 'neither'],
          hint: {
            latex: `\\text{column: } ${col}`,
            text: `The truth-table column is ${col.split('').join(' ')}: ${
              kind === 'tautology' ? 'all T, so a tautology' : kind === 'contradiction' ? 'all F, so a contradiction' : 'mixed, so neither'
            }.`,
          },
        }
      },
    },
    {
      id: 'simplify',
      generate() {
        let item = choice(SIMPLIFY)
        if (Math.random() < 0.55) {
          const f = randomSimplify()
          const at = P => evaluate(f, { P, T: true, C: false })
          const [whenT, whenF] = [at(true), at(false)]
          const ans = whenT && whenF ? 'T' : !whenT && !whenF ? 'C' : whenT ? 'P' : '~P'
          const word = v => (v ? 'true' : 'false')
          item = {
            latex: toLatex(f),
            ans,
            why: `with P true the statement is ${word(whenT)}, and with P false it is ${word(whenF)}, which is exactly the column of ${ans}`,
          }
        }
        return {
          ask: 'T is a tautology, C a contradiction, P a statement. Simplify.',
          latex: `${item.latex} \\;\\equiv\\; ?`,
          answer: item.ans,
          answerLatex: SIMPLE_LATEX[item.ans],
          accept: raw => normSimple(raw) === normSimple(item.ans),
          placeholder: 'P, ~P, T, or C',
          choices: ['P', '~P', 'T', 'C'].filter(x => x !== item.ans),
          hint: {
            latex: `${item.latex} \\equiv ${SIMPLE_LATEX[item.ans]}`,
            text: `Replace T by "true" and C by "false" in each row: ${item.why}.`,
          },
        }
      },
    },
  ],
}
