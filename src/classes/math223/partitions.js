import { randInt, choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, sortEls, yn, ynLatex, withOptions, gcd } from './util.js'

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const BELL = { 1: 1, 2: 2, 3: 5, 4: 15 }
// Partitions of an n-set into exactly k blocks, keyed "n,k".
const BLOCKS = { '3,2': 3, '3,3': 1, '4,1': 1, '4,2': 7, '4,3': 6, '5,2': 15, '5,4': 10 }

function splitBlocks(A, n) {
  const els = shuffle(A)
  const blocks = Array.from({ length: n }, () => [])
  els.forEach((x, i) => blocks[i < n ? i : randInt(0, n - 1)].push(x))
  return blocks.map(sortEls)
}

const Z_ITEMS = [
  { latex: '\\{\\text{even integers}, \\text{odd integers}\\}', ok: true, why: 'every integer is even or odd, never both, and both blocks are nonempty' },
  { latex: '\\{\\text{positive integers}, \\text{negative integers}\\}', ok: false, why: '0 is in neither block, so the union is not all of ℤ' },
  { latex: '\\{\\mathbb{Z}^+, \\mathbb{Z}^-, \\{0\\}\\}', ok: true, why: 'positives, negatives, and {0} are nonempty, disjoint, and cover ℤ' },
  { latex: '\\{\\text{multiples of } 3, \\text{integers not divisible by } 3\\}', ok: true, why: 'a set and its complement in ℤ always partition ℤ when both are nonempty' },
  { latex: '\\{\\mathbb{Z}, \\varnothing\\}', ok: false, why: 'the blocks of a partition must be nonempty' },
  { latex: '\\{\\{x \\in \\mathbb{Z} \\mid x < 0\\}, \\{x \\in \\mathbb{Z} \\mid x \\le 0\\}, \\{x \\in \\mathbb{Z} \\mid x > 0\\}\\}', ok: false, why: 'the first two blocks overlap (every negative integer is in both)' },
  { latex: '\\{\\{x \\in \\mathbb{Z} \\mid x < 5\\}, \\{x \\in \\mathbb{Z} \\mid x \\ge 5\\}\\}', ok: true, why: 'every integer is either below 5 or at least 5, and not both' },
  { latex: '\\{\\{x \\in \\mathbb{Z} \\mid x \\le 5\\}, \\{x \\in \\mathbb{Z} \\mid x \\ge 5\\}\\}', ok: false, why: '5 is in both blocks' },
  { latex: '\\{\\{x \\in \\mathbb{Z} \\mid x < 5\\}, \\{x \\in \\mathbb{Z} \\mid x > 5\\}\\}', ok: false, why: '5 is in neither block' },
  { latex: '\\{\\text{multiples of } 2, \\text{multiples of } 3, \\text{all other integers}\\}', ok: false, why: '6 is a multiple of 2 and of 3, so two blocks overlap' },
  { latex: '\\{\\mathbb{Z}\\}', ok: true, why: 'a single nonempty block whose union is ℤ is a (trivial) partition' },
  { latex: '\\{\\text{primes}, \\text{integers that are not prime}\\}', ok: true, why: 'a nonempty set and its nonempty complement in ℤ always form a partition' },
  { latex: '\\{\\mathbb{N}, \\{0\\}, \\{x \\in \\mathbb{Z} \\mid x < 0\\}\\}', ok: true, why: 'naturals, zero, and negatives are nonempty, disjoint, and cover ℤ' },
  { latex: '\\{\\{x \\in \\mathbb{Z} \\mid x \\text{ is even}\\}, \\{x \\in \\mathbb{Z} \\mid x \\text{ is a multiple of } 4\\}, \\{x \\in \\mathbb{Z} \\mid x \\text{ is odd}\\}\\}', ok: false, why: '4 is even and a multiple of 4, so two blocks overlap' },
]

// Fresh cut points and moduli each time, in the same notation as Z_ITEMS.
// Values already used by the fixed items are skipped so no option repeats.
function zGenerated() {
  const k = choice([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 6, 7, 8, 9])
  const m = choice([2, 4, 5, 6, 7])
  const [a, b] = sortEls(shuffle([3, 4, 5, 6, 7, 10]).slice(0, 2))
  const cut = rel => `\\{x \\in \\mathbb{Z} \\mid x ${rel} ${k}\\}`
  const both = (a * b) / gcd(a, b)
  return [
    { latex: `\\{${cut('<')}, ${cut('\\ge')}\\}`, ok: true, why: `every integer is either below ${k} or at least ${k}, and not both` },
    { latex: `\\{${cut('\\le')}, ${cut('>')}\\}`, ok: true, why: `every integer is either at most ${k} or above ${k}, and not both` },
    { latex: `\\{${cut('\\le')}, ${cut('\\ge')}\\}`, ok: false, why: `${k} is in both blocks` },
    { latex: `\\{${cut('<')}, ${cut('>')}\\}`, ok: false, why: `${k} is in neither block` },
    { latex: `\\{\\text{multiples of } ${m}, \\text{integers not divisible by } ${m}\\}`, ok: true, why: 'a set and its complement in ℤ always partition ℤ when both are nonempty' },
    { latex: `\\{\\text{multiples of } ${a}, \\text{multiples of } ${b}, \\text{all other integers}\\}`, ok: false, why: `${both} is a multiple of ${a} and of ${b}, so two blocks overlap` },
  ]
}

export default {
  id: 'partitions',
  name: 'Partitions',
  description: '§1.5: pairwise disjoint collections, partitions of a set. HW 48, 50, 52.',
  learn: {
    formulas: [
      { label: 'Pairwise disjoint', latex: 'A_i \\cap A_j = \\varnothing \\text{ whenever } i \\ne j' },
      { label: 'Partition of A', latex: '\\{A_1, \\ldots, A_n\\}: \\; A_i \\ne \\varnothing, \\; A = A_1 \\cup \\cdots \\cup A_n, \\; \\text{pairwise disjoint}' },
      { label: 'Partitions of a small set', latex: '|A| = 1, 2, 3, 4 \\;\\Rightarrow\\; 1, 2, 5, 15 \\text{ partitions}' },
      { label: 'Exactly two blocks / exactly n − 1 blocks', latex: '2^{n-1} - 1 \\qquad / \\qquad \\binom{n}{2}' },
    ],
    how: [
      'Three checks, every time: (1) no block is empty, (2) the blocks together give back all of A, nothing extra, (3) no element sits in two blocks.',
      'Each element of A must land in exactly one block. Scan A element by element and count how many blocks contain it: the count must be 1 each time.',
      'An extra element that is not in A, a missing element, an overlap, or an empty block each break the partition.',
      'A set and its complement (inside A) always partition A as long as both are nonempty. {A} itself is also a partition.',
      'Counting partitions of {a, b, c}: one block {abc}; two blocks {ab|c}, {ac|b}, {bc|a}; three blocks {a|b|c}. Five total.',
    ],
  },
  templates: [
    {
      id: 'is-partition',
      generate() {
        const A = randSubset(NUMS, 5, 6)
        let blocks = splitBlocks(A, randInt(2, 3))
        let why = 'every element of A is in exactly one block and no block is empty'
        const flaw = Math.random() < 0.5 ? null : choice(['overlap', 'missing', 'extra', 'empty'])
        if (flaw === 'overlap') {
          const x = choice(A)
          const others = blocks.filter(b => !b.includes(x))
          const target = choice(others)
          target.push(x)
          blocks = blocks.map(sortEls)
          why = `${x} sits in two different blocks, so the blocks are not pairwise disjoint`
        } else if (flaw === 'missing') {
          const big = blocks.find(b => b.length >= 2) ?? blocks[0]
          const x = big[0]
          blocks = blocks.map(b => (b === big ? b.filter(v => v !== x) : b))
          why = `${x} ∈ A is in no block, so the union of the blocks is not A`
        } else if (flaw === 'extra') {
          const x = choice(NUMS.filter(n => !A.includes(n)))
          blocks[0] = sortEls([...blocks[0], x])
          why = `${x} is not in A, so the union of the blocks is bigger than A`
        } else if (flaw === 'empty') {
          blocks.push([])
          why = 'one block is ∅, and every block of a partition must be nonempty'
        }
        const yes = flaw === null
        return {
          ask: 'Is this collection a partition of A?',
          text: `A = ${setStr(A)}.`,
          latex: `\\{${shuffle(blocks).map(setLatex).join(', ')}\\}`,
          size: 'small',
          answer: yn(yes),
          answerLatex: ynLatex(yes),
          placeholder: 'yes / no',
          hint: {
            latex: '\\text{nonempty blocks, union} = A, \\text{ pairwise disjoint}',
            text: `${yes ? 'Yes' : 'No'}: ${why}. Check each element of A lands in exactly one block, and that no block is empty.`,
          },
        }
      },
    },
    {
      id: 'count-partitions',
      generate() {
        const pool = choice([['a', 'b', 'c', 'd', 'e'], ['v', 'w', 'x', 'y', 'z'], ['p', 'q', 'r', 's', 't'], [1, 2, 3, 4, 5, 6, 7, 8, 9]])
        if (Math.random() < 0.5) {
          const n = randInt(1, 4)
          const A = randSubset(pool, n, n)
          return {
            ask: 'How many partitions?',
            text: `Count the different partitions of A = ${setStr(A)}.`,
            latex: '\\#\\{\\text{partitions of } A\\} = \\,?',
            size: 'small',
            answer: BELL[n],
            hint: {
              latex: '\\{a,b,c\\}: \\{\\{a,b,c\\}\\},\\ \\{\\{a,b\\},\\{c\\}\\},\\ \\{\\{a,c\\},\\{b\\}\\},\\ \\{\\{b,c\\},\\{a\\}\\},\\ \\{\\{a\\},\\{b\\},\\{c\\}\\}',
              text: 'Organize by number of blocks: one block (the set itself), then two blocks, and so on, up to all singletons. For 1, 2, 3, 4 elements the counts are 1, 2, 5, 15.',
            },
            distractors: [2 ** n, n, 2 ** n - 1, n * (n - 1)],
          }
        }
        // partitions into exactly k blocks
        const [n, k] = choice([[3, 2], [4, 2], [4, 3], [5, 2], [5, 4], [3, 3], [4, 1]])
        const A = randSubset(pool, n, n)
        const count = BLOCKS[`${n},${k}`]
        const how =
          k === 1
            ? 'One block means the block is A itself, so there is exactly one such partition.'
            : k === n
              ? `${k} blocks from ${n} elements forces every block to be a singleton: one partition.`
              : k === n - 1
                ? `${k} blocks from ${n} elements means one pair and the rest singletons, so count the pairs: C(${n}, 2) = ${count}.`
                : `Two blocks: pick the block containing the first element. Any of the 2^${n - 1} subsets of the other elements can join it, except all of them (that would leave the second block empty): 2^${n - 1} − 1 = ${count}.`
        return {
          ask: `How many partitions of A have exactly ${k} block${k === 1 ? '' : 's'}?`,
          text: `A = ${setStr(A)}.`,
          latex: `\\#\\{\\text{partitions of } A \\text{ into } ${k} \\text{ block${k === 1 ? '' : 's'}}\\} = \\,?`,
          size: 'small',
          answer: count,
          hint: {
            latex: '\\text{blocks: nonempty, pairwise disjoint, union} = A',
            text: how,
          },
          distractors: [count + 1, 2 ** n, BELL[n] ?? 52, n * k, count - 1],
        }
      },
    },
    {
      id: 'partition-of-Z',
      generate() {
        const askYes = Math.random() < 0.5
        const items = [...Z_ITEMS, ...zGenerated()]
        const good = shuffle(items.filter(i => i.ok))
        const bad = shuffle(items.filter(i => !i.ok))
        const correct = askYes ? good[0] : bad[0]
        const wrong = askYes ? bad.slice(0, 3) : good.slice(0, 3)
        return withOptions(
          {
            ask: askYes ? 'Which collection is a partition of ℤ?' : 'Which collection is NOT a partition of ℤ?',
            latex: '\\mathbb{Z} = \\{\\ldots, -2, -1, 0, 1, 2, \\ldots\\}',
            size: 'small',
            hint: {
              latex: '\\text{nonempty blocks, union} = \\mathbb{Z}, \\text{ pairwise disjoint}',
              text: `The answer is the collection where ${correct.why}. Test the boundary cases (0, 5, 6...) against each block.`,
            },
          },
          { latex: correct.latex },
          wrong.map(w => ({ latex: w.latex })),
        )
      },
    },
  ],
}
