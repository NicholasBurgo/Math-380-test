import { randInt, choice, shuffle } from '../../engine/rand.js'
import {
  V, NOT, AND, OR, IMP, toLatex, column, colString, varsOf, truthTableLatex, evaluate, randomFormula,
} from '../../engine/logic.js'
import { acceptColumn, tf, tfLatex, withOptions } from './util.js'

// Clause bank for "if, then" rewrites: each has a negated form too.
const CLAUSES = [
  { a: 'the figure is a square', na: 'the figure is not a square', b: 'the figure is a rectangle', nb: 'the figure is not a rectangle' },
  { a: 'John cooks dinner', na: 'John does not cook dinner', b: 'John has the right ingredients', nb: 'John does not have the right ingredients' },
  { a: 'Sally has a cat', na: 'Sally does not have a cat', b: 'Sally is a librarian', nb: 'Sally is not a librarian' },
  { a: 'Vicki has enough money', na: 'Vicki does not have enough money', b: 'Vicki goes to the movies', nb: 'Vicki does not go to the movies' },
  { a: 'the program is correct', na: 'the program is not correct', b: 'the program produces no error messages', nb: 'the program produces error messages' },
  { a: 'n is a multiple of 4', na: 'n is not a multiple of 4', b: 'n is even', nb: 'n is odd' },
  { a: 'it rains', na: 'it does not rain', b: 'the game is cancelled', nb: 'the game is not cancelled' },
  { a: 'x > 3', na: 'x ≤ 3', b: 'x² > 9', nb: 'x² ≤ 9' },
]

// Phrasings of X ⇒ Y using the two clauses. `swap` means the sentence
// mentions Y first.
const PHRASINGS = [
  { make: (X, Y) => `${cap(X)} only if ${Y}.`, name: '"X only if Y" means X ⇒ Y' },
  { make: (X, Y) => `${cap(Y)} if ${X}.`, name: '"Y if X" means X ⇒ Y: the "if" clause is the hypothesis' },
  { make: (X, Y) => `${cap(Y)}, provided that ${X}.`, name: '"provided that X" is the hypothesis' },
  { make: (X, Y) => `${cap(Y)} whenever ${X}.`, name: '"whenever X" is the hypothesis' },
  { make: (X, Y) => `That ${X} implies that ${Y}.`, name: '"X implies Y" is X ⇒ Y' },
  { make: (X, Y) => `In order that ${Y}, it is sufficient that ${X}.`, name: 'X sufficient for Y means X ⇒ Y' },
  { make: (X, Y) => `In order that ${X}, it is necessary that ${Y}.`, name: 'Y necessary for X means X ⇒ Y' },
]
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// Open sentences P(x, y) ⇒ Q(x, y) (or in one variable) evaluated at a point.
const OPEN = [
  {
    vars: 'x, y', P: 'x^2 + y^2 = 1', Q: 'x + y = 1',
    p: (x, y) => x * x + y * y === 1, q: (x, y) => x + y === 1,
    points: [[1, -1], [-3, 4], [0, -1], [1, 0], [0, 1], [-1, 0], [2, -1]],
  },
  {
    vars: 'x, y', P: 'x = y', Q: 'x^2 = y^2',
    p: (x, y) => x === y, q: (x, y) => x * x === y * y,
    points: [[2, 2], [2, -2], [3, 1], [-1, -1], [0, 5]],
  },
  {
    vars: 'x, y', P: 'x^2 = y^2', Q: 'x = y',
    p: (x, y) => x * x === y * y, q: (x, y) => x === y,
    points: [[2, 2], [2, -2], [3, 1], [-1, -1], [-4, 4], [0, 0]],
  },
  {
    vars: 'n', P: 'n \\text{ is prime}', Q: 'n \\text{ is odd}',
    p: n => isPrime(n), q: n => n % 2 !== 0,
    points: [[2], [3], [7], [9], [10], [15], [11]],
  },
  {
    vars: 'x', P: 'x > 3', Q: 'x^2 > 9',
    p: x => x > 3, q: x => x * x > 9,
    points: [[4], [-4], [2], [3], [10], [-1]],
  },
  {
    vars: 'x', P: 'x^2 > 9', Q: 'x > 3',
    p: x => x * x > 9, q: x => x > 3,
    points: [[4], [-4], [2], [3], [-5], [0]],
  },
  {
    vars: 'n', P: 'n \\text{ is even}', Q: 'n \\text{ is a multiple of } 4',
    p: n => n % 2 === 0, q: n => n % 4 === 0,
    points: [[6], [8], [5], [12], [2], [7]],
  },
  {
    vars: 'n', P: 'n \\text{ is a multiple of } 4', Q: 'n \\text{ is even}',
    p: n => n % 4 === 0, q: n => n % 2 === 0,
    points: [[6], [8], [5], [12], [2], [7]],
  },
]

const plain = s => s.replace(/\s*\\text\{\s*/g, ' ').replace(/\}/g, '').replace(/\^2/g, '²').replace(/\s+/g, ' ').trim()

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

const IF_THEN = [
  { s: 'Let C be a circle of diameter √(2/π). Then the area of C is 1/2.', ok: 'If C is a circle of diameter √(2/π), then the area of C is 1/2.', bad: ['If the area of C is 1/2, then C is a circle of diameter √(2/π).', 'If C is a circle, then its diameter is √(2/π) and its area is 1/2.', 'C is a circle of diameter √(2/π) if and only if the area of C is 1/2.'] },
  { s: 'The 4th power of every odd integer is odd.', ok: 'If n is an odd integer, then n⁴ is odd.', bad: ['If n⁴ is odd, then n is an odd integer.', 'If n is an integer, then n⁴ is odd.', 'If n is odd, then n⁴ is even.'] },
  { s: 'Suppose that the slope of a line l is 2. Then the equation of l is y = 2x + b for some real number b.', ok: 'If the slope of a line l is 2, then the equation of l is y = 2x + b for some real number b.', bad: ['If the equation of l is y = 2x + b for some real number b, then the slope of l is 2.', 'If l is a line, then its slope is 2.', 'If l is a line with equation y = 2x + b, then b is a real number.'] },
  { s: 'Whenever a and b are nonzero rational numbers, a/b is a nonzero rational number.', ok: 'If a and b are nonzero rational numbers, then a/b is a nonzero rational number.', bad: ['If a/b is a nonzero rational number, then a and b are nonzero rational numbers.', 'If a and b are rational numbers, then a/b is a nonzero rational number.', 'If a and b are nonzero, then a/b is rational.'] },
  { s: 'For every three integers, there exist two of them whose sum is even.', ok: 'If a, b, and c are integers, then two of a, b, c have an even sum.', bad: ['If two of a, b, c have an even sum, then a, b, and c are integers.', 'If a, b, and c are integers, then a + b + c is even.', 'If a and b are integers, then a + b is even.'] },
  { s: 'The number √3 is irrational.', ok: 'If x = √3, then x is irrational.', bad: ['If x is irrational, then x = √3.', 'If x is a real number, then x is irrational.', 'If x = 3, then √x is rational.'] },
  { s: 'Every multiple of 6 is even.', ok: 'If n is a multiple of 6, then n is even.', bad: ['If n is even, then n is a multiple of 6.', 'If n is a multiple of 6, then n is odd.', 'If n is an integer, then n is a multiple of 6.'] },
  { s: 'A square has four equal sides.', ok: 'If a figure is a square, then it has four equal sides.', bad: ['If a figure has four equal sides, then it is a square.', 'If a figure is a square, then it has four right angles.', 'A figure is a square if and only if it has four equal sides.'] },
]

const MUSTANG = {
  gives: [{ t: 'a Ford Mustang', P: true }, { t: 'a Cadillac', P: false }, { t: 'an apple', P: false }],
  gets: [{ t: 'my house', Q: true }, { t: "my neighbor's house", Q: false }, { t: 'a banana', Q: false }],
}

function randImp(vars) {
  for (let tries = 0; tries < 60; tries++) {
    const f = randomFormula(Math.random, vars, ['imp', 'imp', 'and', 'or', 'not'], 2)
    if (varsOf(f).length === vars.length && JSON.stringify(f).includes('"imp"') && f.t !== 'var') return f
  }
  return IMP(AND(V(vars[0]), V(vars[1])), V(vars[vars.length - 1]))
}

export default {
  id: 'implications',
  name: 'Implications',
  description: '§2.4–2.5: P ⇒ Q, vacuous truth, only if / sufficient / necessary, open-sentence implications. HW 20, 22bc, 26, 28, 30, 32a, 34.',
  learn: {
    formulas: [
      { label: 'Truth table (false only when T ⇒ F)', latex: '\\begin{array}{cc|c} P & Q & P \\Rightarrow Q \\\\ \\hline T & T & T \\\\ T & F & F \\\\ F & T & T \\\\ F & F & T \\end{array}' },
      { label: 'Hypothesis and conclusion', latex: 'P \\Rightarrow Q: \\; P \\text{ is the hypothesis, } Q \\text{ the conclusion}' },
      { label: 'Vacuously true', latex: 'P \\text{ false} \\;\\Rightarrow\\; (P \\Rightarrow Q) \\text{ true}' },
      { label: 'Same thing, six ways', latex: '\\text{If } P \\text{ then } Q; \\; Q \\text{ if } P; \\; P \\text{ only if } Q; \\; P \\text{ sufficient for } Q; \\; Q \\text{ necessary for } P' },
    ],
    how: [
      'An implication is a promise. It breaks only when the hypothesis happens and the conclusion does not: T ⇒ F is the one false row.',
      'If the hypothesis is false, the implication is true no matter what (vacuously true). "If you give me a Cadillac..." never breaks a Mustang promise.',
      '"P only if Q": P can happen only when Q does, so P ⇒ Q. "Q if P" is also P ⇒ Q: the "if" clause is always the hypothesis.',
      'Sufficient sits on the left: "P is sufficient for Q" is P ⇒ Q. Necessary sits on the right: "Q is necessary for P" is P ⇒ Q.',
      'Open sentences at a point: evaluate P and Q separately, then apply the table. P false gives true automatically.',
      'Compound tables: do the implication last (after ∧, ∨, ~), like a lowest-priority operation.',
    ],
  },
  templates: [
    {
      id: 'evaluate-imp',
      generate() {
        if (Math.random() < 0.5) {
          const g = choice(MUSTANG.gives)
          const r = choice(MUSTANG.gets)
          const v = !g.P || r.Q
          return {
            ask: 'Is the conditional statement true or false?',
            text: `Promise: "If you give me a Ford Mustang, then I will give you my house." What happens: you give me ${g.t} and I give you ${r.t}.`,
            latex: `P \\Rightarrow Q, \\quad P \\text{ is ${g.P ? 'T' : 'F'}}, \\; Q \\text{ is ${r.Q ? 'T' : 'F'}}`,
            size: 'small',
            answer: tf(v),
            answerLatex: tfLatex(v),
            placeholder: 'true / false',
            hint: {
              latex: 'T \\Rightarrow F \\text{ is the only false case}',
              text: g.P
                ? r.Q
                  ? 'True: you kept your side and I kept mine.'
                  : 'False: you gave the Mustang and I broke the promise. This is the T ⇒ F row.'
                : 'True (vacuously): no Mustang was given, so the promise was never tested and cannot have been broken.',
            },
          }
        }
        const vars = ['P', 'Q', 'R']
        const f = randImp(vars)
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
            latex: 'P \\Rightarrow Q \\text{ is false only when } P \\text{ is T and } Q \\text{ is F}',
            text: 'Substitute, resolve ~ and the parentheses, then apply the implication last. A false hypothesis makes the implication true.',
          },
        }
      },
    },
    {
      id: 'truth-table',
      generate() {
        const vars = Math.random() < 0.6 ? ['P', 'Q'] : ['P', 'Q', 'R']
        const f = randImp(vars)
        const col = colString(column(f, vars))
        const flipped = col.replace(/[TF]/g, c => (c === 'T' ? 'F' : 'T'))
        const conv = f.t === 'imp' ? IMP(f.b, f.a) : IMP(V(vars[1]), V(vars[0]))
        const wrong = [flipped, colString(column(conv, vars)), colString(column(AND(V(vars[0]), V(vars[1])), vars)), colString(column(OR(V(vars[0]), NOT(V(vars[1]))), vars))]
        return {
          ask: 'Fill in the last column, top to bottom (e.g. TFTT).',
          latex: truthTableLatex(vars, toLatex(f)),
          size: 'small',
          answer: col,
          answerLatex: `\\text{${col}}`,
          accept: acceptColumn(col),
          placeholder: 'e.g. TFTT',
          choices: [...new Set(wrong.filter(w => w !== col))].slice(0, 3),
          hint: {
            latex: toLatex(f),
            text: 'Do the implication last. In each row it is false only when the left side is T and the right side is F.',
          },
        }
      },
    },
    {
      id: 'rewrite',
      generate() {
        const c = choice(CLAUSES)
        const ph = choice(PHRASINGS)
        // X ⇒ Y with X, Y drawn from the clause pair in either order
        const forward = Math.random() < 0.5
        const [X, Y, nX, nY] = forward ? [c.a, c.b, c.na, c.nb] : [c.b, c.a, c.nb, c.na]
        const sentence = ph.make(X, Y)
        const ok = `If ${X}, then ${Y}.`
        const bad = [`If ${Y}, then ${X}.`, `${cap(X)} if and only if ${Y}.`, `If ${nX}, then ${nY}.`]
        return withOptions(
          {
            ask: 'Rewrite in the form "If A, then B."',
            text: `"${sentence}"`,
            latex: '\\text{If } \\_\\_\\_, \\text{ then } \\_\\_\\_.',
            size: 'small',
            hint: {
              latex: 'P \\text{ only if } Q, \\; P \\text{ sufficient for } Q, \\; Q \\text{ necessary for } P: \\text{ all } P \\Rightarrow Q',
              text: `${ph.name}. So: "${ok}"`,
            },
          },
          ok,
          bad,
        )
      },
    },
    {
      id: 'open-imp',
      generate() {
        const o = choice(OPEN)
        const pt = choice(o.points)
        const p = o.p(...pt)
        const q = o.q(...pt)
        const v = !p || q
        const at = pt.length === 1 ? `${o.vars} = ${pt[0]}` : `(${o.vars}) = (${pt.join(', ')})`
        return {
          ask: 'Truth value of the implication at this point.',
          text: `Over the integers, P(${o.vars}): ${plain(o.P)} and Q(${o.vars}): ${plain(o.Q)}.`,
          latex: `P(${o.vars}) \\Rightarrow Q(${o.vars}) \\quad \\text{at } ${at}`,
          size: 'small',
          answer: tf(v),
          answerLatex: tfLatex(v),
          placeholder: 'true / false',
          hint: {
            latex: `P: \\text{${p ? 'T' : 'F'}}, \\; Q: \\text{${q ? 'T' : 'F'}}`,
            text: p
              ? q
                ? 'Hypothesis true and conclusion true: the implication holds.'
                : 'Hypothesis true but conclusion false: the one row where an implication fails.'
              : 'The hypothesis is false at this point, so the implication is vacuously true regardless of Q.',
          },
        }
      },
    },
    {
      id: 'if-then-form',
      generate() {
        const item = choice(IF_THEN)
        return withOptions(
          {
            ask: 'Rewrite using "if, then."',
            text: `"${item.s}"`,
            latex: '\\text{If } \\_\\_\\_, \\text{ then } \\_\\_\\_.',
            size: 'small',
            hint: {
              latex: '\\text{hypothesis} \\Rightarrow \\text{conclusion}',
              text: `Name the object, put the assumption in the hypothesis and the claim in the conclusion: "${item.ok}"`,
            },
          },
          item.ok,
          item.bad,
        )
      },
    },
  ],
}
