import { randInt, choice } from '../../engine/rand.js'
import { withOptions } from './util.js'

const BANK = [
  { s: "Mary's car is not green.", ok: "Mary's car is green.", bad: ["Mary's car is red.", "It is not the case that Mary's car is not green.", "Mary's car is not red."], why: 'negating a "not" just removes it' },
  { s: 'The solution to the equation 9x + 4 = 12 is negative.', ok: 'The solution to the equation 9x + 4 = 12 is greater than or equal to 0.', bad: ['The solution to the equation 9x + 4 = 12 is positive.', 'The solution to the equation 9x + 4 = 12 is 0.', 'It is not the case that the solution to 9x + 4 = 12 is negative.'], why: 'not negative means ≥ 0; "positive" wrongly drops the case 0' },
  { s: "All of the professors at Southeastern have Ph.D.'s.", ok: "At least one professor at Southeastern does not have a Ph.D.", bad: ["No professor at Southeastern has a Ph.D.", "All of the professors at Southeastern lack Ph.D.'s.", "At least one professor at Southeastern has a Ph.D."], why: 'the negation of "all have" is "at least one does not have", not "none have"' },
  { s: 'Some students like math.', ok: 'No student likes math.', bad: ['Some students do not like math.', 'All students like math.', 'Most students do not like math.'], why: 'the negation of "some do" is "none do"' },
  { s: 'The integer n is even.', ok: 'The integer n is odd.', bad: ['The integer n is not odd.', 'The integer n is zero.', 'The integer n is positive.'], why: 'an integer that is not even is odd' },
  { s: 'Every prime number is odd.', ok: 'Some prime number is even.', bad: ['No prime number is odd.', 'Every prime number is even.', 'Some prime number is odd.'], why: '"every ... is odd" fails as soon as one prime is not odd, i.e. is even' },
  { s: 'There is a real number x such that x² < 0.', ok: 'For every real number x, x² ≥ 0.', bad: ['For every real number x, x² > 0.', 'There is a real number x such that x² ≥ 0.', 'There is no real number x such that x² > 0.'], why: '"there is an x with x² < 0" is denied by "every x has x² ≥ 0"' },
  { s: "Mary's dog is at least 3 years old.", ok: "Mary's dog is less than 3 years old.", bad: ["Mary's dog is at most 3 years old.", "Mary's dog is more than 3 years old.", "Mary's dog is not 3 years old."], why: 'the opposite of "at least 3" (≥ 3) is "less than 3" (< 3)' },
  { s: 'The number 10 is a multiple of 4.', ok: 'The number 10 is not a multiple of 4.', bad: ['The number 10 is a multiple of 5.', 'The number 4 is not a multiple of 10.', 'The number 10 is odd.'], why: 'deny exactly the claim made, nothing more' },
  { s: 'Everyone in the class passed.', ok: 'Someone in the class did not pass.', bad: ['Everyone in the class failed.', 'No one in the class passed.', 'Someone in the class passed.'], why: 'one non-passer is enough to make "everyone passed" false' },
  { s: 'No cat can fly.', ok: 'Some cat can fly.', bad: ['Every cat can fly.', 'Some cat cannot fly.', 'No cat can walk.'], why: '"no cat can" is denied by a single flying cat' },
  { s: 'The function f is continuous at 0.', ok: 'The function f is not continuous at 0.', bad: ['The function f is continuous everywhere except 0.', 'The function f is not continuous anywhere.', 'The function f is differentiable at 0.'], why: 'deny exactly the claim: not continuous at 0' },
  { s: 'The real number r is at most √2.', ok: 'The real number r is greater than √2.', bad: ['The real number r is at least √2.', 'The real number r is less than √2.', 'The real number r is not √2.'], why: 'the opposite of "at most" (≤) is "greater than" (>)' },
  { s: 'The absolute value of the real number a is less than 3.', ok: 'The absolute value of the real number a is at least 3.', bad: ['The absolute value of the real number a is at most 3.', 'The absolute value of the real number a is greater than 3.', 'The absolute value of the real number a is not 3.'], why: 'the opposite of "less than 3" (< 3) is "at least 3" (≥ 3): the boundary 3 changes sides' },
  { s: 'Two angles of the triangle are 45°.', ok: 'At most one angle of the triangle is 45°.', bad: ['No angle of the triangle is 45°.', 'All three angles of the triangle are 45°.', 'Exactly one angle of the triangle is 45°.'], why: 'the opposite of "two (or more)" is "one or none", i.e. at most one' },
  { s: 'The area of the circle is at least 9π.', ok: 'The area of the circle is less than 9π.', bad: ['The area of the circle is at most 9π.', 'The area of the circle is more than 9π.', 'The area of the circle is not 9π.'], why: 'the opposite of "at least" (≥) is "less than" (<)' },
  { s: 'Two sides of the triangle have the same length.', ok: 'The sides of the triangle have different lengths.', bad: ['All three sides of the triangle have the same length.', 'Two sides of the triangle have different lengths.', 'At most two sides of the triangle have the same length.'], why: 'if no two sides match, all three lengths are different; "two sides differ" is not enough, since an isosceles triangle has that too' },
  { s: 'The point P in the plane lies outside of the circle C.', ok: 'The point P in the plane lies on or inside the circle C.', bad: ['The point P in the plane lies inside the circle C.', 'The point P in the plane lies on the circle C.', 'The point P does not lie in the plane.'], why: 'not outside leaves two cases, on the circle or inside it; "inside" alone drops the boundary' },
  { s: '√2 is a rational number.', ok: '√2 is an irrational number.', bad: ['√2 is an integer.', '√2 is not a real number.', '√2 is a negative number.'], why: 'a real number that is not rational is irrational' },
  { s: '0 is not a negative integer.', ok: '0 is a negative integer.', bad: ['0 is a positive integer.', '0 is not a positive integer.', '0 is not an integer.'], why: 'negating a "not" just removes it (the negation of a true statement is false, and that is fine)' },
  { s: '111 is a prime number.', ok: '111 is not a prime number.', bad: ['111 is an even number.', '112 is a prime number.', '111 is not an odd number.'], why: 'deny exactly the claim made, nothing more' },
  { s: 'At least two of my library books are overdue.', ok: 'At most one of my library books is overdue.', bad: ['At least two of my library books are not overdue.', 'None of my library books are overdue.', 'At most two of my library books are overdue.'], why: 'the opposite of "at least two" (≥ 2) is "at most one" (≤ 1)' },
  { s: 'No one expected that to happen.', ok: 'Someone expected that to happen.', bad: ['Everyone expected that to happen.', 'No one expected that not to happen.', 'Someone did not expect that to happen.'], why: '"no one did" is denied by a single person who did' },
  { s: 'The real number x is positive.', ok: 'The real number x is less than or equal to 0.', bad: ['The real number x is negative.', 'The real number x is 0.', 'The real number x is greater than or equal to 0.'], why: 'not positive means ≤ 0; "negative" wrongly drops the case 0' },
  { s: 'Every student in the class owns a laptop.', ok: 'Some student in the class does not own a laptop.', bad: ['No student in the class owns a laptop.', 'Every student in the class does not own a laptop.', 'Some student in the class owns a laptop.'], why: 'one student without a laptop is enough to make "every student owns one" false' },
  { s: 'Some integers are perfect squares.', ok: 'No integer is a perfect square.', bad: ['Some integers are not perfect squares.', 'All integers are perfect squares.', 'Not all integers are perfect squares.'], why: 'the negation of "some are" is "none are"' },
  { s: 'None of the doors are locked.', ok: 'At least one of the doors is locked.', bad: ['All of the doors are locked.', 'At least one of the doors is not locked.', 'None of the doors are unlocked.'], why: '"none are locked" is denied by a single locked door' },
  { s: 'The set A is empty.', ok: 'The set A has at least one element.', bad: ['The set A has exactly one element.', 'The set A is infinite.', 'The set A has no elements.'], why: 'not empty means |A| ≥ 1: at least one element, with no upper limit' },
  { s: 'The integer k is greater than 7.', ok: 'The integer k is at most 7.', bad: ['The integer k is less than 7.', 'The integer k is at least 7.', 'The integer k is not 7.'], why: 'the opposite of "> 7" is "≤ 7"; "less than 7" wrongly drops the case 7' },
  { s: 'The sets A and B are disjoint.', ok: 'The sets A and B have at least one element in common.', bad: ['The sets A and B are equal.', 'A is a subset of B.', 'The sets A and B have exactly one element in common.'], why: 'disjoint means A ∩ B = ∅, so the negation is A ∩ B ≠ ∅: at least one shared element' },
  { s: 'A is a subset of B.', ok: 'Some element of A is not in B.', bad: ['No element of A is in B.', 'B is a subset of A.', 'Some element of B is not in A.'], why: 'A ⊆ B says every element of A is in B; one element of A outside B breaks it' },
]

// Inequality statements and their negations (typed).
const REL = {
  '<': { neg: '≥', latex: '<' },
  '≤': { neg: '>', latex: '\\le' },
  '>': { neg: '≤', latex: '>' },
  '≥': { neg: '<', latex: '\\ge' },
  '=': { neg: '≠', latex: '=' },
  '≠': { neg: '=', latex: '\\ne' },
}
const LATEX_OF = { '<': '<', '≤': '\\le', '>': '>', '≥': '\\ge', '=': '=', '≠': '\\ne' }

// "x >= 3", "x ≥ 3", "3 <= x", "x is at least 3", "x is nonnegative" -> "x≥3"
export function normIneq(raw) {
  let t = String(raw)
    .toLowerCase()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
  t = t
    .replace(/xisnonnegative/, 'x≥0')
    .replace(/xisnonpositive/, 'x≤0')
    .replace(/xispositive/, 'x>0')
    .replace(/xisnegative/, 'x<0')
    .replace(/xisatleast/, 'x≥')
    .replace(/xisatmost/, 'x≤')
    .replace(/xismorethan/, 'x>')
    .replace(/xisgreaterthan(orequalto)?/, (m, eq) => (eq ? 'x≥' : 'x>'))
    .replace(/xislessthan(orequalto)?/, (m, eq) => (eq ? 'x≤' : 'x<'))
    .replace(/xisnotequalto|xisnot|x=\/=/, 'x≠')
    .replace(/xisequalto|xequals|xis(?=-?\d)/, 'x=')
  t = t.replace(/>=|=>/g, '≥').replace(/<=|=</g, '≤').replace(/!=|<>|\/=/g, '≠')
  const m = t.match(/^(-?\d+)(≥|≤|>|<|=|≠)x$/)
  if (m) {
    const flip = { '≥': '≤', '≤': '≥', '>': '<', '<': '>', '=': '=', '≠': '≠' }
    return `x${flip[m[2]]}${m[1]}`
  }
  return t
}

const SUBJECTS = [
  { who: 'The class', verb: 'has', noun: 'students' },
  { who: 'The box', verb: 'contains', noun: 'apples' },
  { who: 'Sam', verb: 'owns', noun: 'books' },
  { who: 'The recipe', verb: 'needs', noun: 'eggs' },
  { who: 'The team', verb: 'won', noun: 'games' },
  { who: 'The library', verb: 'ordered', noun: 'copies' },
  { who: 'Maria', verb: 'solved', noun: 'problems' },
  { who: 'The garden', verb: 'has', noun: 'rose bushes' },
  { who: 'The exam', verb: 'has', noun: 'questions' },
  { who: 'The bus', verb: 'holds', noun: 'passengers' },
]
const QUANT = {
  'at least': 'fewer than',
  'more than': 'at most',
  'at most': 'more than',
  'fewer than': 'at least',
}

export default {
  id: 'negation',
  name: 'Negations',
  description: '§2.2: simplified negations, negating inequalities and quantities. HW 12, 14a-c.',
  learn: {
    formulas: [
      { label: 'Negation of P', latex: '\\sim P \\quad (\\text{``not } P\\text{"})' },
      { label: 'Truth table', latex: '\\begin{array}{c|c} P & \\sim P \\\\ \\hline T & F \\\\ F & T \\end{array}' },
      { label: 'Inequalities flip and gain/lose equality', latex: '\\sim(x < a) \\text{ is } x \\ge a, \\qquad \\sim(x = a) \\text{ is } x \\ne a' },
      { label: 'Quantities', latex: '\\sim(\\text{at least } k) \\text{ is } \\text{fewer than } k' },
    ],
    how: [
      'Never answer "It is not the case that...". Push the "not" all the way in and say what actually happens instead.',
      'Numbers: the opposite of negative is "≥ 0", not positive. The opposite of "< a" is "≥ a": the boundary switches sides.',
      'Quantities: at least k ↔ fewer than k; more than k ↔ at most k.',
      '"All A are B" is denied by one exception: "some A is not B". "Some A is B" is denied by "no A is B".',
      'A sentence that already has "not" in it is negated by removing the "not".',
    ],
  },
  templates: [
    {
      id: 'negate-english',
      generate() {
        const item = choice(BANK)
        return withOptions(
          {
            ask: 'Choose the (simplified) negation.',
            text: `"${item.s}"`,
            latex: '\\sim P',
            size: 'small',
            hint: {
              latex: '\\sim P',
              text: `Negation: "${item.ok}". Here ${item.why}. "It is not the case that..." is never accepted.`,
            },
          },
          item.ok,
          item.bad,
        )
      },
    },
    {
      id: 'negate-inequality',
      generate() {
        const a = randInt(-5, 9)
        const worded = Math.random() < 0.35
        let stmtLatex
        let text
        let rel
        let bound = a
        if (worded) {
          const w = choice([
            { s: 'x is negative', rel: '<', b: 0 },
            { s: 'x is positive', rel: '>', b: 0 },
            { s: 'x is nonnegative', rel: '≥', b: 0 },
            { s: `x is at least ${a}`, rel: '≥', b: a },
            { s: `x is at most ${a}`, rel: '≤', b: a },
            { s: `x is more than ${a}`, rel: '>', b: a },
            { s: `x is less than ${a}`, rel: '<', b: a },
          ])
          text = `"${w.s}."`
          rel = w.rel
          bound = w.b
          stmtLatex = `\\sim(x ${LATEX_OF[rel]} ${bound})`
        } else {
          rel = choice(Object.keys(REL))
          stmtLatex = `\\sim(x ${LATEX_OF[rel]} ${a})`
        }
        const neg = REL[rel].neg
        const ans = `x ${neg} ${bound}`
        const others = Object.keys(REL).filter(r => r !== neg && r !== rel)
        return {
          ask: 'Write the negation as an inequality.',
          text,
          latex: `${stmtLatex} \\;\\text{ is }\\; ?`,
          size: 'small',
          answer: ans,
          answerLatex: `x ${LATEX_OF[neg]} ${bound}`,
          accept: raw => normIneq(raw) === normIneq(ans),
          placeholder: 'e.g. x >= 3',
          choices: [`x ${rel} ${bound}`, ...others.map(r => `x ${r} ${bound}`)],
          hint: {
            latex: `\\sim(x ${LATEX_OF[rel]} ${bound}) \\;\\equiv\\; x ${LATEX_OF[neg]} ${bound}`,
            text: `The number line splits at ${bound}: whatever the statement claims, the negation claims the rest. ${
              rel === '=' || rel === '≠' ? 'Equality and inequality swap.' : `"${rel}" becomes "${neg}": the boundary point changes sides.`
            }`,
          },
        }
      },
    },
    {
      id: 'negate-quantity',
      generate() {
        const s = choice(SUBJECTS)
        const q = choice(Object.keys(QUANT))
        const k = choice([3, 5, 8, 10, 12, 15, 20, 25, 30, 50])
        const phrase = qq => `${s.who} ${s.verb} ${qq} ${k} ${s.noun}.`
        const ok = phrase(QUANT[q])
        const bad = Object.keys(QUANT)
          .filter(x => x !== QUANT[q] && x !== q)
          .map(phrase)
        bad.push(`${s.who} ${s.verb} exactly ${k} ${s.noun}.`)
        return withOptions(
          {
            ask: 'Choose the negation. Focus on the number.',
            text: `"${phrase(q)}"`,
            latex: `\\sim(\\text{${q} } ${k})`,
            size: 'small',
            hint: {
              latex: `\\sim(\\text{${q} } ${k}) \\;\\equiv\\; \\text{${QUANT[q]} } ${k}`,
              text: `Negation: "${ok}". "${q} ${k}" covers one side of ${k}; the negation is exactly the other side, so "${QUANT[q]} ${k}".`,
            },
          },
          ok,
          bad,
        )
      },
    },
  ],
}
