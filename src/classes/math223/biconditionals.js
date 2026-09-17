import { choice, shuffle } from '../../engine/rand.js'
import {
  V, NOT, AND, OR, IMP, IFF, toLatex, column, colString, varsOf, truthTableLatex, evaluate, randomFormula,
} from '../../engine/logic.js'
import { setStr, setLatex, acceptSet, acceptColumn, tf, tfLatex, withOptions } from './util.js'

const CLAUSES = [
  { a: 'it rains', na: 'it does not rain', b: 'the game is cancelled', nb: 'the game is not cancelled' },
  { a: 'n is even', na: 'n is odd', b: 'n² is even', nb: 'n² is odd' },
  { a: 'Sally has a cat', na: 'Sally does not have a cat', b: 'Sally is a librarian', nb: 'Sally is not a librarian' },
  { a: 'x > 3', na: 'x ≤ 3', b: 'x² > 9', nb: 'x² ≤ 9' },
  { a: 'the figure is a square', na: 'the figure is not a square', b: 'the figure is a rectangle', nb: 'the figure is not a rectangle' },
  { a: 'John studies', na: 'John does not study', b: 'John passes the exam', nb: 'John does not pass the exam' },
]

const lit = (name, neg) => (neg ? NOT(V(name)) : V(name))

// P(n) ⇔ Q(n) over a small domain (Exercise 41 style).
const IFF_BANK = [
  { P: '\\frac{n^3 + n}{2} \\text{ is even}', Q: '\\frac{n^2 + n}{2} \\text{ is odd}', p: n => ((n ** 3 + n) / 2) % 2 === 0, q: n => ((n * n + n) / 2) % 2 === 1 },
  { P: 'n \\text{ is even}', Q: 'n^2 + 1 \\text{ is odd}', p: n => n % 2 === 0, q: n => (n * n + 1) % 2 === 1 },
  { P: 'n \\text{ is prime}', Q: 'n \\text{ is odd}', p: n => isPrime(n), q: n => n % 2 === 1 },
  { P: 'n^2 > 8', Q: 'n \\ge 3', p: n => n * n > 8, q: n => n >= 3 },
  { P: 'n \\text{ is a multiple of } 3', Q: 'n^2 \\text{ is a multiple of } 9', p: n => n % 3 === 0, q: n => (n * n) % 9 === 0 },
  { P: 'n \\text{ is even}', Q: 'n \\text{ is a multiple of } 4', p: n => n % 2 === 0, q: n => n % 4 === 0 },
  { P: '2n + 1 \\text{ is prime}', Q: 'n \\text{ is even}', p: n => isPrime(2 * n + 1), q: n => n % 2 === 0 },
  { P: 'n^2 - n \\text{ is even}', Q: 'n < 10', p: n => (n * n - n) % 2 === 0, q: n => n < 10 },
]
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}
const plain = s => s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/$2').replace(/\\text\{|\}/g, '').replace(/\\ge/g, '≥').replace(/\^2/g, '²').replace(/\^3/g, '³')

function randIff(vars) {
  for (let tries = 0; tries < 60; tries++) {
    const f = randomFormula(Math.random, vars, ['iff', 'and', 'or', 'not'], 2)
    if (varsOf(f).length === vars.length && JSON.stringify(f).includes('"iff"') && f.t !== 'var') return f
  }
  return IFF(AND(V(vars[0]), V(vars[1])), V(vars[vars.length - 1]))
}

export default {
  id: 'biconditionals',
  name: 'Biconditionals & converse',
  description: '§2.6: converse, P ⇔ Q, "if and only if", necessary and sufficient. HW 36, 38f, 42.',
  learn: {
    formulas: [
      { label: 'Converse of P ⇒ Q', latex: 'Q \\Rightarrow P' },
      { label: 'Biconditional', latex: 'P \\Leftrightarrow Q \\;=\\; (P \\Rightarrow Q) \\wedge (Q \\Rightarrow P)' },
      { label: 'Truth table (true when the values match)', latex: '\\begin{array}{cc|c} P & Q & P \\Leftrightarrow Q \\\\ \\hline T & T & T \\\\ T & F & F \\\\ F & T & F \\\\ F & F & T \\end{array}' },
      { label: 'Same thing', latex: 'P \\text{ iff } Q; \\; P \\text{ is equivalent to } Q; \\; P \\text{ is necessary and sufficient for } Q' },
    ],
    how: [
      'The converse swaps hypothesis and conclusion. Its truth value is independent of the original: "if n is a multiple of 4 then n is even" is true, its converse is false.',
      'P ⇔ Q is true exactly when P and Q have the same truth value: both true or both false.',
      'Do ⇔ last, after ~, ∧, ∨, and ⇒.',
      '"Necessary and sufficient" and "if and only if" both mean ⇔.',
      'Over a domain: evaluate P(n) and Q(n) for each n and keep the n where they agree.',
    ],
  },
  templates: [
    {
      id: 'evaluate-iff',
      generate() {
        const vars = ['P', 'Q', 'R']
        const f = randIff(vars)
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
            latex: 'P \\Leftrightarrow Q \\text{ is true when } P, Q \\text{ have the same value}',
            text: 'Resolve each side of the ⇔ first, then compare: equal values give true, different values give false.',
          },
        }
      },
    },
    {
      id: 'truth-table',
      generate() {
        const vars = Math.random() < 0.55 ? ['P', 'Q'] : ['P', 'Q', 'R']
        const f = randIff(vars)
        const col = colString(column(f, vars))
        const flipped = col.replace(/[TF]/g, c => (c === 'T' ? 'F' : 'T'))
        const wrong = [flipped, colString(column(IMP(V(vars[0]), V(vars[1])), vars)), colString(column(AND(V(vars[0]), V(vars[1])), vars)), colString(column(OR(V(vars[0]), V(vars[1])), vars))]
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
            text: 'Do the ⇔ last: work out both sides in each row, then write T when they match and F when they differ.',
          },
        }
      },
    },
    {
      id: 'converse',
      generate() {
        if (Math.random() < 0.5) {
          const sP = Math.random() < 0.4
          const sQ = Math.random() < 0.4
          const f = IMP(lit('P', sP), lit('Q', sQ))
          const conv = IMP(lit('Q', sQ), lit('P', sP))
          const inverse = IMP(lit('P', !sP), lit('Q', !sQ))
          const contra = IMP(lit('Q', !sQ), lit('P', !sP))
          const other = IMP(lit('Q', !sQ), lit('P', sP))
          return withOptions(
            {
              ask: 'Which is the converse?',
              latex: toLatex(f),
              hint: {
                latex: `\\text{converse of } ${toLatex(f)} \\text{ is } ${toLatex(conv)}`,
                text: 'Swap the two sides of the arrow and change nothing else. Negating both sides gives the inverse; swapping and negating gives the contrapositive.',
              },
            },
            { latex: toLatex(conv) },
            [inverse, contra, other].map(x => ({ latex: toLatex(x) })),
          )
        }
        const c = choice(CLAUSES)
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
        const ok = `If ${c.b}, then ${c.a}.`
        const bad = [`If ${c.na}, then ${c.nb}.`, `If ${c.nb}, then ${c.na}.`, `${cap(c.a)} if and only if ${c.b}.`]
        return withOptions(
          {
            ask: 'Which is the converse?',
            text: `"If ${c.a}, then ${c.b}."`,
            latex: 'Q \\Rightarrow P',
            size: 'small',
            hint: {
              latex: '\\text{converse of } P \\Rightarrow Q \\text{ is } Q \\Rightarrow P',
              text: `Swap hypothesis and conclusion, nothing else: "${ok}"`,
            },
          },
          ok,
          bad,
        )
      },
    },
    {
      id: 'iff-domain',
      generate() {
        const item = choice(IFF_BANK)
        const S = choice([[1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5], [2, 3, 4, 5, 6]])
        const truth = n => item.p(n) === item.q(n)
        const phrase = choice([
          `A necessary and sufficient condition for ${plain(item.P)} is that ${plain(item.Q)}.`,
          `${plain(item.P)} if and only if ${plain(item.Q)}.`,
          `${plain(item.P)} is equivalent to ${plain(item.Q)}.`,
        ])
        if (Math.random() < 0.4) {
          const n = choice(S)
          const v = truth(n)
          return {
            ask: `Is the statement true for n = ${n}?`,
            text: `"${phrase}"`,
            latex: `P(${n}) \\Leftrightarrow Q(${n}), \\quad P(n): ${item.P}, \\; Q(n): ${item.Q}`,
            size: 'small',
            answer: tf(v),
            answerLatex: tfLatex(v),
            placeholder: 'true / false',
            hint: {
              latex: `P(${n}): \\text{${item.p(n) ? 'T' : 'F'}}, \\; Q(${n}): \\text{${item.q(n) ? 'T' : 'F'}}`,
              text: `Evaluate both sides at n = ${n}. A biconditional is true exactly when the two sides agree, so it is ${v ? 'true' : 'false'} here.`,
            },
          }
        }
        const hits = S.filter(truth)
        const wrong = [S.filter(item.p), S.filter(item.q), S.filter(n => !truth(n)), S]
        return {
          ask: `Find all n in S = ${setStr(S)} for which the statement is true.`,
          text: `"${phrase}"`,
          latex: `P(n) \\Leftrightarrow Q(n), \\quad P(n): ${item.P}, \\; Q(n): ${item.Q}`,
          size: 'small',
          answer: setStr(hits),
          answerLatex: setLatex(hits),
          accept: acceptSet(hits),
          placeholder: 'e.g. {1, 3} or ∅',
          choices: wrong.map(setStr).filter(s => s !== setStr(hits)),
          hint: {
            latex: 'P(n) \\Leftrightarrow Q(n) \\text{ true} \\iff P(n), Q(n) \\text{ agree}',
            text: `Make a row for each n: P(n) true/false, Q(n) true/false. Keep the n where they match: ${hits.length ? hits.join(', ') : 'none'}.`,
          },
        }
      },
    },
  ],
}
