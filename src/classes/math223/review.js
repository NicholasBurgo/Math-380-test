import { choice } from '../../engine/rand.js'
import { withOptions } from './util.js'
import { CLAUSES } from './biconditionals.js'
import { INFINITE } from './quantifiers.js'

// Sentence case, except a leading math variable (x, n, ab, A) stays as written.
const cap = s => (/^[a-z]{1,2}[ ²]/.test(s) && !/^(it|he|we) /.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1))

// Sentence shapes for a pair of clauses P and Q, and what each one means.
// "if" points backward, "only if" points forward, "if and only if" is both.
const MEANINGS = [
  { make: (P, Q) => `${cap(P)} if and only if ${Q}.`, mean: 'iff' },
  { make: (P, Q) => `${cap(P)} iff ${Q}.`, mean: 'iff' },
  { make: (P, Q) => `In order that ${P}, it is necessary and sufficient that ${Q}.`, mean: 'iff' },
  { make: (P, Q) => `The statement that ${P} is equivalent to the statement that ${Q}.`, mean: 'iff' },
  { make: (P, Q) => `${cap(P)} precisely when ${Q}.`, mean: 'iff' },
  { make: (P, Q) => `${cap(P)} only if ${Q}.`, mean: 'forward' },
  { make: (P, Q) => `In order that ${Q}, it is sufficient that ${P}.`, mean: 'forward' },
  { make: (P, Q) => `${cap(P)} if ${Q}.`, mean: 'backward' },
  { make: (P, Q) => `In order that ${Q}, it is necessary that ${P}.`, mean: 'backward' },
]
const IFF_SAYS = MEANINGS.filter(m => m.mean === 'iff')
const FORMS = {
  forward: 'P \\Rightarrow Q',
  backward: 'Q \\Rightarrow P',
  iff: 'P \\Leftrightarrow Q',
  inverse: '\\sim P \\Rightarrow \\sim Q',
}
const WHY = {
  iff: 'Both directions. "if and only if", "iff", "equivalent", "precisely when", and "necessary and sufficient" all mean P ⇔ Q.',
  forward: 'One direction, forward. "P only if Q" and "P is sufficient for Q" both mean P ⇒ Q.',
  backward: 'One direction, backward. "P if Q" and "P is necessary for Q" both mean Q ⇒ P.',
}

// What a correct write-up looks like. A universal claim is proved for an
// arbitrary element and killed by one counterexample; an existential claim is
// proved by one witness and killed only by ruling out the whole domain.
const STRATEGIES = {
  forallTrue: 'Let x be an arbitrary element of the domain, then show the claim holds for it.',
  forallFalse: 'Exhibit one element of the domain where the claim fails, and verify it.',
  existsTrue: 'Exhibit one element of the domain where the claim holds, and verify it.',
  existsFalse: 'Show that the claim fails for every element of the domain.',
}

// "Criticize the following solutions" (§2.10 notes). Some of these are correct:
// the drill is judging the write-up, not assuming it is broken.
const CRITIQUE = [
  {
    claim: 'For all real numbers x, if x(x + 1) > 0, then x > 0.',
    sol: 'Let x ∈ R. Then x = −2. Since (−2)(−1) = 2 > 0 and −2 is not greater than 0, the statement is false.',
    ok: '"Let x ∈ R" makes x arbitrary, so the next line cannot force x = −2. A counterexample opens with "Consider x = −2".',
    bad: [
      'Nothing is wrong with the solution.',
      '−2 is not in the domain, since the claim is about real numbers.',
      'The arithmetic is wrong: (−2)(−1) = −2.',
    ],
  },
  {
    claim: 'For all real numbers x, if x(x + 1) > 0, then x > 0.',
    sol: 'Let x = −2 which is ∈ Z. Then x(x + 1) > 0 = (−2)(−2 + 1) > 0 = 2 > 0.',
    ok: 'Equals signs are chaining whole inequalities together, and it never states that −2 fails the conclusion or that the claim is false.',
    bad: [
      'Nothing is wrong with the solution.',
      'The claim is true, so no counterexample can exist.',
      'A counterexample has to satisfy the conclusion as well as the hypothesis.',
    ],
  },
  {
    claim: 'There exists a positive integer x such that 4x⁴ − 124x³ = 0.',
    sol: 'Let 4x⁴ − 124x³ = 0. So 4x³(x − 31) = 0. So x = 0 or x = 31. So it is true.',
    ok: 'It assumes the equation it was asked to satisfy. That is scratch work: the proof should name x = 31, say it is a positive integer, and verify it.',
    bad: [
      'Nothing is wrong with the solution.',
      'The factoring is wrong: 4x⁴ − 124x³ = 4x³(x − 124).',
      'An existence claim needs every positive integer checked.',
    ],
  },
  {
    claim: 'There exists w ∈ {1, 3, 4, 6} such that w² − 2w + 2 = 0.',
    sol: 'Let w ∈ {1, 3, 4, 6}. Plugging w into the formula does not work, so the result is false by exhaustion.',
    ok: 'Exhaustion means showing all four computations in writing. "Does not work" is a claim, not a computation.',
    bad: [
      'Nothing is wrong with the solution.',
      'Exhaustion is never a valid way to settle a statement.',
      'The domain is infinite, so exhaustion cannot be used here.',
    ],
  },
  {
    claim: 'There exist integers x and y such that x² + y² = 25.',
    sol: 'Consider −5 and 0 ∈ Z. Then x² + y² = (−5)² + 0² = 25. The result now follows.',
    ok: 'Nothing is wrong with the solution.',
    bad: [
      'x must be positive, so −5 is not allowed.',
      'One pair is not enough to settle an existence claim.',
      'It never checks the pair (3, 4), which also works.',
    ],
  },
  {
    claim: 'For every integer n, n² ≥ n.',
    sol: 'Let n = 4. Then 16 ≥ 4, so the statement is true.',
    ok: 'One example never proves a universal claim. The argument has to work for an arbitrary integer n.',
    bad: [
      'Nothing is wrong with the solution.',
      'The claim is false, so no proof of it exists.',
      'n = 4 is not in the domain of the statement.',
    ],
  },
  {
    claim: 'For every real number x, x² ≥ x.',
    sol: 'Let x be an arbitrary real number. Then x² ≥ x, since squaring makes a number bigger.',
    ok: 'The claim is false (x = 1/2 gives 1/4 < 1/2), and "squaring makes a number bigger" is an unjustified step rather than a proof.',
    bad: [
      'Nothing is wrong with the solution.',
      'An arbitrary x is not allowed when proving a universal statement.',
      'The proof is fine but should close with "as required".',
    ],
  },
  {
    claim: 'There exists n ∈ {2, 4, 6} such that n² = 16.',
    sol: 'Consider n = 4, which is in {2, 4, 6}. Then n² = 16, as required.',
    ok: 'Nothing is wrong with the solution.',
    bad: [
      'A witness has to be the smallest element that works.',
      'n = 2 and n = 6 have to be checked as well.',
      'n² = 16 has two solutions, so n = 4 alone is not enough.',
    ],
  },
  {
    claim: 'For every integer n, if n is odd, then n² is odd.',
    sol: 'Let n be an odd integer, so n = 2k + 1 for some integer k. Then n² = 2(2k² + 2k) + 1, which is odd.',
    ok: 'Nothing is wrong with the solution.',
    bad: [
      'Writing n = 2k + 1 assumes what is being proved.',
      'It should test n = 1, 3, 5 before claiming the general case.',
      'A universal statement cannot be proved without a counterexample check.',
    ],
  },
]

export default {
  id: 'review',
  name: 'Rewriting & proof writing',
  description: 'Crash course: which arrow a sentence means, splitting "if and only if", and what a correct proof looks like. §2.4–2.6, §2.10.',
  learn: {
    formulas: [
      { label: 'One direction, forward', latex: 'P \\text{ only if } Q; \; P \\text{ sufficient for } Q \;\\equiv\; P \\Rightarrow Q' },
      { label: 'One direction, backward', latex: 'P \\text{ if } Q; \; P \\text{ necessary for } Q \;\\equiv\; Q \\Rightarrow P' },
      { label: 'Both directions', latex: 'P \\text{ iff } Q \;\\equiv\; (P \\Rightarrow Q) \\wedge (Q \\Rightarrow P)' },
      { label: 'Proving a quantified statement', latex: '\\forall: \\text{ arbitrary } x \\text{ or one counterexample} \\qquad \\exists: \\text{ one witness or rule out } D' },
    ],
    how: [
      '"if" points backward and "only if" points forward, which is why joining them into "if and only if" gives you both arrows.',
      '"Sufficient" marks the hypothesis; "necessary" marks the conclusion, so it flips the arrow: R is necessary for S means S ⇒ R.',
      'To prove P ⇔ Q you owe two proofs, one per direction, labelled (⇒) and (⇐).',
      'Writing it up: "Let x be arbitrary" means x stays general, so you cannot hand it a value two lines later. A counterexample or a witness opens with "Consider x = ..." and then verifies it.',
      'Never assume what you are proving, and a proof ends with a sentence, not a number: "=" joins numbers, never whole statements.',
    ],
  },
  templates: [
    {
      id: 'iff-direction',
      generate() {
        const pick = choice(CLAUSES)
        const c = Math.random() < 0.5 ? pick : { a: pick.b, na: pick.nb, b: pick.a, nb: pick.na }
        const ph = choice(MEANINGS)
        return withOptions(
          {
            ask: 'Which symbolic form is it?',
            text: `P: ${c.a}. Q: ${c.b}. "${ph.make(c.a, c.b)}"`,
            latex: 'P \\Rightarrow Q \\qquad Q \\Rightarrow P \\qquad P \\Leftrightarrow Q',
            size: 'small',
            hint: {
              latex: 'P \\text{ if } Q: \; Q \\Rightarrow P \\qquad P \\text{ only if } Q: \; P \\Rightarrow Q',
              text: WHY[ph.mean],
            },
          },
          { latex: FORMS[ph.mean] },
          Object.keys(FORMS).filter(k => k !== ph.mean).map(k => ({ latex: FORMS[k] })),
        )
      },
    },
    {
      id: 'iff-split',
      generate() {
        const pick = choice(CLAUSES)
        const c = Math.random() < 0.5 ? pick : { a: pick.b, na: pick.nb, b: pick.a, nb: pick.na }
        const [X, Y, nX, nY] = [c.a, c.b, c.na, c.nb]
        if (Math.random() < 0.55) {
          const ph = choice(IFF_SAYS)
          return withOptions(
            {
              ask: 'Which pair of implications is this?',
              text: `P: ${X}. Q: ${Y}. "${ph.make(X, Y)}"`,
              latex: 'P \\Leftrightarrow Q \;=\; (P \\Rightarrow Q) \\wedge (Q \\Rightarrow P)',
              size: 'small',
              hint: {
                latex: '(P \\Rightarrow Q) \\wedge (Q \\Rightarrow P)',
                text: `A biconditional is both directions, so it splits into "If ${X}, then ${Y}" and its converse "If ${Y}, then ${X}". One arrow alone is not enough.`,
              },
            },
            `If ${X}, then ${Y}; and if ${Y}, then ${X}.`,
            [`If ${X}, then ${Y}.`, `If ${Y}, then ${X}.`, `If ${nX}, then ${nY}; and if ${nY}, then ${nX}.`],
          )
        }
        return withOptions(
          {
            ask: 'Which single sentence says both?',
            text: `"If ${X}, then ${Y}." and "If ${Y}, then ${X}."`,
            latex: '(P \\Rightarrow Q) \\wedge (Q \\Rightarrow P) \;=\; P \\Leftrightarrow Q',
            size: 'small',
            hint: {
              latex: 'P \\Leftrightarrow Q',
              text: 'An implication together with its converse is exactly a biconditional: "if and only if". A one-way phrase like "only if" or "sufficient for" keeps just one arrow.',
            },
          },
          `${cap(X)} if and only if ${Y}.`,
          [`${cap(X)} only if ${Y}.`, `${cap(X)} if ${Y}.`, `In order that ${Y}, it is sufficient that ${X}.`],
        )
      },
    },
    {
      id: 'proof-shape',
      generate() {
        const item = choice(INFINITE)
        const univ = item.latex.startsWith('\\forall')
        const key = univ ? (item.ok ? 'forallTrue' : 'forallFalse') : (item.ok ? 'existsTrue' : 'existsFalse')
        return withOptions(
          {
            ask: 'Which proof would you write?',
            latex: item.latex,
            size: 'small',
            hint: {
              latex: '\\forall: \\text{ arbitrary element or one counterexample} \\quad \\exists: \\text{ one witness or rule out the domain}',
              text: `The statement is ${item.ok ? 'true' : 'false'}, since ${item.why}. ${STRATEGIES[key]}`,
            },
          },
          STRATEGIES[key],
          Object.keys(STRATEGIES).filter(k => k !== key).map(k => STRATEGIES[k]),
        )
      },
    },
    {
      id: 'critique',
      generate() {
        const item = choice(CRITIQUE)
        return withOptions(
          {
            ask: 'What is the problem with this solution, if any?',
            text: `Claim: "${item.claim}" Solution: "${item.sol}"`,
            latex: '\\text{object} + \\text{verification} + \\text{conclusion}',
            size: 'small',
            hint: {
              latex: '\\text{arbitrary } x \\ne \\text{ a chosen } x',
              text: item.ok === 'Nothing is wrong with the solution.'
                ? 'This one is correct: it names an object in the domain, verifies the claim on it, and concludes in words.'
                : item.ok,
            },
          },
          item.ok,
          item.bad,
        )
      },
    },
  ],
}
