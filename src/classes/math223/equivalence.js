import { choice, shuffle } from '../../engine/rand.js'
import {
  V, NOT, AND, OR, IMP, IFF, parse, tryParse, toLatex, toText, equivalent, negate, negationsAtomic, column, colString, randomFormula, varsOf,
} from '../../engine/logic.js'
import { yn, ynLatex, withOptions } from './util.js'

const PAIRS = [
  ['P => Q', '~P v Q'], ['P => Q', 'Q => P'], ['P => Q', '~Q => ~P'], ['~(P ^ Q)', '~P ^ ~Q'], ['~(P ^ Q)', '~P v ~Q'],
  ['~(P v Q)', '~P ^ ~Q'], ['~(P v Q)', '~P v ~Q'], ['~(P => Q)', 'P ^ ~Q'], ['~(P => Q)', '~P => ~Q'],
  ['P v (Q ^ R)', '(P v Q) ^ (P v R)'], ['P ^ (Q v R)', '(P ^ Q) v R'], ['P ^ (Q v R)', '(P ^ Q) v (P ^ R)'],
  ['P <=> Q', '(P ^ Q) v (~P ^ ~Q)'], ['~(P <=> Q)', 'P <=> ~Q'], ['P => Q', '~P => ~Q'], ['P => (Q => R)', '(P ^ Q) => R'],
  ['P => (Q => R)', '(P => Q) => R'], ['P v (P ^ Q)', 'P'], ['P ^ (P v Q)', 'P'], ['~~P', 'P'], ['P => Q', 'Q v ~P'],
  ['(P v Q) ^ ~P', 'Q ^ ~P'], ['P <=> Q', 'Q <=> P'], ['P => Q', 'P ^ Q'], ['~(P => Q)', 'P ^ Q'], ['P v Q', '~P => Q'],
  ['P ^ Q', '~(P => ~Q)'], ['P => Q', '(P ^ Q) <=> P'],
]

// Named laws as (left, right) builders over literals X, Y, Z.
const LAWS = [
  { name: 'commutative', mk: (X, Y) => [OR(X, Y), OR(Y, X)] },
  { name: 'commutative', mk: (X, Y) => [AND(X, Y), AND(Y, X)] },
  { name: 'associative', mk: (X, Y, Z) => [OR(X, OR(Y, Z)), OR(OR(X, Y), Z)] },
  { name: 'associative', mk: (X, Y, Z) => [AND(X, AND(Y, Z)), AND(AND(X, Y), Z)] },
  { name: 'distributive', mk: (X, Y, Z) => [OR(X, AND(Y, Z)), AND(OR(X, Y), OR(X, Z))] },
  { name: 'distributive', mk: (X, Y, Z) => [AND(X, OR(Y, Z)), OR(AND(X, Y), AND(X, Z))] },
  { name: 'De Morgan', mk: (X, Y) => [NOT(OR(X, Y)), AND(NOT(X), NOT(Y))] },
  { name: 'De Morgan', mk: (X, Y) => [NOT(AND(X, Y)), OR(NOT(X), NOT(Y))] },
  { name: 'double negative', mk: X => [NOT(NOT(X)), X] },
]
const LAW_NAMES = ['commutative', 'associative', 'distributive', 'De Morgan', 'double negative']
const LAW_KEY = { commutative: /^commut/, associative: /^assoc/, distributive: /^distrib/, 'De Morgan': /^demorgan/, 'double negative': /^doubleneg/ }
const normLaw = s => String(s).toLowerCase().replace(/[^a-z]/g, '')

const TO_NEGATE = [
  'P => Q', 'P v Q', 'P ^ Q', '~P v Q', 'P => ~Q', '(P ^ Q) => R', 'P v ~Q', '~P ^ Q', 'P => (Q v R)', '(P v Q) => R',
  '~P => Q', 'P ^ (Q v R)', 'P v (Q ^ R)', '(P v Q) ^ R', '~P ^ ~Q', 'P => (Q ^ R)', '(P => Q) ^ R',
]

const ENGLISH = [
  { s: 'Either x = 0 or y = 0.', ok: 'x ≠ 0 and y ≠ 0.', bad: ['x ≠ 0 or y ≠ 0.', 'x = 0 and y = 0.', 'Either x ≠ 0 or y = 0.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q' },
  { s: 'The integers a and b are both even.', ok: 'a is odd or b is odd.', bad: ['a and b are both odd.', 'a is odd and b is odd.', 'a is even or b is even.'], law: 'De Morgan: ~(P ∧ Q) ≡ ~P ∨ ~Q' },
  { s: 'If John studies, then he will pass the exam.', ok: 'John studies and he does not pass the exam.', bad: ['If John studies, then he will not pass the exam.', 'If John does not study, then he will not pass the exam.', 'John does not study and he passes the exam.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
  { s: 'If x, y > 0, then x² > 0 and y² > 0.', ok: 'x, y > 0, and x² ≤ 0 or y² ≤ 0.', bad: ['If x, y > 0, then x² ≤ 0 and y² ≤ 0.', 'x, y > 0, and x² ≤ 0 and y² ≤ 0.', 'If x, y ≤ 0, then x² ≤ 0 or y² ≤ 0.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q, then De Morgan on the conjunction' },
  { s: 'The number 7 is prime and 9 is odd.', ok: '7 is not prime or 9 is even.', bad: ['7 is not prime and 9 is even.', '7 is prime or 9 is odd.', '7 is not prime and 9 is odd.'], law: 'De Morgan: ~(P ∧ Q) ≡ ~P ∨ ~Q' },
  { s: 'It is raining or it is cold.', ok: 'It is not raining and it is not cold.', bad: ['It is not raining or it is not cold.', 'It is raining and it is cold.', 'It is not raining and it is cold.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q' },
  { s: 'If n is even, then n² is even.', ok: 'n is even and n² is odd.', bad: ['If n is even, then n² is odd.', 'If n is odd, then n² is odd.', 'n is odd and n² is even.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
  { s: 'x ≥ 2 or x ≤ −2.', ok: '−2 < x < 2.', bad: ['x < 2 or x > −2.', 'x ≤ 2 and x ≥ −2.', 'x > 2 and x < −2.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q, so x < 2 and x > −2' },
  { s: 'The function f is continuous and f is not differentiable.', ok: 'f is not continuous or f is differentiable.', bad: ['f is not continuous and f is differentiable.', 'f is continuous and f is differentiable.', 'f is not continuous or f is not differentiable.'], law: 'De Morgan: ~(P ∧ ~Q) ≡ ~P ∨ Q' },
  { s: 'If Ann is late, then she misses the bus.', ok: 'Ann is late and she does not miss the bus.', bad: ['If Ann is late, then she does not miss the bus.', 'If Ann is not late, then she does not miss the bus.', 'Ann is not late and she misses the bus.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
]

const lit = (name, neg) => (neg ? NOT(V(name)) : V(name))

export default {
  id: 'equivalence',
  name: 'Logical equivalence',
  description: '§2.8–2.9: R ≡ S, the named laws, negating implications and compound statements. HW 56, 60b, 62.',
  learn: {
    formulas: [
      { label: 'Logically equivalent: same column', latex: 'R \\equiv S' },
      { label: 'Implication as a disjunction (Thm 2.21)', latex: 'P \\Rightarrow Q \\equiv \\sim P \\vee Q' },
      { label: 'Negating an implication (Thm 2.25a)', latex: '\\sim(P \\Rightarrow Q) \\equiv P \\wedge \\sim Q' },
      { label: 'Commutative', latex: 'P \\vee Q \\equiv Q \\vee P, \\quad P \\wedge Q \\equiv Q \\wedge P' },
      { label: 'Associative', latex: 'P \\vee (Q \\vee R) \\equiv (P \\vee Q) \\vee R' },
      { label: 'Distributive', latex: 'P \\wedge (Q \\vee R) \\equiv (P \\wedge Q) \\vee (P \\wedge R)' },
      { label: "De Morgan's", latex: '\\sim(P \\vee Q) \\equiv \\sim P \\wedge \\sim Q, \\quad \\sim(P \\wedge Q) \\equiv \\sim P \\vee \\sim Q' },
      { label: 'Double negative', latex: '\\sim(\\sim P) \\equiv P' },
    ],
    how: [
      'Equivalent means identical truth-table columns. To check, build both columns (same row order) and compare.',
      'Fast disproof: find one row where they differ. P ⇒ Q and Q ⇒ P differ in the T, F row.',
      'Negating an implication is NOT another implication: ~(P ⇒ Q) is P ∧ ~Q (the hypothesis happens and the conclusion fails).',
      "De Morgan flips the connective and negates the pieces: 'not (A or B)' is 'not A and not B'.",
      'Simplified negation: every ~ must sit directly on a letter. Push it inward with De Morgan and Theorem 2.25, and cancel double negatives.',
      'Know the law names: commutative (swap), associative (regroup), distributive (spread one operation over the other), De Morgan, double negative.',
    ],
  },
  templates: [
    {
      id: 'equivalent-check',
      generate() {
        const [l, r] = choice(PAIRS)
        const L = parse(l)
        const R = parse(r)
        const yes = equivalent(L, R)
        const vars = [...new Set([...varsOf(L), ...varsOf(R)])].sort()
        return {
          ask: 'Logically equivalent?',
          latex: `${toLatex(L)} \\;\\overset{?}{\\equiv}\\; ${toLatex(R)}`,
          size: 'small',
          answer: yn(yes),
          answerLatex: ynLatex(yes),
          placeholder: 'yes / no',
          hint: {
            latex: `\\text{columns: } ${colString(column(L, vars))} \\text{ vs } ${colString(column(R, vars))}`,
            text: yes
              ? 'Yes: both truth tables give the same column in every row.'
              : 'No: the columns differ in at least one row, so the statements are not equivalent.',
          },
        }
      },
    },
    {
      id: 'name-law',
      generate() {
        const law = choice(LAWS)
        const names = shuffle(['P', 'Q', 'R'])
        const lits = names.map(n => lit(n, Math.random() < 0.25))
        const [L, R] = law.mk(...lits)
        const flip = Math.random() < 0.5
        return {
          ask: 'Name the law.',
          latex: `${toLatex(flip ? R : L)} \\equiv ${toLatex(flip ? L : R)}`,
          size: 'small',
          answer: law.name,
          answerLatex: `\\text{${law.name} law}`,
          accept: raw => LAW_KEY[law.name].test(normLaw(raw)),
          placeholder: 'commutative / associative / distributive / De Morgan / double negative',
          choices: LAW_NAMES.filter(n => n !== law.name),
          hint: {
            latex: `${toLatex(L)} \\equiv ${toLatex(R)}`,
            text: {
              commutative: 'Commutative: the two operands swap places, nothing else changes.',
              associative: 'Associative: same operation throughout, only the grouping (parentheses) moves.',
              distributive: 'Distributive: one operation is spread over the other, like a(b + c) = ab + ac.',
              'De Morgan': 'De Morgan: a negation of ∧ or ∨ becomes the other connective with each piece negated.',
              'double negative': 'Double negative: two negations cancel.',
            }[law.name],
          },
        }
      },
    },
    {
      id: 'negate-symbolic',
      generate() {
        const f = parse(choice(TO_NEGATE))
        const ans = negate(f)
        const target = NOT(f)
        const vars = varsOf(f)
        const cands = []
        if (f.t !== 'not') {
          cands.push({ t: f.t, a: negate(f.a), b: negate(f.b) })
          cands.push({ t: f.t === 'and' ? 'or' : f.t === 'or' ? 'and' : 'imp', a: negate(f.a), b: negate(f.b) })
          if (f.t === 'imp') {
            cands.push(IMP(negate(f.a), negate(f.b)), AND(negate(f.a), f.b), IMP(f.a, negate(f.b)), OR(f.a, negate(f.b)))
          } else {
            cands.push(OR(negate(f.a), negate(f.b)), AND(negate(f.a), negate(f.b)), { t: f.t, a: negate(f.a), b: f.b })
          }
        }
        for (let i = 0; i < 20 && cands.length < 12; i++) cands.push(randomFormula(Math.random, vars, ['and', 'or', 'imp'], 2))
        const seen = new Set([toText(ans)])
        const wrong = cands.filter(c => !equivalent(c, target) && negationsAtomic(c) && !seen.has(toText(c)) && seen.add(toText(c))).map(toText)
        return {
          ask: 'Write the negation with every ~ directly on a letter.',
          latex: `\\sim(${toLatex(f)}) \\;\\equiv\\; ?`,
          size: 'small',
          answer: toText(ans),
          answerLatex: toLatex(ans),
          accept: raw => {
            const p = tryParse(raw)
            return !!p && equivalent(p, target) && negationsAtomic(p)
          },
          placeholder: 'e.g. P ^ ~Q  (use ~ ^ v => <=>)',
          choices: shuffle(wrong).slice(0, 3),
          hint: {
            latex: '\\sim(P \\Rightarrow Q) \\equiv P \\wedge \\sim Q, \\quad \\sim(P \\vee Q) \\equiv \\sim P \\wedge \\sim Q, \\quad \\sim(P \\wedge Q) \\equiv \\sim P \\vee \\sim Q',
            text: `Push the negation inward one connective at a time and cancel double negatives: ${toText(ans)}. Any statement with the same truth table and no ~ on a compound is accepted.`,
          },
        }
      },
    },
    {
      id: 'negate-english',
      generate() {
        const item = choice(ENGLISH)
        return withOptions(
          {
            ask: 'Choose the (simplified) negation.',
            text: `"${item.s}"`,
            latex: '\\sim(P \\Rightarrow Q) \\equiv P \\wedge \\sim Q, \\qquad \\sim(P \\vee Q) \\equiv \\sim P \\wedge \\sim Q',
            size: 'small',
            hint: {
              latex: '\\sim(P \\wedge Q) \\equiv \\sim P \\vee \\sim Q',
              text: `Negation: "${item.ok}" (${item.law}).`,
            },
          },
          item.ok,
          item.bad,
        )
      },
    },
  ],
}
