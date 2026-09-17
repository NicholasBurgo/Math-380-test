import { choice, shuffle } from '../../engine/rand.js'
import { setStr, setLatex, randSubset, acceptSet, sortEls, yn, ynLatex } from './util.js'

const POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const union = (X, Y) => sortEls([...new Set([...X, ...Y])])
const inter = (X, Y) => X.filter(x => Y.includes(x))
const diff = (X, Y) => X.filter(x => !Y.includes(x))

// Expressions over A, B (and sometimes C) inside U.
const EXPRS = [
  { latex: 'A \\cup B', f: s => union(s.A, s.B), how: 'union: everything in A or in B, listed once' },
  { latex: 'A \\cap B', f: s => inter(s.A, s.B), how: 'intersection: only what A and B share' },
  { latex: 'A - B', f: s => diff(s.A, s.B), how: 'difference: start from A and throw out anything that is also in B' },
  { latex: 'B - A', f: s => diff(s.B, s.A), how: 'difference: start from B and throw out anything that is also in A' },
  { latex: '\\overline{A}', f: s => diff(s.U, s.A), how: 'complement: everything in U that is not in A' },
  { latex: '\\overline{B}', f: s => diff(s.U, s.B), how: 'complement: everything in U that is not in B' },
  { latex: '\\overline{U}', f: s => [], how: 'complement of the universe: nothing is left, so ∅' },
  { latex: '\\overline{A \\cup B}', f: s => diff(s.U, union(s.A, s.B)), how: 'form A ∪ B first, then take everything in U outside it' },
  { latex: '\\overline{A} \\cap B', f: s => inter(diff(s.U, s.A), s.B), how: 'complement A first (everything in U not in A), then keep what is also in B' },
  { latex: 'A \\cap \\overline{B}', f: s => inter(s.A, diff(s.U, s.B)), how: 'complement B first, then keep what is also in A: this is A − B in disguise' },
  { latex: 'A - (A \\cap B)', f: s => diff(s.A, inter(s.A, s.B)), how: 'inside-out: find A ∩ B, then remove it from A' },
  { latex: '(A \\cup B) - (A \\cap B)', f: s => diff(union(s.A, s.B), inter(s.A, s.B)), how: 'union minus intersection: the elements in exactly one of the two sets' },
  { latex: '(A \\cap C) - B', f: s => diff(inter(s.A, s.C), s.B), needsC: true, how: 'inside-out: A ∩ C first, then throw out anything in B' },
  { latex: '(A \\cup B) \\cap \\overline{C}', f: s => inter(union(s.A, s.B), diff(s.U, s.C)), needsC: true, how: 'A ∪ B first, complement C, then intersect' },
  { latex: 'A \\cap B \\cap C', f: s => inter(inter(s.A, s.B), s.C), needsC: true, how: 'only elements in all three sets survive' },
  { latex: 'A \\cup (B \\cap C)', f: s => union(s.A, inter(s.B, s.C)), needsC: true, how: 'parentheses first: B ∩ C, then union with A' },
  { latex: '(A \\cup B) \\cap C', f: s => inter(union(s.A, s.B), s.C), needsC: true, how: 'parentheses first: A ∪ B, then keep only what is also in C' },
]

function scene(withC) {
  const U = randSubset(POOL, 6, 7)
  const A = randSubset(U, 2, 4)
  const B = randSubset(U, 2, 4)
  const C = withC ? randSubset(U, 2, 4) : null
  return { U, A, B, C }
}

const sceneText = s =>
  `U = ${setStr(s.U)}, A = ${setStr(s.A)}, B = ${setStr(s.B)}${s.C ? `, C = ${setStr(s.C)}` : ''}.`

export default {
  id: 'set-ops',
  name: 'Set operations',
  description: '§1.3: union, intersection, difference, complement, disjoint sets. HW 22, 24, 26, 28, 30.',
  learn: {
    formulas: [
      { label: 'Union: in A or B (or both)', latex: 'A \\cup B = \\{x \\in U \\mid x \\in A \\text{ or } x \\in B\\}' },
      { label: 'Intersection: in both', latex: 'A \\cap B = \\{x \\in U \\mid x \\in A \\text{ and } x \\in B\\}' },
      { label: 'Difference: in A but not B', latex: 'A - B = \\{x \\in A \\mid x \\notin B\\}' },
      { label: 'Complement: in U but not A', latex: '\\overline{A} = U - A' },
      { label: 'Disjoint', latex: 'A \\cap B = \\varnothing' },
      { label: 'Handy identity', latex: 'A - B = A \\cap \\overline{B}' },
    ],
    how: [
      'Work inside-out: evaluate parentheses and complements first, then the outer operation.',
      'Union collects; intersection filters; difference A − B keeps the A elements and deletes anything that also sits in B.',
      'Complement needs the universal set: bar means "everything in U except these". The complement of U itself is ∅.',
      'A − B and B − A are different sets: the first lives inside A, the second inside B.',
      'Disjoint means no shared element at all. Check every element of the smaller set against the other.',
      'Counting: |A − B| = |A| − |A ∩ B|, and |A ∪ B| = |A| + |B| − |A ∩ B|.',
    ],
  },
  templates: [
    {
      id: 'compute',
      generate() {
        const e = choice(EXPRS)
        const s = scene(!!e.needsC)
        const ans = e.f(s)
        const others = shuffle(EXPRS.filter(x => x !== e && (!x.needsC || s.C)))
          .map(x => x.f(s))
          .map(setStr)
          .filter(str => str !== setStr(ans))
        return {
          ask: 'Compute the set.',
          text: sceneText(s),
          latex: `${e.latex} = \\,?`,
          answer: setStr(ans),
          answerLatex: setLatex(ans),
          accept: acceptSet(ans),
          placeholder: 'e.g. {1, 3, 9} or ∅',
          choices: [...new Set(others)].slice(0, 3),
          hint: {
            latex: e.latex,
            text: `${e.how.charAt(0).toUpperCase() + e.how.slice(1)}.`,
          },
        }
      },
    },
    {
      id: 'count',
      generate() {
        const s = scene(false)
        const both = inter(s.A, s.B).length
        const asks = [
          { latex: '|A - B|', v: s.A.length - both, how: '|A − B| = |A| − |A ∩ B|: count A, subtract the shared elements' },
          { latex: '|B - A|', v: s.B.length - both, how: '|B − A| = |B| − |A ∩ B|: count B, subtract the shared elements' },
          { latex: '|A \\cup B|', v: s.A.length + s.B.length - both, how: '|A ∪ B| = |A| + |B| − |A ∩ B|: shared elements are counted once' },
          { latex: '|A \\cap B|', v: both, how: 'count only the elements that appear in both lists' },
          { latex: '|\\overline{A}|', v: s.U.length - s.A.length, how: '|U| − |A|: everything in U that is not in A' },
          { latex: '|\\overline{A \\cup B}|', v: s.U.length - (s.A.length + s.B.length - both), how: '|U| − |A ∪ B|' },
        ]
        const a = choice(asks)
        return {
          ask: 'How many elements?',
          text: sceneText(s),
          latex: `${a.latex} = \\,?`,
          answer: a.v,
          hint: { latex: a.latex, text: a.how + '.' },
          distractors: [s.A.length, s.B.length, s.A.length + s.B.length, both, s.U.length - both],
        }
      },
    },
    {
      id: 'disjoint',
      generate() {
        const s = scene(false)
        if (Math.random() < 0.5) {
          // force a clean split half the time
          s.B = randSubset(diff(s.U, s.A), 1, 3)
        }
        const kind = choice(['AB', 'AB', 'A-notA', 'A-BminusA', 'A-AunionB'])
        const pairs = {
          AB: { latex: 'A \\text{ and } B', X: s.A, Y: s.B, why: 'list the shared elements; disjoint means the list is empty' },
          'A-notA': { latex: 'A \\text{ and } \\overline{A}', X: s.A, Y: diff(s.U, s.A), why: 'a set and its complement never share an element' },
          'A-BminusA': { latex: 'A \\text{ and } B - A', X: s.A, Y: diff(s.B, s.A), why: 'B − A has had every element of A removed, so it cannot overlap A' },
          'A-AunionB': { latex: 'A \\text{ and } A \\cup B', X: s.A, Y: union(s.A, s.B), why: 'A sits inside A ∪ B, so they share all of A' },
        }
        const p = pairs[kind]
        const yes = inter(p.X, p.Y).length === 0
        return {
          ask: 'Disjoint?',
          text: sceneText(s),
          latex: `\\text{Are } ${p.latex} \\text{ disjoint?}`,
          size: 'small',
          answer: yn(yes),
          answerLatex: ynLatex(yes),
          placeholder: 'yes / no',
          hint: {
            latex: 'A \\cap B = \\varnothing',
            text: `${yes ? 'Yes' : 'No'}: ${p.why}.`,
          },
        }
      },
    },
  ],
}
