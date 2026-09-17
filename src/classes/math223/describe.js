import { randInt, choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, acceptSet, sortEls, yn, ynLatex } from './util.js'

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const DOMAINS = {
  Z: { latex: '\\mathbb{Z}', name: 'integers', has: p => p.int },
  N: { latex: '\\mathbb{N}', name: 'natural numbers 1, 2, 3, ...', has: p => p.int && p.v >= 1 },
  Q: { latex: '\\mathbb{Q}', name: 'rational numbers', has: p => p.rational },
  R: { latex: '\\mathbb{R}', name: 'real numbers', has: () => true },
}

// Values a set-builder condition can be probed with.
const PROBES = [
  { latex: '-\\frac{1}{2}', v: -0.5, int: false, rational: true },
  { latex: '\\frac{3}{2}', v: 1.5, int: false, rational: true },
  { latex: '\\frac{7}{2}', v: 3.5, int: false, rational: true },
  { latex: '\\sqrt{2}', v: Math.SQRT2, int: false, rational: false },
  { latex: '0', v: 0, int: true, rational: true },
  ...[-4, -3, -2, -1, 1, 2, 3, 4, 5, 6].map(v => ({ latex: String(v), v, int: true, rational: true })),
]

const LOWS = [
  { v: -4.3, l: '-4.3' },
  { v: -2.5, l: '-2.5' },
  { v: -3, l: '-3' },
  { v: -1.7, l: '-1.7' },
  { v: -Math.PI, l: '-\\pi' },
]
const HIGHS = [
  { v: Math.PI, l: '\\pi' },
  { v: 2.5, l: '2.5' },
  { v: 4.2, l: '4.2' },
  { v: 6, l: '6' },
  { v: Math.E, l: 'e' },
]

// A condition on x: KaTeX text plus a membership test on a real value.
function randCondition() {
  const kind = choice(['between', 'between', 'square-lt', 'abs-le', 'square-eq'])
  if (kind === 'between') {
    const lo = choice(LOWS)
    const hi = choice(HIGHS)
    return { latex: `${lo.l} < x < ${hi.l}`, test: v => lo.v < v && v < hi.v }
  }
  if (kind === 'square-lt') {
    const n = choice([10, 20, 30, 50])
    return { latex: `x^2 < ${n}`, test: v => v * v < n }
  }
  if (kind === 'abs-le') {
    const k = randInt(2, 4)
    return { latex: `|x| \\le ${k}`, test: v => Math.abs(v) <= k }
  }
  const n = choice([4, 9, 16, 5, 7])
  return { latex: `x^2 = ${n}`, test: v => v * v === n }
}

// Integers in [-10, 10] (or 1..10 for N) satisfying the condition.
function rosterOf(cond, D) {
  const out = []
  for (let x = D === 'N' ? 1 : -10; x <= 10; x++) if (cond.test(x)) out.push(x)
  return out
}

const builder = (D, cond) => `\\{x \\in ${DOMAINS[D].latex} \\mid ${cond.latex}\\}`

export default {
  id: 'describe',
  name: 'Describing a set',
  description: '§1.1: membership, set-builder to roster, cardinality. HW 4, 6bc, 74, 76acf.',
  learn: {
    formulas: [
      { label: 'Element of / not an element of', latex: 'x \\in A, \\qquad x \\notin A' },
      { label: 'Set-builder notation', latex: '\\{x \\in S \\mid P(x)\\}' },
      { label: 'Cardinality: number of elements', latex: '|S|' },
      { label: 'Empty set', latex: '\\varnothing = \\{\\}, \\qquad |\\varnothing| = 0' },
      {
        label: 'Number systems',
        latex: '\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R} \\subset \\mathbb{C}',
      },
    ],
    how: [
      'Membership is literal: x ∈ A only if x appears as one of the listed elements, braces and all. 2 and {2} are different objects.',
      'Set-builder: first check the domain (is the candidate an integer? a rational?), then the condition. A fraction is never in a set built from Z.',
      'Roster from set-builder: walk the domain and keep the values that satisfy the condition. Strict inequalities exclude the endpoints.',
      'Order and repeats do not matter, so {2, 2, 3, 1} = {1, 2, 3}. Count distinct elements only.',
      'Cardinality counts top-level elements. In {2, {2}, {{2}}} there are three elements: a number, a set, and a set of a set.',
      'The empty set has zero elements, but {∅} has one element (the empty set itself).',
    ],
  },
  templates: [
    {
      id: 'membership',
      generate() {
        if (Math.random() < 0.5) {
          // roster with a nested-set trap
          const A = randSubset(NUMS, 3, 5)
          const k = choice(NUMS)
          const nested = Math.random() < 0.6
          const els = shuffle([...A.map(String), ...(nested ? [`{${k}}`] : []), ...(Math.random() < 0.3 ? ['cat'] : [])])
          const cases = [
            { latex: String(choice(A)), yes: true, why: 'it is listed as an element' },
            {
              latex: String(choice(NUMS.filter(n => !A.includes(n) && n !== k))),
              yes: false,
              why: 'it is not one of the listed elements',
            },
          ]
          if (nested) {
            cases.push({ latex: `\\{${k}\\}`, yes: true, why: `the set {${k}} is listed as an element, braces and all` })
            cases.push({
              latex: String(k),
              yes: A.includes(k),
              why: A.includes(k)
                ? `${k} itself is listed`
                : `only the set {${k}} is listed; the number ${k} on its own is not an element`,
            })
          } else {
            const j = choice(A)
            cases.push({ latex: `\\{${j}\\}`, yes: false, why: `{${j}} is a set, and the list contains the number ${j}, not the set {${j}}` })
          }
          const c = choice(cases)
          return {
            ask: 'Element or not?',
            text: `A = {${els.join(', ')}}.`,
            latex: `\\text{Is } ${c.latex} \\in A?`,
            answer: yn(c.yes),
            answerLatex: ynLatex(c.yes),
            placeholder: 'yes / no',
            hint: {
              latex: 'x \\in A \\iff x \\text{ is one of the listed elements}',
              text: `${c.yes ? 'Yes' : 'No'}: ${c.why}. Membership is literal: compare the object, braces included, against each listed element.`,
            },
          }
        }
        const D = choice(['Z', 'Z', 'N', 'Q', 'R'])
        const cond = randCondition()
        const p = choice(PROBES)
        const inDomain = DOMAINS[D].has(p)
        const yes = inDomain && cond.test(p.v)
        return {
          ask: 'Element or not?',
          latex: `\\text{Is } ${p.latex} \\in ${builder(D, cond)}?`,
          size: 'small',
          answer: yn(yes),
          answerLatex: ynLatex(yes),
          placeholder: 'yes / no',
          hint: {
            latex: '\\{x \\in S \\mid P(x)\\}: \\; x \\in S \\text{ and } P(x)',
            text: inDomain
              ? `The value is in the domain (${DOMAINS[D].name}), so check the condition ${cond.latex.replace(/\\/g, '')}: it is ${yes ? 'satisfied' : 'not satisfied'}.`
              : `Check the domain first: the value is not one of the ${DOMAINS[D].name}, so it cannot be in the set no matter what the condition says.`,
          },
        }
      },
    },
    {
      id: 'roster',
      generate() {
        if (Math.random() < 0.15) {
          const n = choice([4, 9, 1, 2])
          return {
            ask: 'List the elements.',
            latex: `\\{x \\in \\mathbb{R} \\mid |x| = -${n}\\} = \\,?`,
            size: 'small',
            answer: '∅',
            answerLatex: '\\varnothing',
            accept: acceptSet([]),
            placeholder: 'e.g. {1, 2} or ∅',
            choices: [`{-${n}, ${n}}`, `{-${n}}`, `{${n}}`],
            hint: {
              latex: '|x| \\ge 0 \\text{ for every real } x',
              text: 'No real number has a negative absolute value, so nothing satisfies the condition. The set is empty: ∅.',
            },
          }
        }
        const D = choice(['Z', 'Z', 'Z', 'N'])
        const cond = randCondition()
        const els = rosterOf(cond, D)
        const lo = els[0]
        const hi = els[els.length - 1]
        const wrong = els.length
          ? [
              sortEls([...els, lo - 1]),
              sortEls([...els, hi + 1]),
              els.slice(1),
              els.filter(x => x >= 0),
              sortEls([...els, lo - 1, hi + 1]),
            ]
          : [[0], [1], [-1, 1]]
        return {
          ask: 'Rewrite by listing the elements.',
          latex: `${builder(D, cond)} = \\,?`,
          size: 'small',
          answer: setStr(els),
          answerLatex: setLatex(els),
          accept: acceptSet(els),
          placeholder: 'e.g. {-2, -1, 0, 1} or ∅',
          choices: wrong.map(setStr).filter(s => s !== setStr(els)),
          hint: {
            latex: cond.latex,
            text: `Walk through the ${DOMAINS[D].name} and keep the ones that satisfy the condition${
              D === 'N' ? ' (natural numbers start at 1)' : ''
            }. Strict inequalities leave the endpoints out.`,
          },
        }
      },
    },
    {
      id: 'cardinality',
      generate() {
        if (Math.random() < 0.3) {
          const lo = randInt(-5, 2)
          const hi = lo + randInt(2, 7)
          const leftStrict = Math.random() < 0.5
          const rightStrict = Math.random() < 0.5
          const from = leftStrict ? lo + 1 : lo
          const to = rightStrict ? hi - 1 : hi
          const count = Math.max(0, to - from + 1)
          return {
            ask: 'How many elements?',
            latex: `\\left|\\{x \\in \\mathbb{Z} \\mid ${lo} ${leftStrict ? '<' : '\\le'} x ${
              rightStrict ? '<' : '\\le'
            } ${hi}\\}\\right| = \\,?`,
            size: 'small',
            answer: count,
            hint: {
              latex: '|S| = \\text{number of elements}',
              text: `List the integers from ${from} to ${to}: strict inequalities drop an endpoint, ≤ keeps it. That is ${count} integers.`,
            },
            distractors: [hi - lo, hi - lo + 1, count + 1, count - 1],
          }
        }
        const base = randSubset(NUMS, 2, 4)
        const items = [...new Set(
          base.map(n =>
            choice([`${n}`, `${n}`, `\\{${n}\\}`, `\\{\\{${n}\\}\\}`, `\\{${n}, ${n + 1}\\}`, '\\varnothing']),
          ),
        )]
        const withDup = Math.random() < 0.4 ? [...items, choice(items)] : items
        const shown = shuffle(withDup)
        const answer = items.length
        const leaves = shown.join('').replace(/[^0-9]/g, '').length
        return {
          ask: 'How many elements?',
          latex: `\\left|\\{${shown.join(', ')}\\}\\right| = \\,?`,
          size: 'small',
          answer,
          hint: {
            latex: '|\\{2, \\{2\\}, \\{\\{2\\}\\}\\}| = 3',
            text: 'Count top-level elements only: each outer comma-separated item is one element, whether it is a number, a set, or ∅. Repeats count once.',
          },
          distractors: [shown.length, leaves, answer + 1, answer - 1],
        }
      },
    },
  ],
}
