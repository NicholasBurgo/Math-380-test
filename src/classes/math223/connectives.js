import { choice, shuffle } from '../../engine/rand.js'
import {
  V, NOT, AND, OR, toLatex, toText, column, colString, varsOf, truthTableLatex, equivalent, evaluate, randomFormula,
} from '../../engine/logic.js'
import { acceptColumn, tf, tfLatex, withOptions } from './util.js'

// Shared-subject atom pairs for English <-> symbols. Every predicate starts
// with "is" so "neither ... nor ..." reads naturally.
const PAIRS = [
  { subj: "Dave's dog", P: 'is a dachshund', nP: 'is not a dachshund', Q: 'is seventeen years old', nQ: 'is not seventeen years old' },
  { subj: 'The number n', P: 'is even', nP: 'is odd', Q: 'is prime', nQ: 'is not prime' },
  { subj: 'Sam', P: 'is a math major', nP: 'is not a math major', Q: 'is employed', nQ: 'is unemployed' },
  { subj: 'The function f', P: 'is continuous', nP: 'is not continuous', Q: 'is differentiable', nQ: 'is not differentiable' },
  { subj: 'The matrix M', P: 'is square', nP: 'is not square', Q: 'is invertible', nQ: 'is not invertible' },
  { subj: "Cyrano's nose", P: 'is small', nP: 'is not small', Q: 'is red', nQ: 'is not red' },
]

const lit = (name, neg) => (neg ? NOT(V(name)) : V(name))

// Each form: a formula builder from literal signs, and the English it renders to.
// pred(P?) returns the predicate text for P or Q with the given sign.
const FORMS = [
  { key: 'P^Q', ast: (p, q) => AND(lit('P', p), lit('Q', q)), english: (s, P, Q) => `${s.subj} ${P} and ${Q}.` },
  { key: 'P^Q-but', ast: (p, q) => AND(lit('P', p), lit('Q', q)), english: (s, P, Q) => `${s.subj} ${P}, but ${Q}.` },
  { key: 'neither', ast: (p, q) => AND(lit('P', p), lit('Q', q)), english: (s, P, Q) => `${s.subj} is neither ${P.replace(/^is (not )?/, '')} nor ${Q.replace(/^is (not )?/, '')}.`, onlyNeg: true },
  { key: 'PvQ', ast: (p, q) => OR(lit('P', p), lit('Q', q)), english: (s, P, Q) => `${s.subj} ${P} or ${Q}.` },
  { key: 'either', ast: (p, q) => OR(lit('P', p), lit('Q', q)), english: (s, P, Q) => `Either ${s.subj.replace(/^The /, 'the ')} ${P} or ${s.subj.replace(/^The /, 'the ')} ${Q}.` },
]

function sentenceFor(form, s, signP, signQ) {
  // signP true means the literal is ~P; the predicate shown must then be the negated one
  const P = signP ? s.nP : s.P
  const Q = signQ ? s.nQ : s.Q
  return form.english(s, P, Q)
}

function randTable(vars, ops) {
  for (let tries = 0; tries < 50; tries++) {
    const f = randomFormula(Math.random, vars, ops, 2)
    const used = varsOf(f)
    if (used.length === vars.length && f.t !== 'var' && !(f.t === 'not' && f.a.t === 'var')) return f
  }
  return AND(OR(V(vars[0]), NOT(V(vars[1]))), V(vars[vars.length - 1]))
}

export default {
  id: 'connectives',
  name: 'And / or',
  description: '§2.3: conjunction, disjunction, truth tables, English to symbols. HW 16, 18.',
  learn: {
    formulas: [
      { label: 'Conjunction (and)', latex: 'P \\wedge Q \\text{ is true only when both are true}' },
      { label: 'Disjunction (or, inclusive)', latex: 'P \\vee Q \\text{ is false only when both are false}' },
      { label: 'Truth tables', latex: '\\begin{array}{cc|c|c} P & Q & P \\wedge Q & P \\vee Q \\\\ \\hline T & T & T & T \\\\ T & F & F & T \\\\ F & T & F & T \\\\ F & F & F & F \\end{array}' },
      { label: 'Order of operations', latex: '\\sim \\text{ first}; \\; P \\wedge Q \\vee R \\text{ is ambiguous: use parentheses}' },
    ],
    how: [
      'Rows go in the standard order: TT, TF, FT, FF (with three letters: TTT, TTF, TFT, TFF, FTT, FTF, FFT, FFF). Variables in alphabetical order.',
      'Work one row at a time, inside-out: settle every ~ first, then the parentheses, then the outer connective.',
      '"and" means both; "or" means at least one (inclusive). "But" is just "and". "Neither A nor B" is (~A) ∧ (~B).',
      '~P ∨ Q means (~P) ∨ Q: negation binds tightest. To negate a whole disjunction you need ~(P ∨ Q).',
      'Translating back to English, watch a P that is already negative: if P is "the nose is not small", then ~P is "the nose is small".',
    ],
  },
  templates: [
    {
      id: 'truth-table',
      generate() {
        const vars = Math.random() < 0.65 ? ['P', 'Q'] : ['P', 'Q', 'R']
        const f = randTable(vars, ['and', 'or', 'and', 'or', 'not'])
        const col = colString(column(f, vars))
        const flipped = col.replace(/[TF]/g, c => (c === 'T' ? 'F' : 'T'))
        const swap = node =>
          node.t === 'and' ? { ...node, t: 'or', a: swap(node.a), b: swap(node.b) }
          : node.t === 'or' ? { ...node, t: 'and', a: swap(node.a), b: swap(node.b) }
          : node.t === 'not' ? NOT(swap(node.a)) : node
        const wrong = [flipped, colString(column(swap(f), vars)), colString(column(V(vars[0]), vars)), colString(column(NOT(V(vars[1])), vars))]
        return {
          ask: 'Fill in the last column, top to bottom (e.g. TFFT).',
          latex: truthTableLatex(vars, toLatex(f)),
          size: 'small',
          answer: col,
          answerLatex: `\\text{${col}}`,
          accept: acceptColumn(col),
          placeholder: 'e.g. TFFT',
          choices: [...new Set(wrong.filter(w => w !== col))].slice(0, 3),
          hint: {
            latex: toLatex(f),
            text: 'Row by row: resolve each ~ first, then the parentheses, then the outer connective. ∧ needs both true; ∨ needs at least one true.',
          },
        }
      },
    },
    {
      id: 'evaluate',
      generate() {
        const vars = ['P', 'Q', 'R']
        const f = randTable(vars, ['and', 'or', 'not'])
        const env = { P: Math.random() < 0.5, Q: Math.random() < 0.5, R: Math.random() < 0.5 }
        const v = evaluate(f, env)
        return {
          ask: 'Find the truth value.',
          text: `P is ${env.P ? 'true' : 'false'}, Q is ${env.Q ? 'true' : 'false'}, and R is ${env.R ? 'true' : 'false'}.`,
          latex: toLatex(f),
          answer: tf(v),
          answerLatex: tfLatex(v),
          placeholder: 'true / false',
          hint: {
            latex: toLatex(f),
            text: 'Substitute the three values, resolve every ~ first, then the parentheses, then the outer connective.',
          },
        }
      },
    },
    {
      id: 'to-symbols',
      generate() {
        const s = choice(PAIRS)
        const signP = Math.random() < 0.5
        const signQ = Math.random() < 0.5
        const forms = FORMS.filter(f => !f.onlyNeg || (signP && signQ))
        const form = choice(forms)
        const ast = form.ast(signP, signQ)
        const sentence = sentenceFor(form, s, signP, signQ)
        // wrong: other sign/op combos that are not logically equivalent
        const pool = []
        for (const p of [false, true]) for (const q of [false, true]) for (const mk of [AND, OR]) {
          const cand = mk(lit('P', p), lit('Q', q))
          if (!equivalent(cand, ast)) pool.push(cand)
        }
        pool.push(NOT(OR(V('P'), V('Q'))), NOT(AND(V('P'), V('Q'))))
        const wrong = shuffle(pool.filter(c => !equivalent(c, ast)))
        return withOptions(
          {
            ask: 'Write the sentence symbolically.',
            text: `P: "${s.subj} ${s.P}."  Q: "${s.subj} ${s.Q}."  Sentence: "${sentence}"`,
            latex: '\\text{symbolic form?}',
            size: 'small',
            hint: {
              latex: toLatex(ast),
              text: `"and"/"but"/"neither...nor" give ∧; "or"/"either...or" give ∨. A negated predicate ("${s.nP}") is the ~ of its letter. Answer: ${toText(ast)}.`,
            },
          },
          { latex: toLatex(ast) },
          wrong.map(c => ({ latex: toLatex(c) })),
        )
      },
    },
    {
      id: 'to-english',
      generate() {
        const s = choice(PAIRS)
        // P and Q may be *defined* as negative sentences (double-negation trap)
        const defP = Math.random() < 0.4
        const defQ = Math.random() < 0.3
        const signP = Math.random() < 0.5
        const signQ = Math.random() < 0.5
        const op = Math.random() < 0.5 ? AND : OR
        const ast = op(lit('P', signP), lit('Q', signQ))
        // actual polarity of each predicate after resolving the letter's definition
        const predP = defP !== signP ? s.nP : s.P
        const predQ = defQ !== signQ ? s.nQ : s.Q
        const joiner = op === AND ? 'and' : 'or'
        const english = (Pp, Qq, j) => `${s.subj} ${Pp} ${j} ${Qq}.`
        const ok = english(predP, predQ, joiner)
        const wrong = []
        for (const Pp of [s.P, s.nP]) for (const Qq of [s.Q, s.nQ]) for (const j of ['and', 'or']) {
          const e = english(Pp, Qq, j)
          if (e !== ok) wrong.push(e)
        }
        return withOptions(
          {
            ask: 'Write the statement in simple English.',
            text: `P: "${s.subj} ${defP ? s.nP : s.P}."  Q: "${s.subj} ${defQ ? s.nQ : s.Q}."`,
            latex: toLatex(ast),
            hint: {
              latex: toLatex(ast),
              text: `Answer: "${ok}". ${defP || defQ ? 'Careful: a letter defined as a negative sentence flips when negated (~"is not" = "is").' : 'Replace each letter by its sentence; ~ negates it, ∧ is "and", ∨ is "or".'}`,
            },
          },
          ok,
          shuffle(wrong),
        )
      },
    },
  ],
}
