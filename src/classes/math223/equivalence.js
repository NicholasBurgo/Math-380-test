import { choice, shuffle } from '../../engine/rand.js'
import {
  V, NOT, AND, OR, IMP, IFF, parse, tryParse, toLatex, toText, equivalent, negate, negationsAtomic, column, colString, randomFormula, varsOf, substitute,
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
  ['~(P ^ ~Q)', '~P v Q'], ['~(~P v Q)', 'P ^ ~Q'], ['P => ~Q', 'Q => ~P'], ['~P => Q', '~Q => P'], ['P => Q', '~(P ^ ~Q)'],
  ['P <=> Q', '(P => Q) ^ (Q => P)'], ['P <=> Q', '~P <=> ~Q'], ['P <=> Q', '(P v Q) => (P ^ Q)'], ['P v Q', '~P ^ ~Q'],
  ['(P => Q) ^ (Q => R)', 'P => R'], ['(P ^ Q) => R', '(P => R) ^ (Q => R)'], ['(P v Q) => R', '(P => R) ^ (Q => R)'],
  ['P => (Q v R)', '(P ^ ~Q) => R'], ['P => (Q ^ R)', '(P => Q) ^ (P => R)'], ['P v ~Q', 'Q => P'], ['P => Q', '~Q v P'],
  ['~(P ^ Q)', '~P ^ Q'], ['(P ^ Q) => R', 'P => (Q v R)'], ['~P => ~Q', 'Q => P'], ['~(P v ~Q)', '~P ^ Q'],
]

// The same pattern on fresh letters, so a pair is recognised by its shape
// and not by memory.
function relabel(asts) {
  const used = [...new Set(asts.flatMap(a => varsOf(a)))].sort()
  const names = shuffle(['P', 'Q', 'R'])
  const map = {}
  used.forEach((v, i) => (map[v] = V(names[i])))
  return asts.map(a => substitute(a, map))
}

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
  '~P => ~Q', 'P => (Q => R)', '(P ^ ~Q) => R', '~(P ^ Q)', '~(P v ~Q)', '(P v Q) => (P ^ Q)', '~P v ~Q', 'P ^ ~Q',
  '(P => Q) v R', '(P ^ Q) v ~R', '~P => (Q v R)', '(P => Q) ^ (Q => R)',
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
  { s: 'x > 0 and y < 0.', ok: 'x ≤ 0 or y ≥ 0.', bad: ['x ≤ 0 and y ≥ 0.', 'x < 0 or y > 0.', 'x < 0 and y > 0.'], law: 'De Morgan: ~(P ∧ Q) ≡ ~P ∨ ~Q, and the negation of > 0 is ≤ 0 (keep the boundary)' },
  { s: 'The integer n is even or n is a multiple of 3.', ok: 'n is odd and n is not a multiple of 3.', bad: ['n is odd or n is not a multiple of 3.', 'n is even and n is a multiple of 3.', 'n is odd and n is a multiple of 3.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q' },
  { s: 'If it snows, then school is closed.', ok: 'It snows and school is not closed.', bad: ['If it snows, then school is not closed.', 'If it does not snow, then school is not closed.', 'It does not snow and school is closed.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
  { s: 'If x² = 9, then x = 3.', ok: 'x² = 9 and x ≠ 3.', bad: ['If x² = 9, then x ≠ 3.', 'If x² ≠ 9, then x ≠ 3.', 'x² ≠ 9 and x = 3.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
  { s: 'Sam plays guitar and Sam sings.', ok: 'Sam does not play guitar or Sam does not sing.', bad: ['Sam does not play guitar and Sam does not sing.', 'Sam plays guitar or Sam sings.', 'Sam does not play guitar and Sam sings.'], law: 'De Morgan: ~(P ∧ Q) ≡ ~P ∨ ~Q' },
  { s: 'I will take calculus or I will take statistics.', ok: 'I will not take calculus and I will not take statistics.', bad: ['I will not take calculus or I will not take statistics.', 'I will take calculus and I will take statistics.', 'I will take calculus and I will not take statistics.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q' },
  { s: '0 < x < 1.', ok: 'x ≤ 0 or x ≥ 1.', bad: ['x ≤ 0 and x ≥ 1.', 'x < 0 or x > 1.', '0 > x > 1.'], law: '0 < x < 1 means (x > 0) ∧ (x < 1); De Morgan gives (x ≤ 0) ∨ (x ≥ 1)' },
  { s: 'If a and b are odd, then a + b is even.', ok: 'a and b are odd, and a + b is odd.', bad: ['If a and b are odd, then a + b is odd.', 'If a and b are even, then a + b is odd.', 'a and b are even, and a + b is odd.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q: keep the hypothesis, negate only the conclusion' },
  { s: 'The set A is empty or the set B is empty.', ok: 'A is nonempty and B is nonempty.', bad: ['A is nonempty or B is nonempty.', 'A is empty and B is empty.', 'A is empty and B is nonempty.'], law: 'De Morgan: ~(P ∨ Q) ≡ ~P ∧ ~Q' },
  { s: 'If the triangle is equilateral, then it is isosceles.', ok: 'The triangle is equilateral and it is not isosceles.', bad: ['If the triangle is equilateral, then it is not isosceles.', 'If the triangle is not equilateral, then it is not isosceles.', 'The triangle is not equilateral and it is isosceles.'], law: '~(P ⇒ Q) ≡ P ∧ ~Q' },
  { s: 'The number x is rational and x² is irrational.', ok: 'x is irrational or x² is rational.', bad: ['x is irrational and x² is rational.', 'x is rational or x² is irrational.', 'x is irrational or x² is irrational.'], law: 'De Morgan: ~(P ∧ Q) ≡ ~P ∨ ~Q' },
  { s: 'If n is prime, then n is odd or n = 2.', ok: 'n is prime, n is even, and n ≠ 2.', bad: ['If n is prime, then n is even and n ≠ 2.', 'n is not prime, and n is odd or n = 2.', 'n is prime, and n is even or n ≠ 2.'], law: '~(P ⇒ (Q ∨ R)) ≡ P ∧ ~Q ∧ ~R: negate the implication, then De Morgan on the conclusion' },
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
        let [L, R] = relabel([parse(l), parse(r)])
        if (Math.random() < 0.5) [L, R] = [R, L]
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
        const [f] = relabel([parse(choice(TO_NEGATE))])
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
        if (f.t === 'not') {
          // ~(~(A ∘ B)) is just A ∘ B: the tempting mistakes apply De Morgan anyway
          const g = f.a
          cands.push(negate(g), { t: g.t === 'and' ? 'or' : 'and', a: g.a, b: g.b }, { t: g.t, a: negate(g.a), b: negate(g.b) })
        }
        // the common mistakes first; random formulas only fill the gaps
        const seen = new Set([toText(ans)])
        const usable = c => !equivalent(c, target) && negationsAtomic(c) && !seen.has(toText(c)) && seen.add(toText(c))
        const mistakes = shuffle(cands.filter(usable))
        const filler = []
        for (let i = 0; i < 20; i++) filler.push(randomFormula(Math.random, vars, ['and', 'or', 'imp'], 2))
        const wrong = [...mistakes, ...filler.filter(usable)].map(toText)
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
          choices: wrong.slice(0, 3),
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
