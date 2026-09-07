import { randInt, choice } from '../../engine/rand.js'
import { fmt, pct, probs, tolFor } from './util.js'

// Section 2.3 textbook exercises (19, 30, 23, 32, 33): independence, on the
// book's setups with fresh numbers. About one rep in four uses the book's
// own numbers so an answer can be checked against the homework.

const BOOK = () => Math.random() < 0.25
const INDEP = 'P(A_1 \\cap A_2) = P(A_1)\\,P(A_2)'
const fmtSmall = x => String(parseFloat(x.toFixed(7)))
const yesNo = yes => ({
  answer: yes ? 'yes' : 'no',
  answerLatex: `\\text{${yes ? 'yes' : 'no'}}`,
  placeholder: 'yes / no',
})

// Part of the combined 'Chapter 2 exercises' topic (see hw-ch2.js).
export default {
  learn: {
    formulas: [
      { label: 'Independent', latex: INDEP },
      { label: 'Equivalent test', latex: 'P(A_2 \\mid A_1) = P(A_2)' },
      {
        label: 'Overlap from the union',
        latex: 'P(A_1 \\cap A_2) = P(A_1) + P(A_2) - P(A_1 \\cup A_2)',
      },
      { label: 'Multiplication rule', latex: 'P(A \\cap B) = P(A)\\,P(B \\mid A)' },
      { label: 'Mutually exclusive', latex: 'P(A_1 \\cap A_2) = 0' },
    ],
    how: [
      'Exercise 19: get the overlap from the addition rule first, then compare it with P(A1) times P(A2). Equal means independent.',
      'Exercise 23: "if copper is high, 70% mint" is P(mint | copper). Multiply by P(copper) for the joint. The reverse conditional divides that joint by P(mint).',
      'Exercise 30: "during the next storm" already assumes a storm, so the 5% storm chance is not used. Chain the rest: P(hit | storm) times P(damage | hit).',
      'Exercise 32: mutually exclusive gives overlap 0, but independence would need overlap P(A1)P(A2) > 0. Contradiction, so not independent.',
      'Exercise 33: independence gives overlap P(A1)P(A2) > 0, so the overlap is not empty. Not mutually exclusive.',
    ],
  },
  templates: [
    {
      id: 'ex19',
      generate() {
        let a, b, both
        if (BOOK()) [a, b, both] = [60, 40, 20]
        else {
          a = 10 * randInt(2, 8)
          b = 10 * randInt(2, 8)
          const target = (a * b) / 100
          if (Math.random() < 0.5) both = target
          else {
            const options = [-15, -10, -5, 5, 10, 15]
              .map(d => target + d)
              .filter(v => v >= 5 && v <= Math.min(a, b) && v >= a + b - 95)
            both = choice(options)
          }
        }
        const un = a + b - both
        const target = (a * b) / 100
        const q = choice([
          {
            latex: '\\text{Are } A_1 \\text{ and } A_2 \\text{ independent?}',
            ...yesNo(both === target),
          },
          {
            latex: 'P(A_1 \\cap A_2) = \\,?',
            answer: pct(both),
            answerLatex: `${fmt(pct(a))} + ${fmt(pct(b))} - ${fmt(pct(un))} = ${fmt(pct(both))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: probs(pct(target), pct(un), pct(a)),
          },
          {
            latex: '\\text{Independent iff } P(A_1 \\cap A_2) = \\,?',
            answer: pct(target),
            answerLatex: `${fmt(pct(a))} \\times ${fmt(pct(b))} = ${fmt(pct(target))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: probs(pct(both), pct(un), pct(a + b)),
          },
        ])
        return {
          ask: 'Exercise 19: test for independence.',
          text: `P(A1) = ${fmt(pct(a))}, P(A2) = ${fmt(pct(b))}, and P(A1 ∪ A2) = ${fmt(pct(un))}.`,
          ...q,
          hint: {
            latex:
              'P(A_1 \\cap A_2) = P(A_1) + P(A_2) - P(A_1 \\cup A_2) \\;\\overset{?}{=}\\; P(A_1)\\,P(A_2)',
            text: 'Get the overlap from the addition rule, then compare it with P(A1) times P(A2). Equal means independent. Anything else means not.',
          },
        }
      },
    },
    {
      id: 'ex30',
      generate() {
        let dmg, storm, hit
        if (BOOK()) [dmg, storm, hit] = [50, 5, 0.1]
        else {
          dmg = choice([40, 50, 60, 75])
          storm = choice([3, 5, 8, 10])
          hit = choice([0.1, 0.2, 0.5, 1])
        }
        const next = pct(hit) * pct(dmg)
        const day = pct(storm) * pct(hit) * pct(dmg)
        const q = choice([
          {
            latex: 'P(\\text{hit and damage during the next storm}) = \\,?',
            answer: next,
            answerLatex: `${fmtSmall(pct(hit))} \\times ${fmt(pct(dmg))} = ${fmtSmall(next)}`,
            distractors: [day, pct(hit), pct(storm) * pct(hit)],
          },
          {
            latex: 'P(\\text{storm, hit, and damage on a given summer day}) = \\,?',
            answer: day,
            answerLatex: `${fmt(pct(storm))} \\times ${fmtSmall(pct(hit))} \\times ${fmt(pct(dmg))} = ${fmtSmall(day)}`,
            distractors: [next, pct(storm) * pct(hit), pct(storm) * pct(dmg)],
          },
        ])
        return {
          ask: 'Exercise 30: electrical storm. Chain the conditionals.',
          text: `There is a ${dmg}% chance of hard drive damage if the power line is hit during an electrical storm, a ${storm}% chance of an electrical storm on any given summer day, and a ${hit}% chance the line is hit during a storm.`,
          ...q,
          placeholder: 'decimal',
          tolerance: tolFor(q.answer),
          hint: {
            latex: 'P(H \\cap D \\mid S) = P(H \\mid S)\\,P(D \\mid H)',
            text: '"During the next storm" already assumes a storm, so the storm chance is not used there. Multiply P(hit | storm) by P(damage | hit). For "on a given day", multiply by P(storm) as well.',
          },
        }
      },
    },
    {
      id: 'ex23',
      generate() {
        const kind = choice(['joint', 'reverse', 'indep'])
        let cu, mint, cond
        if (BOOK()) [cu, mint, cond] = [30, 23, 70]
        else {
          cu = choice([20, 30, 40, 50])
          cond = choice([60, 70, 80, 90])
          const joint = (cu * cond) / 100
          mint = kind === 'indep' && Math.random() < 0.5 ? cond : joint + choice([2, 3, 5, 8, 10])
        }
        const joint = (cu * cond) / 100
        const q = {
          joint: {
            latex: 'P(\\text{high copper and mint}) = \\,?',
            answer: pct(joint),
            answerLatex: `${fmt(pct(cu))} \\times ${fmt(pct(cond))} = ${fmt(pct(joint))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: probs(pct(cu) * pct(mint), pct(cond), pct(cu), pct(mint)),
          },
          reverse: {
            latex: 'P(\\text{high copper} \\mid \\text{mint}) = \\,?',
            answer: joint / mint,
            answerLatex: `\\frac{${fmt(pct(joint))}}{${fmt(pct(mint))}} \\approx ${fmt(joint / mint, 3)}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: probs(pct(cond), pct(joint), pct(cu), pct(mint)),
          },
          indep: {
            latex: '\\text{Are high copper and mint independent?}',
            ...yesNo(mint === cond),
          },
        }[kind]
        return {
          ask: 'Exercise 23: geobotanical prospecting. Multiplication rule.',
          text: `In a given region there is a ${cu}% chance that the soil has a high copper content and a ${mint}% chance that the mint is present. If the copper content is high, there is a ${cond}% chance that the mint is present.`,
          ...q,
          hint: {
            latex: 'P(C \\cap M) = P(C)\\,P(M \\mid C), \\quad P(C \\mid M) = \\dfrac{P(C \\cap M)}{P(M)}',
            text: '"If copper is high, X% mint" is P(mint | copper). Times P(copper) gives the joint. Reverse conditional: joint over P(mint). Independent only if P(mint | copper) equals P(mint).',
          },
        }
      },
    },
    {
      id: 'ex32',
      generate() {
        const a = 10 * randInt(1, 5)
        let b = 10 * randInt(1, 5)
        if (a + b === 100) b -= 10
        const prod = (a * b) / 100
        const q = choice([
          {
            latex: 'P(A_1 \\cap A_2) = \\,?',
            answer: 0,
            answerLatex: '0',
            placeholder: 'decimal',
            distractors: [pct(prod), pct(a + b), pct(a)],
          },
          {
            latex: 'P(A_1)\\,P(A_2) = \\,?',
            answer: pct(prod),
            answerLatex: `${fmt(pct(a))} \\times ${fmt(pct(b))} = ${fmt(pct(prod))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: [0, pct(a + b), pct(a)],
          },
          {
            latex: '\\text{Are } A_1 \\text{ and } A_2 \\text{ independent?}',
            ...yesNo(false),
          },
          {
            latex: 'P(A_1 \\cup A_2) = \\,?',
            answer: pct(a + b),
            answerLatex: `${fmt(pct(a))} + ${fmt(pct(b))} = ${fmt(pct(a + b))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: [pct(a + b - prod), pct(prod), pct(a)],
          },
        ])
        return {
          ask: 'Exercise 32: mutually exclusive events with positive probability.',
          text: `A1 and A2 are mutually exclusive, with P(A1) = ${fmt(pct(a))} and P(A2) = ${fmt(pct(b))}.`,
          ...q,
          hint: {
            latex: 'P(A_1 \\cap A_2) = 0 \\ne P(A_1)\\,P(A_2) > 0',
            text: 'Mutually exclusive means the overlap has probability 0. Independence would need the overlap to equal P(A1)P(A2), which is positive. Both cannot hold.',
          },
        }
      },
    },
    {
      id: 'ex33',
      generate() {
        const a = 10 * randInt(1, 5)
        const b = 10 * randInt(1, 5)
        const prod = (a * b) / 100
        const q = choice([
          {
            latex: 'P(A_1 \\cap A_2) = \\,?',
            answer: pct(prod),
            answerLatex: `${fmt(pct(a))} \\times ${fmt(pct(b))} = ${fmt(pct(prod))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: [0, pct(a + b), pct(a)],
          },
          {
            latex: '\\text{Are } A_1 \\text{ and } A_2 \\text{ mutually exclusive?}',
            ...yesNo(false),
          },
          {
            latex: 'P(A_1 \\cup A_2) = \\,?',
            answer: pct(a + b - prod),
            answerLatex: `${fmt(pct(a))} + ${fmt(pct(b))} - ${fmt(pct(prod))} = ${fmt(pct(a + b - prod))}`,
            placeholder: 'decimal',
            tolerance: 0.005,
            distractors: [pct(a + b), pct(prod), pct(a)],
          },
        ])
        return {
          ask: 'Exercise 33: independent events with positive probability.',
          text: `A1 and A2 are independent, with P(A1) = ${fmt(pct(a))} and P(A2) = ${fmt(pct(b))}.`,
          ...q,
          hint: {
            latex: 'P(A_1 \\cap A_2) = P(A_1)\\,P(A_2) > 0 \\;\\Rightarrow\\; A_1 \\cap A_2 \\ne \\varnothing',
            text: 'Independence makes the overlap P(A1)P(A2), which is positive here. A positive-probability overlap is not empty, so the events are not mutually exclusive.',
          },
        }
      },
    },
  ],
}
