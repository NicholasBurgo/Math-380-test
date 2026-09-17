import { randInt, choice } from '../../engine/rand.js'
import { yn, ynLatex, tf, tfLatex, isPrime } from './util.js'

const STATEMENTS = [
  { s: 'All birds talk.', why: 'declarative and definitely false, so it is a (false) statement' },
  { s: "Dr. Cannon's car is green.", why: 'declarative with a definite truth value, even if you do not know it' },
  { s: 'The Albert Einstein Story is the Best Picture Oscar winner for 2035.', why: 'it will be either true or false; not knowing yet does not matter' },
  { s: "John Smith is Dr. Hudson's favorite student.", why: 'declarative and either true or false' },
  { s: 'The integer 7 is prime.', why: 'declarative and true' },
  { s: '2 + 2 = 5.', why: 'declarative and false: false statements are still statements' },
  { s: 'Every square is a rectangle.', why: 'declarative and true' },
  { s: 'Paris is the capital of France.', why: 'declarative and true' },
  { s: 'There are infinitely many twin primes.', why: 'it is either true or false even though nobody has proved which' },
  { s: '√2 is a rational number.', why: 'declarative and false' },
  { s: '0 is a natural number.', why: 'declarative and false (ℕ starts at 1 in this course)' },
  { s: 'Every even integer greater than 2 is the sum of two primes.', why: 'true or false, unknown which: still a statement' },
  { s: 'Some prime number is even.', why: 'declarative and true (2 is even)' },
  { s: 'The number 15 is a multiple of 4.', why: 'declarative and false' },
]

const NOT_STATEMENTS = [
  { s: 'x > 2.', why: 'x is a variable; the truth depends on x, so this is an open sentence' },
  { s: 'She received an A on her chemistry exam.', why: '"she" is an unspecified variable, so this is an open sentence' },
  { s: 'Is it raining?', why: 'a question has no truth value' },
  { s: 'Close the door.', why: 'a command has no truth value' },
  { s: 'n is a prime number.', why: 'n is a variable: true for some n, false for others' },
  { s: 'x + 3 = 7.', why: 'an equation with a free variable is an open sentence' },
  { s: 'He is a math major.', why: '"he" is unspecified, so there is no fixed truth value' },
  { s: 'What time is it?', why: 'a question has no truth value' },
  { s: 'Please pass the salt.', why: 'a request has no truth value' },
  { s: 'x² = 4.', why: 'true for x = 2, false for x = 3: an open sentence' },
  { s: 'They live in Hammond.', why: '"they" is unspecified, so this is an open sentence' },
  { s: 'Study for the test!', why: 'a command has no truth value' },
  { s: 'n and n + 2 are both prime.', why: 'depends on n: an open sentence' },
  { s: 'Wow, what a game!', why: 'an exclamation has no truth value' },
]

// Open sentences P(n) over the positive integers.
const PREDICATES = [
  { latex: 'n \\text{ and } n + 2 \\text{ are both prime}', test: n => isPrime(n) && isPrime(n + 2), name: 'twin primes' },
  { latex: 'n \\text{ is prime}', test: n => isPrime(n), name: 'prime' },
  { latex: 'n^2 > 20', test: n => n * n > 20, name: 'n² > 20' },
  { latex: 'n \\text{ divides } 24', test: n => 24 % n === 0, name: 'divides 24' },
  { latex: '2n + 1 \\text{ is prime}', test: n => isPrime(2 * n + 1), name: '2n + 1 prime' },
  { latex: 'n \\text{ is a perfect square}', test: n => Number.isInteger(Math.sqrt(n)), name: 'perfect square' },
  { latex: 'n^2 - 1 \\text{ is prime}', test: n => isPrime(n * n - 1), name: 'n² − 1 prime' },
  { latex: 'n^2 + 1 \\text{ is prime}', test: n => isPrime(n * n + 1), name: 'n² + 1 prime' },
  { latex: 'n \\text{ and } 2n + 1 \\text{ are both prime}', test: n => isPrime(n) && isPrime(2 * n + 1), name: 'n and 2n + 1 prime' },
  { latex: '3n - 1 \\text{ is a multiple of } 4', test: n => (3 * n - 1) % 4 === 0, name: '3n − 1 multiple of 4' },
  { latex: 'n^2 + n \\text{ is even}', test: n => (n * n + n) % 2 === 0, name: 'n² + n even' },
]

export default {
  id: 'statements',
  name: 'Statements & open sentences',
  description: '§2.1: which sentences are statements, truth values of open sentences P(n). HW 4, 6.',
  learn: {
    formulas: [
      { label: 'Statement', latex: '\\text{declarative sentence that is true or false, not both}' },
      { label: 'Open sentence', latex: 'P(x): \\text{ becomes a statement once } x \\text{ is given a value}' },
      { label: 'Truth value', latex: 'T \\text{ or } F' },
    ],
    how: [
      'Statement test: is it declarative, and does it have exactly one truth value (even one you do not know)? Questions, commands, and exclamations fail immediately.',
      'A sentence with a free variable (x, n, "she", "they") is an open sentence, not a statement: its truth changes with the value.',
      'A false sentence is still a statement. "2 + 2 = 5" is a statement; it is just false.',
      'Unknown is not the same as undetermined: "there are infinitely many twin primes" is a statement even though it is unproved.',
      'For P(n), plug in the number and decide. To find where P(n) is true, walk n = 1, 2, 3, ... and test each one.',
    ],
  },
  templates: [
    {
      id: 'is-statement',
      generate() {
        const yes = Math.random() < 0.5
        const item = choice(yes ? STATEMENTS : NOT_STATEMENTS)
        return {
          ask: 'Is this a statement?',
          text: `"${item.s}"`,
          latex: '\\text{statement?}',
          size: 'small',
          answer: yn(yes),
          answerLatex: ynLatex(yes),
          placeholder: 'yes / no',
          hint: {
            latex: '\\text{declarative} + \\text{one definite truth value}',
            text: `${yes ? 'Yes' : 'No'}: ${item.why}.`,
          },
        }
      },
    },
    {
      id: 'open-sentence-value',
      generate() {
        const P = choice(PREDICATES)
        const n = randInt(1, 30)
        const ok = P.test(n)
        return {
          ask: 'Truth value of the open sentence at this value.',
          latex: `P(n): ${P.latex}. \\qquad P(${n}) = \\,?`,
          size: 'small',
          answer: tf(ok),
          answerLatex: tfLatex(ok),
          placeholder: 'true / false',
          hint: {
            latex: `P(${n})`,
            text: `Substitute n = ${n} and check "${P.name}" for that number: it is ${ok ? 'true' : 'false'}.`,
          },
        }
      },
    },
    {
      id: 'find-true-values',
      generate() {
        const P = choice(PREDICATES)
        if (Math.random() < 0.5) {
          const m = choice([10, 12, 15, 20])
          let count = 0
          const hits = []
          for (let n = 1; n <= m; n++) if (P.test(n)) {
            count++
            hits.push(n)
          }
          return {
            ask: `For how many n in {1, 2, ..., ${m}} is P(n) true?`,
            latex: `P(n): ${P.latex}`,
            size: 'small',
            answer: count,
            answerLatex: `${count}${hits.length ? ` \\quad (n = ${hits.join(', ')})` : ''}`,
            hint: {
              latex: `n = 1, 2, \\ldots, ${m}`,
              text: `Test each n from 1 to ${m}. P(n) is true for n = ${hits.join(', ') || 'no value'}: ${count} value${count === 1 ? '' : 's'}.`,
            },
            distractors: [count + 1, count - 1, m - count, count + 2],
          }
        }
        const k = randInt(1, 12)
        // first n >= k with P(n) true; predicates that never hit again are skipped
        let n = k
        let Q = P
        for (;;) {
          n = k
          while (!Q.test(n) && n < 500) n++
          if (n < 500) break
          Q = choice(PREDICATES)
        }
        return {
          ask: `Find the smallest n ≥ ${k} for which P(n) is true.`,
          latex: `P(n): ${Q.latex}`,
          size: 'small',
          answer: n,
          hint: {
            latex: `n = ${k}, ${k + 1}, \\ldots`,
            text: `Start at ${k} and test upward. The first value that works is n = ${n}.`,
          },
          distractors: [n + 1, n - 1, n + 2, k],
        }
      },
    },
  ],
}
