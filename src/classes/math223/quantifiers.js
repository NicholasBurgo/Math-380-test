import { randInt, choice, shuffle } from '../../engine/rand.js'
import { parseAnswer } from '../../engine/check.js'
import { setStr, setLatex, randSubset, tf, tfLatex, isPrime, withOptions } from './util.js'

// Predicates over integers for finite-domain drills.
const PREDS = [
  { latex: 'x^2 > x', test: x => x * x > x, say: 'x² > x' },
  { latex: 'x^2 - 4 \\ne 0', test: x => x * x - 4 !== 0, say: 'x² − 4 ≠ 0' },
  { latex: 'x + 1 \\text{ is prime}', test: x => isPrime(x + 1), say: 'x + 1 is prime' },
  { latex: 'x \\text{ is even}', test: x => x % 2 === 0, say: 'x is even' },
  { latex: '|x| = x', test: x => Math.abs(x) === x, say: '|x| = x' },
  { latex: 'x^3 \\ge x', test: x => x ** 3 >= x, say: 'x³ ≥ x' },
  { latex: 'x^2 - 5x + 6 = 0', test: x => x * x - 5 * x + 6 === 0, say: 'x² − 5x + 6 = 0' },
  { latex: 'x^2 \\le 10', test: x => x * x <= 10, say: 'x² ≤ 10' },
  { latex: '2^x > x^2', test: x => 2 ** x > x * x, say: '2ˣ > x²' },
  { latex: 'x^2 + 2x + 3 = 0', test: () => false, say: 'x² + 2x + 3 = 0' },
  { latex: 'x^2 + 1 > 0', test: () => true, say: 'x² + 1 > 0' },
]

// Statements over infinite domains with a known verdict (notes + book).
export const INFINITE = [
  { latex: '\\forall x \\in \\mathbb{R},\\ x^4 \\ge x', ok: false, why: 'x = 1/2 gives 1/16 ≥ 1/2, which is false' },
  { latex: '\\forall A \\in \\mathcal{P}(\\{a, b\\}),\\ |A \\cup \\{c\\}| \\ge 1', ok: true, why: 'A ∪ {c} always contains c, so it has at least one element' },
  { latex: '\\forall x \\in \\mathbb{R},\\ -x^2 + 5x - 2 < 5', ok: true, why: 'the parabola peaks at x = 5/2 with value 4.25 < 5' },
  { latex: '\\exists q \\in \\mathbb{Q} \\text{ such that } \\sqrt{q} \\in \\mathbb{Z}', ok: true, why: 'q = 4 works: √4 = 2' },
  { latex: '\\exists n \\in \\{0, 2, 3\\} \\text{ such that } n^2 + 2n + 3 = 0', ok: false, why: 'the three values give 3, 11, 18: never 0' },
  { latex: '\\exists A \\in \\mathcal{P}(\\{1, 2, 3, 4\\}) \\text{ such that } A \\cup \\{2, 3\\} \\ne A', ok: true, why: 'A = ∅ works: ∅ ∪ {2,3} = {2,3} ≠ ∅' },
  { latex: '\\exists \\text{ sets } A, B \\text{ such that } |A \\times B| = 5', ok: true, why: '|A| = 1 and |B| = 5 gives 1 · 5 = 5' },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 \\ge 0', ok: true, why: 'squares of reals are never negative' },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 > 0', ok: false, why: 'x = 0 is a counterexample' },
  { latex: '\\exists x \\in \\mathbb{Z} \\text{ such that } x^2 = 2', ok: false, why: '√2 is not an integer' },
  { latex: '\\forall x \\in \\mathbb{Z},\\ x^2 \\ge x', ok: true, why: 'for integers x ≤ 0 or x ≥ 1 the inequality holds' },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 \\ge x', ok: false, why: 'x = 1/2 gives 1/4 ≥ 1/2, which is false' },
  { latex: '\\exists x \\in \\mathbb{R} \\text{ such that } x^2 + 1 = 0', ok: false, why: 'x² + 1 ≥ 1 for every real x' },
  { latex: '\\forall n \\in \\mathbb{N},\\ n + 1 > n', ok: true, why: 'adding 1 always increases' },
  { latex: '\\exists n \\in \\mathbb{N} \\text{ such that } n^2 = n', ok: true, why: 'n = 1 works' },
  { latex: '\\forall x \\in \\mathbb{R},\\ |x| = x', ok: false, why: 'x = −1 gives |−1| = 1 ≠ −1' },
  { latex: '\\exists x \\in \\mathbb{R} \\text{ such that } |x| = -x', ok: true, why: 'any x ≤ 0 works, e.g. x = 0' },
  { latex: '\\forall n \\in \\mathbb{N},\\ n^2 + n + 41 \\text{ is prime}', ok: false, why: 'n = 40 gives 41², not prime' },
  { latex: '\\exists x \\in \\mathbb{Q} \\text{ such that } x^2 = 2', ok: false, why: '√2 is irrational' },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 + x + 1 > 0', ok: true, why: 'completing the square gives (x + 1/2)² + 3/4, which is at least 3/4' },
  { latex: '\\exists x \\in \\mathbb{R} \\text{ such that } x^2 < x', ok: true, why: 'x = 1/2 works: 1/4 < 1/2' },
  { latex: '\\exists n \\in \\mathbb{N} \\text{ such that } n^2 < n', ok: false, why: 'for n ≥ 1, n² = n · n ≥ n; the fractions that work over ℝ are not in ℕ' },
  { latex: '\\forall n \\in \\mathbb{N},\\ n^2 \\ge n', ok: true, why: 'n ≥ 1, so multiplying both sides by n gives n² ≥ n' },
  { latex: '\\exists x \\in \\mathbb{Z} \\text{ such that } 2x = 7', ok: false, why: 'x would have to be 7/2, which is not an integer' },
  { latex: '\\exists x \\in \\mathbb{Q} \\text{ such that } 2x = 7', ok: true, why: 'x = 7/2 is rational' },
  { latex: '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = x', ok: false, why: 'x = −1 gives √1 = 1 ≠ −1' },
  { latex: '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = |x|', ok: true, why: 'the square root is never negative, and it undoes the square up to sign' },
  { latex: '\\exists n \\in \\mathbb{N} \\text{ such that } n + 5 = 2', ok: false, why: 'the only solution is n = −3, which is not a natural number' },
  { latex: '\\exists n \\in \\mathbb{Z} \\text{ such that } n + 5 = 2', ok: true, why: 'n = −3 is an integer' },
  { latex: '\\forall n \\in \\mathbb{Z},\\ n^2 + n \\text{ is even}', ok: true, why: 'n² + n = n(n + 1), a product of consecutive integers, so one factor is even' },
  { latex: '\\forall n \\in \\mathbb{Z},\\ n^2 \\text{ is even}', ok: false, why: 'n = 1 gives 1, which is odd' },
  { latex: '\\forall x \\in \\mathbb{R},\\ 2x > x', ok: false, why: 'x = 0 gives 0 > 0, and any negative x fails too' },
  { latex: '\\forall n \\in \\mathbb{N},\\ 2n > n', ok: true, why: 'n ≥ 1 is positive, so adding n makes it bigger' },
  { latex: '\\exists x \\in \\mathbb{R} \\text{ such that } x^3 = -8', ok: true, why: 'x = −2 works' },
  { latex: '\\exists x \\in \\mathbb{N} \\text{ such that } x^3 = -8', ok: false, why: 'the only real solution is x = −2, which is not in ℕ' },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^3 \\ge x^2', ok: false, why: 'x = 1/2 gives 1/8 ≥ 1/4, which is false (so does any negative x)' },
  { latex: '\\exists n \\in \\mathbb{N} \\text{ such that } n \\text{ is even and prime}', ok: true, why: 'n = 2 works' },
  { latex: '\\forall A \\in \\mathcal{P}(\\{1, 2, 3\\}),\\ |A| \\le 3', ok: true, why: 'a subset of a 3-element set has at most 3 elements' },
  { latex: '\\exists A \\in \\mathcal{P}(\\{1, 2\\}) \\text{ such that } |A| = 3', ok: false, why: 'every subset of {1, 2} has at most 2 elements' },
  { latex: '\\forall A \\in \\mathcal{P}(\\{1, 2\\}),\\ \\varnothing \\subseteq A', ok: true, why: 'the empty set is a subset of every set' },
  { latex: '\\forall A \\in \\mathcal{P}(\\{1, 2\\}),\\ \\varnothing \\in A', ok: false, why: 'the elements of A are numbers; e.g. A = {1} does not contain ∅ as an element' },
]

// Universal statements that are false, for counterexample hunting. `dom`
// says which typed numbers are in the domain; `bad` says which ones break Q.
const COUNTER = [
  { latex: '\\forall x \\in \\mathbb{R},\\ x^4 \\ge x', dom: () => true, bad: x => x ** 4 < x, ex: 0.5, exLatex: 'x = \\tfrac{1}{2} \\ (\\text{any } 0 < x < 1)', exPlain: 'x = 1/2 (any 0 < x < 1)', safe: [0, 1, 2, -1] },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 \\ge x', dom: () => true, bad: x => x * x < x, ex: 0.5, exLatex: 'x = \\tfrac{1}{2} \\ (\\text{any } 0 < x < 1)', exPlain: 'x = 1/2 (any 0 < x < 1)', safe: [0, 1, 2, -1] },
  { latex: '\\forall x \\in \\mathbb{R},\\ |x| = x', dom: () => true, bad: x => Math.abs(x) !== x, ex: -1, exLatex: 'x = -1 \\ (\\text{any } x < 0)', exPlain: 'x = -1 (any x < 0)', safe: [0, 1, 2, 5] },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^2 > 0', dom: () => true, bad: x => !(x * x > 0), ex: 0, exLatex: 'x = 0', exPlain: 'x = 0', safe: [1, -1, 2, 3] },
  { latex: '\\forall x \\in \\mathbb{R},\\ \\text{if } x^2 = 4 \\text{ then } x = 2', dom: () => true, bad: x => x * x === 4 && x !== 2, ex: -2, exLatex: 'x = -2', exPlain: 'x = -2', safe: [2, 0, 1, 3] },
  { latex: '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is prime, then } n \\text{ is odd}', dom: n => Number.isInteger(n) && n >= 1, bad: n => isPrime(n) && n % 2 === 0, ex: 2, exLatex: 'n = 2', exPlain: 'n = 2', safe: [3, 5, 4, 9] },
  { latex: '\\forall n \\in \\mathbb{N},\\ n^2 + n + 41 \\text{ is prime}', dom: n => Number.isInteger(n) && n >= 1, bad: n => !isPrime(n * n + n + 41), ex: 40, exLatex: 'n = 40 \\ (\\text{or } 41, 44, \\ldots)', exPlain: 'n = 40 (or 41, 44, ...)', safe: [1, 2, 3, 10] },
  { latex: '\\forall n \\in \\mathbb{N},\\ 2^n + 1 \\text{ is prime}', dom: n => Number.isInteger(n) && n >= 1, bad: n => !isPrime(2 ** n + 1), ex: 3, exLatex: 'n = 3 \\ (2^3 + 1 = 9)', exPlain: 'n = 3 (2^3 + 1 = 9)', safe: [1, 2, 4] },
  { latex: '\\forall x \\in \\mathbb{R},\\ -x^2 + 5x - 2 < 4', dom: () => true, bad: x => -x * x + 5 * x - 2 >= 4, ex: 2.5, exLatex: 'x = 2.5 \\ (\\text{any } 2 \\le x \\le 3)', exPlain: 'x = 2.5 (any 2 ≤ x ≤ 3)', safe: [0, 1, 4, 5] },
  { latex: '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is even, then } n \\text{ is a multiple of } 4', dom: n => Number.isInteger(n) && n >= 1, bad: n => n % 2 === 0 && n % 4 !== 0, ex: 6, exLatex: 'n = 6 \\ (\\text{or } 2, 10, \\ldots)', exPlain: 'n = 6 (or 2, 10, ...)', safe: [4, 8, 3, 5] },
  { latex: '\\forall x \\in \\mathbb{Z},\\ x^3 \\ge x', dom: x => Number.isInteger(x), bad: x => x ** 3 < x, ex: -2, exLatex: 'x = -2 \\ (\\text{any integer } x \\le -2)', exPlain: 'x = -2 (any integer x ≤ -2)', safe: [0, 1, 2, -1] },
  { latex: '\\forall x \\in \\mathbb{R},\\ 2x > x', dom: () => true, bad: x => !(2 * x > x), ex: -1, exLatex: 'x = -1 \\ (\\text{any } x \\le 0)', exPlain: 'x = -1 (any x ≤ 0)', safe: [1, 2, 3, 5] },
  { latex: '\\forall x \\in \\mathbb{R},\\ \\sqrt{x^2} = x', dom: () => true, bad: x => x < 0, ex: -3, exLatex: 'x = -3 \\ (\\text{any } x < 0)', exPlain: 'x = -3 (any x < 0)', safe: [0, 1, 2, 4] },
  { latex: '\\forall n \\in \\mathbb{Z},\\ n^2 > n', dom: n => Number.isInteger(n), bad: n => !(n * n > n), ex: 0, exLatex: 'n = 0 \\ (\\text{or } n = 1)', exPlain: 'n = 0 (or n = 1)', safe: [2, 3, -1, -2] },
  { latex: '\\forall x \\in \\mathbb{R},\\ x^3 \\ge x^2', dom: () => true, bad: x => x ** 3 < x * x, ex: -1, exLatex: 'x = -1 \\ (\\text{any } x < 1 \\text{ other than } 0)', exPlain: 'x = -1 (any x < 1 other than 0)', safe: [0, 1, 2, 3] },
  { latex: '\\forall x \\in \\mathbb{R},\\ \\text{if } x > 0 \\text{ then } x^2 \\ge x', dom: () => true, bad: x => x > 0 && x * x < x, ex: 0.5, exLatex: 'x = \\tfrac{1}{2} \\ (\\text{any } 0 < x < 1)', exPlain: 'x = 1/2 (any 0 < x < 1)', safe: [1, 2, -1, 0] },
  { latex: '\\forall n \\in \\mathbb{N},\\ \\text{if } n \\text{ is odd, then } n \\text{ is prime}', dom: n => Number.isInteger(n) && n >= 1, bad: n => n % 2 === 1 && !isPrime(n), ex: 9, exLatex: 'n = 9 \\ (\\text{or } 1, 15, \\ldots)', exPlain: 'n = 9 (or 1, 15, ...)', safe: [3, 5, 7, 4] },
  { latex: '\\forall n \\in \\mathbb{N},\\ n^2 - n + 11 \\text{ is prime}', dom: n => Number.isInteger(n) && n >= 1, bad: n => !isPrime(n * n - n + 11), ex: 11, exLatex: 'n = 11 \\ (11^2 - 11 + 11 = 121 = 11^2)', exPlain: 'n = 11 (121 = 11²)', safe: [1, 2, 3, 5] },
  { latex: '\\forall x \\in \\mathbb{R},\\ x + 1 > x^2', dom: () => true, bad: x => !(x + 1 > x * x), ex: 2, exLatex: 'x = 2 \\ (\\text{any } x \\ge 2 \\text{ or } x \\le -1)', exPlain: 'x = 2 (any x ≥ 2 or x ≤ -1)', safe: [0, 1, 0.5, -0.5] },
  { latex: '\\forall n \\in \\mathbb{N},\\ 3n + 1 \\text{ is even}', dom: n => Number.isInteger(n) && n >= 1, bad: n => (3 * n + 1) % 2 !== 0, ex: 2, exLatex: 'n = 2 \\ (\\text{any even } n)', exPlain: 'n = 2 (any even n)', safe: [1, 3, 5, 7] },
  { latex: '\\forall n \\in \\mathbb{Z},\\ \\text{if } n^2 \\text{ is a multiple of } 4 \\text{, then } n \\text{ is a multiple of } 4', dom: n => Number.isInteger(n), bad: n => (n * n) % 4 === 0 && n % 4 !== 0, ex: 2, exLatex: 'n = 2 \\ (\\text{or } 6, -2, \\ldots)', exPlain: 'n = 2 (or 6, -2, ...)', safe: [4, 8, 3, 0] },
]

const NEG_ENGLISH = [
  { s: 'For all real numbers x, x² ≥ 0.', ok: 'There exists a real number x such that x² < 0.', bad: ['For all real numbers x, x² < 0.', 'There exists a real number x such that x² ≥ 0.', 'There is no real number x such that x² ≥ 0.'] },
  { s: 'There exists a rectangle R such that no angle of R is a right angle.', ok: 'Every rectangle has at least one right angle.', bad: ['There exists a rectangle R such that every angle of R is a right angle.', 'No rectangle has a right angle.', 'Every rectangle has no right angles.'] },
  { s: 'All math professors are dorks.', ok: 'Some math professor is not a dork.', bad: ['No math professor is a dork.', 'All math professors are not dorks.', 'Some math professor is a dork.'] },
  { s: 'For all persons p, if p is blond, then p has blue eyes.', ok: 'There is a blond person who does not have blue eyes.', bad: ['For all persons p, if p is blond, then p does not have blue eyes.', 'There is a person who is not blond and does not have blue eyes.', 'For all persons p, if p is not blond, then p does not have blue eyes.'] },
  { s: 'If a computer program has more than 100,000 lines, then it contains a bug.', ok: 'There is a computer program with more than 100,000 lines that contains no bug.', bad: ['If a computer program has more than 100,000 lines, then it contains no bug.', 'If a computer program has at most 100,000 lines, then it contains no bug.', 'There is a computer program with at most 100,000 lines that contains a bug.'] },
  { s: 'Every integer is either even or odd.', ok: 'Some integer is neither even nor odd.', bad: ['Every integer is neither even nor odd.', 'Some integer is both even and odd.', 'No integer is even or odd.'] },
  { s: 'There exists an integer n such that n² = 2.', ok: 'For every integer n, n² ≠ 2.', bad: ['There exists an integer n such that n² ≠ 2.', 'For every integer n, n² = 2.', 'No integer n has n² ≠ 2.'] },
  { s: 'Some student in the class is left-handed.', ok: 'No student in the class is left-handed.', bad: ['Some student in the class is not left-handed.', 'Every student in the class is left-handed.', 'At least one student in the class is right-handed.'] },
  { s: 'All cats have nine lives.', ok: 'Some cat does not have nine lives.', bad: ['No cat has nine lives.', 'All cats have fewer than nine lives.', 'Some cat has nine lives.'] },
  { s: 'Every real number has a real square root.', ok: 'Some real number does not have a real square root.', bad: ['No real number has a real square root.', 'Every real number does not have a real square root.', 'Some real number has a real square root.'] },
  { s: 'There is a prime number greater than 100.', ok: 'Every prime number is at most 100.', bad: ['There is a prime number that is at most 100.', 'Every prime number is greater than 100.', 'No prime number is at most 100.'] },
  { s: 'For every integer n, n² + n is even.', ok: 'There exists an integer n such that n² + n is odd.', bad: ['For every integer n, n² + n is odd.', 'There exists an integer n such that n² + n is even.', 'There is no integer n such that n² + n is even.'] },
  { s: 'Some triangles have two right angles.', ok: 'No triangle has two right angles.', bad: ['Some triangles do not have two right angles.', 'All triangles have two right angles.', 'Some triangles have one right angle.'] },
  { s: 'For all real numbers x, if x > 1, then x² > x.', ok: 'There exists a real number x such that x > 1 and x² ≤ x.', bad: ['For all real numbers x, if x > 1, then x² ≤ x.', 'There exists a real number x such that x ≤ 1 and x² ≤ x.', 'For all real numbers x, if x ≤ 1, then x² ≤ x.'] },
  { s: 'Every student in this class has taken calculus.', ok: 'Some student in this class has not taken calculus.', bad: ['No student in this class has taken calculus.', 'Every student in this class has not taken calculus.', 'Some student in this class has taken calculus.'] },
  { s: 'There exists a real number x such that x² = −1.', ok: 'For every real number x, x² ≠ −1.', bad: ['There exists a real number x such that x² ≠ −1.', 'For every real number x, x² = −1.', 'There exists a real number x such that x² = 1.'] },
  { s: 'No even integer is prime.', ok: 'Some even integer is prime.', bad: ['Every even integer is prime.', 'Some even integer is not prime.', 'No odd integer is prime.'] },
  { s: 'Every rational number is a real number.', ok: 'Some rational number is not a real number.', bad: ['No rational number is a real number.', 'Every real number is a rational number.', 'Some real number is not a rational number.'] },
  { s: 'If n is an odd integer, then 3n + 1 is even.', ok: 'There is an odd integer n such that 3n + 1 is odd.', bad: ['If n is an odd integer, then 3n + 1 is odd.', 'If n is an even integer, then 3n + 1 is odd.', 'There is an even integer n such that 3n + 1 is even.'] },
]

const NEG_SYMBOLIC = [
  { s: '\\sim(\\forall x \\in D,\\ P(x))', ok: '\\exists x \\in D \\text{ such that } \\sim P(x)', bad: ['\\forall x \\in D,\\ \\sim P(x)', '\\exists x \\in D \\text{ such that } P(x)', '\\sim \\exists x \\in D \\text{ such that } P(x)'] },
  { s: '\\sim(\\exists x \\in D \\text{ such that } P(x))', ok: '\\forall x \\in D,\\ \\sim P(x)', bad: ['\\exists x \\in D \\text{ such that } \\sim P(x)', '\\forall x \\in D,\\ P(x)', '\\sim \\forall x \\in D,\\ P(x)'] },
  { s: '\\sim(\\forall x,\\ P(x) \\Rightarrow Q(x))', ok: '\\exists x \\text{ such that } P(x) \\wedge \\sim Q(x)', bad: ['\\forall x,\\ P(x) \\Rightarrow \\sim Q(x)', '\\exists x \\text{ such that } \\sim P(x) \\wedge \\sim Q(x)', '\\exists x \\text{ such that } \\sim P(x) \\Rightarrow \\sim Q(x)'] },
  { s: '\\sim(\\forall x \\in D,\\ P(x) \\wedge Q(x))', ok: '\\exists x \\in D \\text{ such that } \\sim P(x) \\vee \\sim Q(x)', bad: ['\\exists x \\in D \\text{ such that } \\sim P(x) \\wedge \\sim Q(x)', '\\forall x \\in D,\\ \\sim P(x) \\vee \\sim Q(x)', '\\exists x \\in D \\text{ such that } P(x) \\wedge \\sim Q(x)'] },
  { s: '\\sim(\\exists x \\in D \\text{ such that } P(x) \\vee Q(x))', ok: '\\forall x \\in D,\\ \\sim P(x) \\wedge \\sim Q(x)', bad: ['\\forall x \\in D,\\ \\sim P(x) \\vee \\sim Q(x)', '\\exists x \\in D \\text{ such that } \\sim P(x) \\wedge \\sim Q(x)', '\\forall x \\in D,\\ P(x) \\wedge Q(x)'] },
  { s: '\\sim(\\exists x \\in D \\text{ such that } P(x) \\wedge Q(x))', ok: '\\forall x \\in D,\\ \\sim P(x) \\vee \\sim Q(x)', bad: ['\\forall x \\in D,\\ \\sim P(x) \\wedge \\sim Q(x)', '\\exists x \\in D \\text{ such that } \\sim P(x) \\vee \\sim Q(x)', '\\forall x \\in D,\\ P(x) \\vee Q(x)'] },
  { s: '\\sim(\\forall x \\in D,\\ P(x) \\vee Q(x))', ok: '\\exists x \\in D \\text{ such that } \\sim P(x) \\wedge \\sim Q(x)', bad: ['\\exists x \\in D \\text{ such that } \\sim P(x) \\vee \\sim Q(x)', '\\forall x \\in D,\\ \\sim P(x) \\wedge \\sim Q(x)', '\\exists x \\in D \\text{ such that } P(x) \\wedge Q(x)'] },
  { s: '\\sim(\\exists x \\in D \\text{ such that } P(x) \\Rightarrow Q(x))', ok: '\\forall x \\in D,\\ P(x) \\wedge \\sim Q(x)', bad: ['\\forall x \\in D,\\ P(x) \\Rightarrow \\sim Q(x)', '\\exists x \\in D \\text{ such that } P(x) \\wedge \\sim Q(x)', '\\forall x \\in D,\\ \\sim P(x) \\Rightarrow \\sim Q(x)'] },
  { s: '\\sim(\\forall x \\in D,\\ \\sim P(x))', ok: '\\exists x \\in D \\text{ such that } P(x)', bad: ['\\forall x \\in D,\\ P(x)', '\\exists x \\in D \\text{ such that } \\sim P(x)', '\\sim \\exists x \\in D \\text{ such that } P(x)'] },
  { s: '\\sim(\\exists x \\in D \\text{ such that } \\sim P(x))', ok: '\\forall x \\in D,\\ P(x)', bad: ['\\exists x \\in D \\text{ such that } P(x)', '\\forall x \\in D,\\ \\sim P(x)', '\\sim \\forall x \\in D,\\ P(x)'] },
]

export default {
  id: 'quantifiers',
  name: 'Quantified statements',
  description: '§2.10: for all / there exists, counterexamples, negating quantified statements. HW 70, 72.',
  learn: {
    formulas: [
      { label: 'Universal statement', latex: '\\forall x \\in D,\\ Q(x): \\text{ true iff } Q(x) \\text{ holds for every } x' },
      { label: 'Existential statement', latex: '\\exists x \\in D \\text{ such that } Q(x): \\text{ true iff some } x \\text{ works}' },
      { label: 'Counterexample', latex: 'x \\in D \\text{ with } Q(x) \\text{ false kills a } \\forall \\text{ statement}' },
      { label: 'Negations swap the quantifier', latex: '\\sim(\\forall x, Q(x)) \\equiv \\exists x, \\sim Q(x); \\quad \\sim(\\exists x, Q(x)) \\equiv \\forall x, \\sim Q(x)' },
      { label: 'Negating a universal conditional', latex: '\\sim(\\forall x,\\ P(x) \\Rightarrow Q(x)) \\equiv \\exists x \\text{ such that } P(x) \\wedge \\sim Q(x)' },
    ],
    how: [
      '∀ is a claim about every element: one failure (a counterexample) makes it false. To show it true you must handle every element.',
      '∃ is a claim about at least one element: one witness makes it true. To show it false you must rule out every element.',
      'Over a finite domain, just test every element.',
      'Over R, look for counterexamples near the boundaries: fractions between 0 and 1, negatives, and 0 itself break many "obvious" inequalities.',
      'Negation: flip ∀ to ∃ (or ∃ to ∀) and negate the inside. "All A are B" becomes "some A is not B".',
      'Negating "for all x, if P(x) then Q(x)": there is an x with P(x) true and Q(x) false. Never negate it into another if-then.',
    ],
  },
  templates: [
    {
      id: 'finite-domain',
      generate() {
        const D = randSubset([-3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 3, 5)
        const Q = choice(PREDS)
        const univ = Math.random() < 0.5
        const hits = D.filter(Q.test)
        const misses = D.filter(x => !Q.test(x))
        const v = univ ? misses.length === 0 : hits.length > 0
        return {
          ask: 'True or false?',
          latex: univ ? `\\forall x \\in ${setLatex(D)},\\ ${Q.latex}` : `\\exists x \\in ${setLatex(D)} \\text{ such that } ${Q.latex}`,
          size: 'small',
          answer: tf(v),
          answerLatex: tfLatex(v),
          placeholder: 'true / false',
          hint: {
            latex: univ ? '\\forall: \\text{ one counterexample makes it false}' : '\\exists: \\text{ one witness makes it true}',
            text: univ
              ? v
                ? `True: ${Q.say} holds for every element of the domain.`
                : `False: x = ${misses[0]} is a counterexample (${Q.say} fails there).`
              : v
                ? `True: x = ${hits[0]} is a witness (${Q.say} holds there).`
                : `False: ${Q.say} fails for every element of the domain.`,
          },
        }
      },
    },
    {
      id: 'infinite-domain',
      generate() {
        const item = choice(INFINITE)
        return {
          ask: 'True or false?',
          latex: item.latex,
          size: 'small',
          answer: tf(item.ok),
          answerLatex: tfLatex(item.ok),
          placeholder: 'true / false',
          hint: {
            latex: item.latex.startsWith('\\forall') ? '\\forall: \\text{ look for a counterexample}' : '\\exists: \\text{ look for a witness}',
            text: `${item.ok ? 'True' : 'False'}: ${item.why}.`,
          },
        }
      },
    },
    {
      id: 'counterexample',
      generate() {
        const item = choice(COUNTER)
        return {
          ask: 'The statement is false. Give a counterexample.',
          latex: item.latex,
          size: 'small',
          answer: item.ex,
          answerLatex: item.exLatex,
          accept: raw => {
            const x = parseAnswer(raw)
            return x !== null && item.dom(x) && item.bad(x)
          },
          placeholder: 'a number in the domain',
          hint: {
            latex: '\\text{counterexample: } x \\in D \\text{ with } Q(x) \\text{ false}',
            text: `Pick a value in the domain that breaks the claim, for example ${item.exPlain}. Check the domain: a real-number statement may need a fraction or a negative.`,
          },
          distractors: item.safe,
        }
      },
    },
    {
      id: 'negate-quantified',
      generate() {
        if (Math.random() < 0.4) {
          const item = choice(NEG_SYMBOLIC)
          return withOptions(
            {
              ask: 'Which is logically equivalent?',
              latex: item.s,
              size: 'small',
              hint: {
                latex: '\\sim \\forall \\to \\exists \\sim, \\qquad \\sim \\exists \\to \\forall \\sim',
                text: 'Swap the quantifier and negate the inside. A negated if-then becomes "P and not Q"; a negated ∧ or ∨ follows De Morgan.',
              },
            },
            { latex: item.ok },
            item.bad.map(latex => ({ latex })),
          )
        }
        const item = choice(NEG_ENGLISH)
        return withOptions(
          {
            ask: 'Choose the negation.',
            text: `"${item.s}"`,
            latex: '\\sim(\\forall x, Q(x)) \\equiv \\exists x, \\sim Q(x), \\qquad \\sim(\\exists x, Q(x)) \\equiv \\forall x, \\sim Q(x)',
            size: 'small',
            hint: {
              latex: '\\sim(\\forall x,\\ P(x) \\Rightarrow Q(x)) \\equiv \\exists x,\\ P(x) \\wedge \\sim Q(x)',
              text: `Negation: "${item.ok}". Flip the quantifier (all ↔ some) and negate the claim inside; an if-then inside becomes "P and not Q".`,
            },
          },
          item.ok,
          item.bad,
        )
      },
    },
  ],
}
