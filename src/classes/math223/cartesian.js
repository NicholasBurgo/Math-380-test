import { randInt, choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, acceptSet, tf, tfLatex } from './util.js'

const NUMS = [1, 2, 3, 4, 5, 6]
const LET = ['x', 'y', 'z', 'w']
const SYM = ['q', 'r', 's']

// Component pools for tuples in Z^- x Q^+ x C^*.
const DOMAIN_POOLS = {
  '\\mathbb{Z}^-': [
    { latex: '-2', ok: true }, { latex: '-7', ok: true }, { latex: '3', ok: false }, { latex: '0', ok: false },
    { latex: '-\\frac{1}{2}', ok: false }, { latex: '-1', ok: true },
  ],
  '\\mathbb{Q}^+': [
    { latex: '\\frac{1}{2}', ok: true }, { latex: '5', ok: true }, { latex: '-3', ok: false }, { latex: '\\pi', ok: false },
    { latex: '0', ok: false }, { latex: '\\sqrt{2}', ok: false }, { latex: '\\frac{7}{3}', ok: true },
  ],
  '\\mathbb{C}^*': [
    { latex: 'i', ok: true }, { latex: '0', ok: false }, { latex: '5', ok: true }, { latex: '-2i', ok: true }, { latex: '1 + i', ok: true },
  ],
}

export default {
  id: 'cartesian',
  name: 'Cartesian products',
  description: '§1.6: ordered pairs and n-tuples, A × B, |A × B| = |A||B|. HW 60, 66, 78d.',
  learn: {
    formulas: [
      { label: 'Ordered pairs are equal componentwise', latex: '(x_1, x_2) = (y_1, y_2) \\iff x_1 = y_1 \\text{ and } x_2 = y_2' },
      { label: 'Cartesian product', latex: 'A \\times B = \\{(a, b) \\mid a \\in A, b \\in B\\}' },
      { label: 'Size of a product', latex: '|A_1 \\times \\cdots \\times A_n| = |A_1| \\cdots |A_n|' },
      { label: 'Order matters', latex: 'A \\times B \\ne B \\times A \\text{ in general}' },
    ],
    how: [
      'Elements of A × B are ordered pairs: first coordinate from A, second from B. (1, x) and (x, 1) are different.',
      'To list A × B, fix each element of A in turn and pair it with every element of B.',
      'Counting: multiply the sizes. |A × A| = |A|², |B × B × C| = |B|²|C|, and anything times ∅ is ∅.',
      'Membership in A × B: check each coordinate against its own set, in order.',
      'Products of number systems work the same way: (−2, 1/2, i) ∈ ℤ⁻ × ℚ⁺ × ℂ* because each coordinate lands in its slot.',
    ],
  },
  templates: [
    {
      id: 'product-size',
      generate() {
        const A = randSubset(NUMS, 1, 4)
        const B = randSubset(LET, 1, 3)
        const C = randSubset(SYM, 1, 3)
        const a = A.length
        const b = B.length
        const c = C.length
        const asks = [
          { latex: '|A \\times B|', v: a * b, calc: `${a} · ${b}` },
          { latex: '|B \\times A|', v: a * b, calc: `${b} · ${a}` },
          { latex: '|A \\times A|', v: a * a, calc: `${a} · ${a}` },
          { latex: '|B \\times B \\times C|', v: b * b * c, calc: `${b} · ${b} · ${c}` },
          { latex: '|A \\times B \\times C|', v: a * b * c, calc: `${a} · ${b} · ${c}` },
          { latex: '|A \\times \\varnothing|', v: 0, calc: `${a} · 0` },
          { latex: '|\\mathcal{P}(A) \\times B|', v: 2 ** a * b, calc: `2^${a} · ${b}` },
          { latex: '|A \\times \\mathcal{P}(B)|', v: a * 2 ** b, calc: `${a} · 2^${b}` },
        ]
        const q = choice(asks)
        return {
          ask: 'How many elements?',
          text: `A = ${setStr(A)}, B = ${setStr(B)}, C = ${setStr(C)}.`,
          latex: `${q.latex} = \\,?`,
          answer: q.v,
          answerLatex: `${q.calc.replace(/·/g, '\\cdot')} = ${q.v}`,
          hint: {
            latex: '|A_1 \\times \\cdots \\times A_n| = |A_1| \\cdots |A_n|',
            text: `Multiply the sizes of the factors, in order: ${q.calc}. A power set factor contributes 2 to the power of the set's size; an empty factor makes the whole product empty.`,
          },
          distractors: [a + b, a + b + c, 2 * a, a * b + c, Math.max(a, b) ** 2],
        }
      },
    },
    {
      id: 'pair-member',
      generate() {
        if (Math.random() < 0.35) {
          const doms = Object.keys(DOMAIN_POOLS)
          const parts = doms.map(d => choice(DOMAIN_POOLS[d]))
          const ok = parts.every(p => p.ok)
          const badIdx = parts.findIndex(p => !p.ok)
          return {
            ask: 'True or false?',
            latex: `(${parts.map(p => p.latex).join(', ')}) \\in ${doms.join(' \\times ')}`,
            size: 'small',
            answer: tf(ok),
            answerLatex: tfLatex(ok),
            placeholder: 'true / false',
            hint: {
              latex: '(a_1, a_2, a_3) \\in A_1 \\times A_2 \\times A_3 \\iff a_i \\in A_i \\text{ for each } i',
              text: ok
                ? 'True: the first coordinate is a negative integer, the second a positive rational, the third a nonzero complex number.'
                : `False: coordinate ${badIdx + 1} (${parts[badIdx].latex.replace(/\\/g, '')}) is not in ${['ℤ⁻ (negative integers)', 'ℚ⁺ (positive rationals)', 'ℂ* (nonzero complex numbers)'][badIdx]}.`,
            },
          }
        }
        const A = randSubset(NUMS, 2, 3)
        const B = randSubset(LET, 2, 3)
        const outA = NUMS.filter(n => !A.includes(n))
        const outB = LET.filter(l => !B.includes(l))
        const cases = [
          { pair: [choice(A), choice(B)], set: 'A \\times B', ok: true, why: 'first coordinate from A, second from B' },
          { pair: [choice(B), choice(A)], set: 'A \\times B', ok: false, why: 'the coordinates are in the wrong order for A × B; this pair is in B × A' },
          { pair: [choice(B), choice(A)], set: 'B \\times A', ok: true, why: 'first coordinate from B, second from A' },
          { pair: [choice(outA), choice(B)], set: 'A \\times B', ok: false, why: 'the first coordinate is not in A' },
          { pair: [choice(A), choice(outB)], set: 'A \\times B', ok: false, why: 'the second coordinate is not in B' },
          { pair: [choice(A), choice(A)], set: 'A \\times A', ok: true, why: 'both coordinates come from A' },
          { pair: [choice(A), choice(B)], set: 'B \\times A', ok: false, why: 'B × A needs a letter first, then a number' },
        ]
        const c = choice(cases)
        return {
          ask: 'True or false?',
          text: `A = ${setStr(A)}, B = ${setStr(B)}.`,
          latex: `(${c.pair.join(', ')}) \\in ${c.set}`,
          answer: tf(c.ok),
          answerLatex: tfLatex(c.ok),
          placeholder: 'true / false',
          hint: {
            latex: '(a, b) \\in A \\times B \\iff a \\in A \\text{ and } b \\in B',
            text: `${c.ok ? 'True' : 'False'}: ${c.why}.`,
          },
        }
      },
    },
    {
      id: 'list-product',
      generate() {
        const A = randSubset(NUMS, 2, 2)
        const B = randSubset(LET, 2, 2)
        const wantBA = Math.random() < 0.5
        const [X, Y] = wantBA ? [B, A] : [A, B]
        const pairs = X.flatMap(x => Y.map(y => `(${x}, ${y})`))
        const swapped = Y.flatMap(y => X.map(x => `(${y}, ${x})`))
        const wrong = [swapped, pairs.slice(0, 3), [...A, ...B].map(String), X.map((x, i) => `(${x}, ${Y[i]})`)]
        return {
          ask: 'List the product.',
          text: `A = ${setStr(A)}, B = ${setStr(B)}.`,
          latex: `${wantBA ? 'B \\times A' : 'A \\times B'} = \\,?`,
          answer: setStr(pairs),
          answerLatex: setLatex(pairs),
          accept: acceptSet(pairs),
          placeholder: 'e.g. {(1, x), (1, y), ...}',
          choices: wrong.map(setStr).filter(s => s !== setStr(pairs)),
          hint: {
            latex: 'A \\times B = \\{(a, b) \\mid a \\in A, b \\in B\\}',
            text: `Fix each element of ${wantBA ? 'B' : 'A'} in turn and pair it with every element of ${wantBA ? 'A' : 'B'}. ${X.length} · ${Y.length} = ${pairs.length} ordered pairs, first coordinate from the first factor.`,
          },
        }
      },
    },
    {
      id: 'solve-size',
      generate() {
        const kind = choice(['AB', 'AA', 'ABC'])
        if (kind === 'AA') {
          const n = randInt(2, 7)
          return {
            ask: 'Solve for the size.',
            text: `A is a set with |A × A| = ${n * n}.`,
            latex: '|A| = \\,?',
            answer: n,
            hint: { latex: '|A \\times A| = |A|^2', text: `Take the square root: |A|² = ${n * n}, so |A| = ${n}.` },
            distractors: [n * n / 2, n * n - 1, 2 * n],
          }
        }
        if (kind === 'ABC') {
          const a = randInt(2, 4)
          const b = randInt(2, 4)
          const c = randInt(2, 5)
          return {
            ask: 'Solve for the size.',
            text: `|A| = ${a}, |B| = ${b}, and |A × B × C| = ${a * b * c}.`,
            latex: '|C| = \\,?',
            answer: c,
            hint: { latex: '|A \\times B \\times C| = |A|\\,|B|\\,|C|', text: `Divide: ${a * b * c} ÷ (${a} · ${b}) = ${c}.` },
            distractors: [a * b * c - a - b, a * b * c - a * b, (a * b * c) / a],
          }
        }
        const a = randInt(2, 6)
        const b = randInt(2, 6)
        return {
          ask: 'Solve for the size.',
          text: `|A| = ${a} and |A × B| = ${a * b}.`,
          latex: '|B| = \\,?',
          answer: b,
          hint: { latex: '|A \\times B| = |A|\\,|B|', text: `Divide: ${a * b} ÷ ${a} = ${b}.` },
          distractors: [a * b - a, a * b, a],
        }
      },
    },
  ],
}
