import { randInt, choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, acceptSet, acceptInterval, sortEls, lcm } from './util.js'

// Families A_i, i = 1, 2, 3, ... with their union and intersection over N.
// Each entry gives the KaTeX for A_i, the two answers as interval strings,
// and a one-line reason for each.
function families() {
  const a = randInt(-2, 2)
  const b = a + randInt(1, 3)
  const c = randInt(1, 3)
  const iv = (l, x, y, r) => `${l}${x}, ${y}${r}`
  return [
    {
      latex: `\\left[${a}, ${b} + \\frac{${c}}{i}\\right]`,
      union: iv('[', a, b + c, ']'),
      inter: iv('[', a, b, ']'),
      whyU: `A_1 = [${a}, ${b + c}] is the biggest interval and every other A_i sits inside it`,
      whyI: `the right endpoints ${b} + ${c}/i shrink toward ${b} but never go below it, and ${b} itself is in every A_i`,
    },
    {
      latex: `\\left[${a} - \\frac{${c}}{i}, ${b}\\right]`,
      union: iv('[', a - c, b, ']'),
      inter: iv('[', a, b, ']'),
      whyU: `A_1 = [${a - c}, ${b}] contains all the others`,
      whyI: `the left endpoints ${a} − ${c}/i climb toward ${a} but never pass it, and ${a} is in every A_i`,
    },
    {
      latex: '\\left(-\\frac{1}{i}, \\frac{1}{i}\\right)',
      union: '(-1, 1)',
      inter: '{0}',
      whyU: 'A_1 = (−1, 1) contains all the others',
      whyI: 'the intervals shrink around 0; any x ≠ 0 is thrown out once 1/i < |x|, but 0 is always inside',
    },
    {
      latex: '\\left[-\\frac{1}{i}, \\frac{1}{i}\\right]',
      union: '[-1, 1]',
      inter: '{0}',
      whyU: 'A_1 = [−1, 1] contains all the others',
      whyI: 'any x ≠ 0 is excluded once 1/i < |x|, so only 0 survives every A_i',
    },
    {
      latex: '\\left(0, \\frac{1}{i}\\right)',
      union: '(0, 1)',
      inter: '∅',
      whyU: 'A_1 = (0, 1) contains all the others',
      whyI: 'for any x > 0 there is an i with 1/i < x, so no point is in every A_i',
    },
    {
      latex: '\\left[0, \\frac{1}{i}\\right]',
      union: '[0, 1]',
      inter: '{0}',
      whyU: 'A_1 = [0, 1] contains all the others',
      whyI: 'any x > 0 is excluded once 1/i < x, but 0 is in every A_i',
    },
    {
      latex: '[i, i + 1]',
      union: '[1, ∞)',
      inter: '∅',
      whyU: 'the intervals [1,2], [2,3], [3,4], ... chain together and cover everything from 1 on',
      whyI: 'no number sits in every one of them: [1,2] and [3,4] are already disjoint',
    },
    {
      latex: '[0, i]',
      union: '[0, ∞)',
      inter: '[0, 1]',
      whyU: 'the intervals grow without bound, so every x ≥ 0 lands in some A_i',
      whyI: 'A_1 = [0, 1] is the smallest and sits inside every other A_i',
    },
    {
      latex: '[-i, i]',
      union: 'R',
      inter: '[-1, 1]',
      whyU: 'every real number x is inside [−i, i] once i ≥ |x|, so the union is all of R',
      whyI: 'A_1 = [−1, 1] is the smallest and sits inside every other A_i',
    },
    {
      latex: '(-i, i)',
      union: 'R',
      inter: '(-1, 1)',
      whyU: 'every real x is inside (−i, i) once i > |x|',
      whyI: 'A_1 = (−1, 1) is the smallest and sits inside every other A_i',
    },
    {
      latex: '\\left[\\frac{1}{i}, 1\\right]',
      union: '(0, 1]',
      inter: '{1}',
      whyU: 'the left endpoints 1/i approach 0 but never reach it, so every x in (0, 1] is covered and 0 is not',
      whyI: 'A_1 = [1, 1] = {1} is the smallest and 1 is in every A_i',
    },
    {
      latex: '\\left[0, 1 - \\frac{1}{i}\\right]',
      union: '[0, 1)',
      inter: '{0}',
      whyU: 'the right endpoints 1 − 1/i approach 1 but never reach it, so 1 is left out',
      whyI: 'A_1 = [0, 0] = {0} is the smallest and 0 is in every A_i',
    },
    {
      latex: '\\left(\\frac{1}{i}, 1\\right)',
      union: '(0, 1)',
      inter: '∅',
      whyU: 'the left endpoints 1/i approach 0, so every x in (0, 1) is eventually covered',
      whyI: 'A_1 = (1, 1) is already empty, and an intersection with an empty set is empty',
    },
  ]
}

const shownInterval = s => (s === 'R' ? '\\mathbb{R}' : s === '∅' ? '\\varnothing' : s.replace('∞', '\\infty'))

export default {
  id: 'indexed',
  name: 'Indexed collections',
  description: '§1.4: unions and intersections over an index set, interval families. HW 36, 38, 40.',
  learn: {
    formulas: [
      { label: 'Finite union / intersection', latex: '\\bigcup_{i=1}^{n} A_i = A_1 \\cup \\cdots \\cup A_n, \\quad \\bigcap_{i=1}^{n} A_i = A_1 \\cap \\cdots \\cap A_n' },
      { label: 'Over an index set S', latex: '\\bigcup_{s \\in S} A_s = \\{x \\mid x \\in A_s \\text{ for some } s\\}, \\quad \\bigcap_{s \\in S} A_s = \\{x \\mid x \\in A_s \\text{ for all } s\\}' },
      { label: 'Multiples intersect at the lcm', latex: '\\{2k\\} \\cap \\{3k\\} \\cap \\{5k\\} = \\{30k\\}' },
    ],
    how: [
      'Union: x is in it if x is in at least one A_i. Intersection: x must be in every A_i.',
      'Interval families: write out A_1, A_2, A_3 and watch which endpoint moves and where it is heading.',
      'If the intervals are nested (each inside the previous one), the union is the biggest one, A_1. If they grow, the union runs out to the limit.',
      'For the intersection, ask "which points survive every interval?" A moving endpoint\'s limit is included only if it is inside every A_i.',
      'Finite index sets: just write out the few sets and combine them by hand.',
      'Multiples of 2, of 3, and of 5 meet at the multiples of their lcm, 30.',
    ],
  },
  templates: [
    {
      id: 'interval-family',
      generate() {
        const fam = choice(families())
        const wantUnion = Math.random() < 0.5
        const ans = wantUnion ? fam.union : fam.inter
        const wrong = [wantUnion ? fam.inter : fam.union, ...shuffle(families()).map(f => (wantUnion ? f.union : f.inter))]
        return {
          ask: wantUnion ? 'Find the union over all i ∈ ℕ.' : 'Find the intersection over all i ∈ ℕ.',
          text: 'For each i ∈ ℕ = {1, 2, 3, ...}, let',
          latex: `A_i = ${fam.latex}, \\qquad ${wantUnion ? '\\bigcup' : '\\bigcap'}_{i \\in \\mathbb{N}} A_i = \\,?`,
          size: 'small',
          answer: ans,
          answerLatex: shownInterval(ans),
          accept: acceptInterval(ans),
          placeholder: 'e.g. [0, 2], (0, 1], {0}, ∅, R',
          choices: [...new Set(wrong.filter(w => w !== ans))].slice(0, 3),
          hint: {
            latex: wantUnion ? '\\bigcup A_i: \\text{ in at least one } A_i' : '\\bigcap A_i: \\text{ in every } A_i',
            text: `Write out A_1, A_2, A_3 and watch the moving endpoint. Here ${wantUnion ? fam.whyU : fam.whyI}.`,
          },
        }
      },
    },
    {
      id: 'finite-family',
      generate() {
        const letters = Math.random() < 0.4
        const k = randInt(1, 2) // A_i = {i, ..., i + k}
        const idx = randSubset(letters ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] : [1, 2, 3, 4, 5, 6, 7, 8, 9], 2, 3)
        const wantUnion = Math.random() < 0.5
        const sets = idx.map(i => Array.from({ length: k + 1 }, (_, j) => i + j))
        const raw = wantUnion
          ? sortEls([...new Set(sets.flat())])
          : sets.reduce((acc, s) => acc.filter(x => s.includes(x)))
        const show = n => (letters ? String.fromCharCode(96 + n) : n)
        const ans = raw.map(show)
        const I = idx.map(show)
        const alt = wantUnion
          ? sets.reduce((acc, s) => acc.filter(x => s.includes(x)))
          : sortEls([...new Set(sets.flat())])
        const wrong = [alt.map(show), idx.map(show), sortEls([...new Set(sets.flat())]).slice(1).map(show)]
        const desc = letters
          ? `For a letter α, let A_α be the set consisting of α and the ${k === 1 ? 'next letter' : 'next two letters'} of the alphabet (so A_a = {a, ${k === 1 ? 'b' : 'b, c'}}).`
          : `For i ∈ ℕ, let A_i = {i, ${k === 1 ? 'i + 1' : 'i + 1, i + 2'}}.`
        return {
          ask: wantUnion ? 'Find the union over the index set.' : 'Find the intersection over the index set.',
          text: `${desc} Let I = ${setStr(I)}.`,
          latex: `${wantUnion ? '\\bigcup' : '\\bigcap'}_{${letters ? '\\alpha' : 'i'} \\in I} A_{${letters ? '\\alpha' : 'i'}} = \\,?`,
          answer: setStr(ans),
          answerLatex: setLatex(ans),
          accept: acceptSet(ans),
          placeholder: 'e.g. {3, 4, 5} or ∅',
          choices: wrong.map(setStr).filter(s => s !== setStr(ans)),
          hint: {
            latex: idx.map(i => `A_{${show(i)}} = ${setLatex(sets[idx.indexOf(i)].map(show))}`).join(', \\;'),
            text: `Write out each set in the collection, then ${wantUnion ? 'pool everything together, listing repeats once' : 'keep only what appears in every one of them'}.`,
          },
        }
      },
    },
    {
      id: 'multiples',
      generate() {
        const ms = randSubset([2, 3, 4, 5, 6, 7, 9, 10], 2, 3)
        const L = ms.reduce((a, b) => lcm(a, b))
        const prod = ms.reduce((a, b) => a * b)
        const defs = ms.map((m, i) => `A_${i + 1} = {x ∈ ℤ⁺ | x is a multiple of ${m}}`).join(', ')
        return {
          ask: 'Describe the intersection.',
          text: `Let ${defs}.`,
          latex: `\\bigcap_{i=1}^{${ms.length}} A_i = \\{x \\in \\mathbb{Z}^+ \\mid x \\text{ is a multiple of } \\,?\\,\\}`,
          size: 'small',
          answer: L,
          hint: {
            latex: `\\operatorname{lcm}(${ms.join(', ')}) = ${L}`,
            text: 'A number in every A_i is a common multiple of all the moduli, so the intersection is the multiples of their least common multiple.',
          },
          distractors: [prod, Math.max(...ms), ms.reduce((a, b) => a + b), L * 2],
        }
      },
    },
  ],
}
