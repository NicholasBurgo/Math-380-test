import { randInt, choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, sortEls, tf, tfLatex, withOptions } from './util.js'

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Structured elements: a number, or an array standing for a set.
const isSet = v => Array.isArray(v)
function deepEq(a, b) {
  if (isSet(a) !== isSet(b)) return false
  if (!isSet(a)) return a === b
  return a.length === b.length && a.every(x => b.some(y => deepEq(x, y)))
}
const elemOf = (x, S) => S.some(e => deepEq(e, x))
const subsetOf = (X, S) => X.every(x => elemOf(x, S))
const render = v => (isSet(v) ? (v.length ? `\\{${v.map(render).join(', ')}\\}` : '\\varnothing') : String(v))

const NUMBER_SYSTEMS = [
  { latex: '\\mathbb{Z} \\subseteq \\mathbb{R}', ok: true, why: 'every integer is a real number' },
  { latex: '\\mathbb{R} \\subset \\mathbb{C}', ok: true, why: 'every real is complex, and i is complex but not real' },
  { latex: '\\mathbb{Q} \\subseteq \\mathbb{Z}', ok: false, why: '1/2 is rational but not an integer' },
  { latex: '\\mathbb{N} \\subset \\mathbb{Z}', ok: true, why: 'naturals are integers, and 0 is an integer that is not natural' },
  { latex: '\\mathbb{R} \\subseteq \\mathbb{Q}', ok: false, why: '√2 is real but not rational' },
  { latex: '\\mathbb{Z} \\subseteq \\mathbb{N}', ok: false, why: '-1 is an integer but not a natural number' },
  { latex: '\\mathbb{I} \\subseteq \\mathbb{R}', ok: true, why: 'irrationals are real numbers by definition' },
  { latex: '\\mathbb{C} \\subseteq \\mathbb{R}', ok: false, why: 'i is complex but not real' },
  { latex: '\\mathbb{Q} \\subset \\mathbb{R}', ok: true, why: 'rationals are real and √2 is real but not rational' },
  { latex: '\\mathbb{N} \\subseteq \\mathbb{Q}', ok: true, why: 'every natural number n equals n/1' },
  { latex: '\\mathbb{R} \\subset \\mathbb{R}', ok: false, why: 'a set is never a proper subset of itself' },
  { latex: '\\mathbb{R} \\subseteq \\mathbb{R}', ok: true, why: 'every set is a subset of itself' },
  { latex: '\\mathbb{Z} \\subset \\mathbb{Q}', ok: true, why: 'integers are rational, and 1/2 is rational but not an integer' },
  { latex: '\\mathbb{I} \\subseteq \\mathbb{Q}', ok: false, why: 'irrational numbers are exactly the reals that are not rational' },
]

const HINT_SUB = {
  latex: 'A \\subseteq B \\iff \\forall x\\,(x \\in A \\Rightarrow x \\in B)',
  text: '⊆: every element on the left must appear on the right. ⊂ (proper) also needs something on the right that is missing on the left. ∈ asks if the left object is literally one of the listed elements. A bare number is never a subset.',
}

export default {
  id: 'subsets',
  name: 'Subsets & power sets',
  description: '§1.2: ⊆ versus ⊂ versus ∈, equal sets, power sets. HW 10, 12, 14, 79.',
  learn: {
    formulas: [
      { label: 'Subset', latex: 'A \\subseteq B \\iff \\text{every } x \\in A \\text{ is in } B' },
      { label: 'Proper subset', latex: 'A \\subset B \\iff A \\subseteq B \\text{ and } A \\ne B' },
      { label: 'Equal sets', latex: 'A = B \\iff A \\subseteq B \\text{ and } B \\subseteq A' },
      { label: 'Empty set is a subset of everything', latex: '\\varnothing \\subseteq A' },
      { label: 'Power set: all subsets', latex: '\\mathcal{P}(A) = \\{X \\mid X \\subseteq A\\}' },
      { label: 'Size of the power set', latex: '|\\mathcal{P}(A)| = 2^{|A|}' },
      { label: 'Membership in the power set', latex: 'B \\in \\mathcal{P}(A) \\iff B \\subseteq A' },
    ],
    how: [
      'To test A ⊆ B, scan A element by element and find each one inside B. One missing element kills it.',
      'Proper subset ⊂ is subset plus "not equal": B must have at least one extra element.',
      '∈ versus ⊆: {6} ⊆ {2, 4, 6, 8} is true (6 is in there) but {6} ∈ {2, 4, 6, 8} is false (the set {6} is not listed). "4 ⊆ A" is false: 4 is a number, not a set.',
      'The empty set is a subset of every set (there is no element of ∅ that could fail to be in A), and every set is a subset of itself.',
      'Power set: list ∅, all singletons, all pairs, ..., up to A itself. A set with n elements has 2ⁿ subsets, so 2ⁿ − 1 proper subsets.',
      'P(∅) = {∅} has one element. P({a}) = {∅, {a}} has two.',
    ],
  },
  templates: [
    {
      id: 'subset-tf',
      generate() {
        const kind = choice(['sets', 'sets', 'nested', 'numbers'])
        if (kind === 'numbers') {
          const s = choice(NUMBER_SYSTEMS)
          return {
            ask: 'True or false?',
            latex: s.latex,
            answer: tf(s.ok),
            answerLatex: tfLatex(s.ok),
            placeholder: 'true / false',
            hint: {
              latex: '\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R} \\subset \\mathbb{C}',
              text: `${s.ok ? 'True' : 'False'}: ${s.why}. Proper subset needs the bigger set to have an element the smaller one lacks.`,
            },
          }
        }
        if (kind === 'nested') {
          const [a, b, c] = shuffle(NUMS).slice(0, 3)
          const A = [a, [b], sortEls([a, b]), ...(Math.random() < 0.4 ? [c] : [])]
          const stmts = [
            { latex: `\\{${b}\\} \\in A`, ok: elemOf([b], A) },
            { latex: `\\{${b}\\} \\subseteq A`, ok: subsetOf([b], A) },
            { latex: `${b} \\in A`, ok: elemOf(b, A) },
            { latex: `\\{${a}\\} \\subseteq A`, ok: subsetOf([a], A) },
            { latex: `\\{\\{${b}\\}\\} \\subseteq A`, ok: subsetOf([[b]], A) },
            { latex: `\\{${a}, ${b}\\} \\subseteq A`, ok: subsetOf([a, b], A) },
            { latex: `\\{${a}, ${b}\\} \\in A`, ok: elemOf(sortEls([a, b]), A) },
            { latex: `\\{${a}, \\{${b}\\}\\} \\subseteq A`, ok: subsetOf([a, [b]], A) },
            { latex: `${a} \\subseteq A`, ok: false },
            { latex: `\\{${c}\\} \\subseteq A`, ok: subsetOf([c], A) },
          ]
          const s = choice(stmts)
          return {
            ask: 'True or false?',
            text: `A = ${render(shuffle(A)).replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace('\\varnothing', '∅')}.`,
            latex: s.latex,
            answer: tf(s.ok),
            answerLatex: tfLatex(s.ok),
            placeholder: 'true / false',
            hint: HINT_SUB,
          }
        }
        const A = randSubset(NUMS, 2, 4)
        const rest = NUMS.filter(n => !A.includes(n))
        const rel = choice(['proper', 'equal', 'unrelated', 'super', 'unrelated'])
        let B
        if (rel === 'proper') B = sortEls([...A, ...randSubset(rest, 1, 2)])
        else if (rel === 'equal') B = A.slice()
        else if (rel === 'super') B = A.slice(0, A.length - 1)
        else B = sortEls([...randSubset(A, 1, A.length - 1), ...randSubset(rest, 1, 2)])
        const sub = (X, Y) => X.every(x => Y.includes(x))
        const k = choice(NUMS)
        const stmts = [
          { latex: 'A \\subseteq B', ok: sub(A, B) },
          { latex: 'A \\subset B', ok: sub(A, B) && !sub(B, A) },
          { latex: 'B \\subseteq A', ok: sub(B, A) },
          { latex: 'B \\subset A', ok: sub(B, A) && !sub(A, B) },
          { latex: 'A = B', ok: sub(A, B) && sub(B, A) },
          { latex: 'A \\subseteq A', ok: true },
          { latex: 'A \\subset A', ok: false },
          { latex: '\\varnothing \\subseteq A', ok: true },
          { latex: '\\varnothing \\in A', ok: false },
          { latex: `\\{${k}\\} \\subseteq A`, ok: A.includes(k) },
          { latex: `\\{${k}\\} \\in A`, ok: false },
          { latex: `${k} \\subseteq A`, ok: false },
          { latex: `${k} \\in A`, ok: A.includes(k) },
        ]
        const s = choice(stmts)
        return {
          ask: 'True or false?',
          text: `A = ${setStr(A)}, B = ${setStr(B)}.`,
          latex: s.latex,
          answer: tf(s.ok),
          answerLatex: tfLatex(s.ok),
          placeholder: 'true / false',
          hint: HINT_SUB,
        }
      },
    },
    {
      id: 'power-set-size',
      generate() {
        const kind = choice(['roster', 'roster', 'size', 'proper', 'double', 'empty'])
        if (kind === 'empty') {
          const single = Math.random() < 0.5
          return {
            ask: 'How many elements?',
            latex: single ? '|\\mathcal{P}(\\{\\varnothing\\})| = \\,?' : '|\\mathcal{P}(\\varnothing)| = \\,?',
            answer: single ? 2 : 1,
            hint: {
              latex: '\\mathcal{P}(\\varnothing) = \\{\\varnothing\\}, \\quad \\mathcal{P}(\\{\\varnothing\\}) = \\{\\varnothing, \\{\\varnothing\\}\\}',
              text: single
                ? '{∅} has one element, so its power set has 2¹ = 2 subsets: ∅ and {∅}.'
                : 'The empty set has 0 elements, so 2⁰ = 1 subset: the empty set itself.',
            },
            distractors: [0, 4, 3],
          }
        }
        const n = kind === 'double' ? randInt(0, 2) : randInt(1, 5)
        const A = shuffle(['a', 'b', 'c', 'd', 'e', 'w', 'x', 'y', 'z']).slice(0, n).sort()
        const total = 2 ** n
        if (kind === 'double') {
          return {
            ask: 'Power set of a power set.',
            text: `A = ${setStr(A)}.`,
            latex: '|\\mathcal{P}(\\mathcal{P}(A))| = \\,?',
            answer: 2 ** total,
            answerLatex: `2^{2^{${n}}} = 2^{${total}} = ${2 ** total}`,
            hint: {
              latex: '|\\mathcal{P}(S)| = 2^{|S|}',
              text: `P(A) has 2^${n} = ${total} elements, so P(P(A)) has 2^${total} = ${2 ** total}.`,
            },
            distractors: [total * 2, total ** 2, 2 * n],
          }
        }
        if (kind === 'proper') {
          const nonempty = Math.random() < 0.5
          return {
            ask: nonempty ? 'Count the nonempty subsets.' : 'Count the proper subsets.',
            text: `A = ${setStr(A)}.`,
            latex: nonempty ? '\\#\\{X \\subseteq A \\mid X \\ne \\varnothing\\} = \\,?' : '\\#\\{X \\mid X \\subset A\\} = \\,?',
            answer: total - 1,
            answerLatex: `2^{${n}} - 1 = ${total - 1}`,
            hint: {
              latex: '|\\mathcal{P}(A)| = 2^{|A|}',
              text: `All 2^${n} = ${total} subsets, minus the one that is excluded (${nonempty ? '∅' : 'A itself'}).`,
            },
            distractors: [total, total - 2, n * 2, n ** 2],
          }
        }
        if (kind === 'size') {
          const m = randInt(3, 8)
          return {
            ask: 'How many subsets?',
            text: `A set A has ${m} elements.`,
            latex: '|\\mathcal{P}(A)| = \\,?',
            answer: 2 ** m,
            answerLatex: `2^{${m}} = ${2 ** m}`,
            hint: {
              latex: '|\\mathcal{P}(A)| = 2^{|A|}',
              text: 'Each element is either in or out of a subset: two choices each, multiplied together.',
            },
            distractors: [2 * m, m ** 2, 2 ** m - 1, 2 ** m + 1],
          }
        }
        const nested = Math.random() < 0.4
        const shown = nested ? A.map((x, i) => (i === 0 ? `\\{${x}\\}` : x)) : A
        return {
          ask: 'How many elements?',
          latex: `|\\mathcal{P}(\\{${shown.join(', ')}\\})| = \\,?`,
          size: 'small',
          answer: total,
          answerLatex: `2^{${n}} = ${total}`,
          hint: {
            latex: '|\\mathcal{P}(A)| = 2^{|A|}',
            text: `The set has ${n} element${n === 1 ? '' : 's'}${nested ? ' (a nested set counts as one element)' : ''}, so 2^${n} = ${total} subsets.`,
          },
          distractors: [2 * n, n ** 2, total - 1, total + 1],
        }
      },
    },
    {
      id: 'power-set-member',
      generate() {
        const A = randSubset(['a', 'b', 'c', 'd'], 2, 3)
        const outside = ['a', 'b', 'c', 'd'].filter(x => !A.includes(x))
        const X = randSubset(A, 1, A.length)
        const Y = sortEls([...randSubset(A, 0, 1), choice(outside)])
        const stmts = [
          { latex: `${setLatex(X)} \\in \\mathcal{P}(A)`, ok: true, why: `${setStr(X)} ⊆ A, and the power set is exactly the set of subsets` },
          { latex: `${setLatex(Y)} \\in \\mathcal{P}(A)`, ok: false, why: `${setStr(Y)} has an element outside A, so it is not a subset of A` },
          { latex: `${choice(A)} \\in \\mathcal{P}(A)`, ok: false, why: 'a bare element is not a set, so it is not a subset of A' },
          { latex: '\\varnothing \\in \\mathcal{P}(A)', ok: true, why: '∅ ⊆ A always, so ∅ is a member of P(A)' },
          { latex: 'A \\in \\mathcal{P}(A)', ok: true, why: 'A ⊆ A, so A is one of its own subsets' },
          { latex: '\\varnothing \\subseteq \\mathcal{P}(A)', ok: true, why: 'the empty set is a subset of every set, including P(A)' },
          { latex: `\\{${setLatex(X)}\\} \\subseteq \\mathcal{P}(A)`, ok: true, why: `its only element, ${setStr(X)}, is a subset of A and so belongs to P(A)` },
          { latex: `${setLatex(X)} \\subseteq \\mathcal{P}(A)`, ok: false, why: `its elements are letters, not subsets of A, so they are not members of P(A)` },
        ]
        const s = choice(stmts)
        return {
          ask: 'True or false?',
          text: `A = ${setStr(A)}.`,
          latex: s.latex,
          answer: tf(s.ok),
          answerLatex: tfLatex(s.ok),
          placeholder: 'true / false',
          hint: {
            latex: 'B \\in \\mathcal{P}(A) \\iff B \\subseteq A',
            text: `${s.ok ? 'True' : 'False'}: ${s.why}. Members of P(A) are sets; X ∈ P(A) means X ⊆ A.`,
          },
        }
      },
    },
    {
      id: 'list-power-set',
      generate() {
        const pick = choice([
          {
            set: '\\varnothing',
            ok: '\\{\\varnothing\\}',
            bad: ['\\varnothing', '\\{\\{\\varnothing\\}\\}', '\\{\\varnothing, \\{\\varnothing\\}\\}'],
            why: 'the only subset of ∅ is ∅ itself, so P(∅) = {∅}: one element',
          },
          {
            set: '\\{a\\}',
            ok: '\\{\\varnothing, \\{a\\}\\}',
            bad: ['\\{\\{a\\}\\}', '\\{\\varnothing, a\\}', '\\{a\\}'],
            why: 'a one-element set has two subsets: ∅ and {a}',
          },
          {
            set: '\\{1, 2\\}',
            ok: '\\{\\varnothing, \\{1\\}, \\{2\\}, \\{1, 2\\}\\}',
            bad: ['\\{\\{1\\}, \\{2\\}, \\{1, 2\\}\\}', '\\{\\varnothing, 1, 2, \\{1, 2\\}\\}', '\\{\\{1\\}, \\{2\\}\\}'],
            why: '2² = 4 subsets: ∅, the two singletons, and the whole set',
          },
          {
            set: '\\{x, y\\}',
            ok: '\\{\\varnothing, \\{x\\}, \\{y\\}, \\{x, y\\}\\}',
            bad: ['\\{\\varnothing, \\{x\\}, \\{y\\}\\}', '\\{\\{x\\}, \\{y\\}, \\{x, y\\}\\}', '\\{\\varnothing, x, y, \\{x, y\\}\\}'],
            why: '2² = 4 subsets: ∅, the two singletons, and the whole set',
          },
          {
            set: '\\{\\varnothing\\}',
            ok: '\\{\\varnothing, \\{\\varnothing\\}\\}',
            bad: ['\\{\\varnothing\\}', '\\{\\{\\varnothing\\}\\}', '\\varnothing'],
            why: '{∅} has one element, so two subsets: ∅ and {∅} itself',
          },
        ])
        return withOptions(
          {
            ask: 'Which is the power set?',
            latex: `\\mathcal{P}(${pick.set}) = \\,?`,
            hint: {
              latex: '\\mathcal{P}(A) = \\{X \\mid X \\subseteq A\\}',
              text: `List every subset, starting with ∅ and ending with A itself: ${pick.why}. Elements of P(A) are sets, never bare elements.`,
            },
          },
          { latex: pick.ok },
          pick.bad.map(latex => ({ latex })),
        )
      },
    },
  ],
}
