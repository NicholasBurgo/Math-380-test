import { choice, randInt } from '../../../engine/rand.js'
import { BOX, derivation, formula, num, probs, tolFor } from './util.js'
import { stack } from './continuous-pdf.js'

// §4.1: the uniform density is flat, f(x) = c on [A, B], and area 1 forces
// c = 1/(B − A) (the class notes write the ends as A and B). Every probability
// is then a length ratio.

const STORIES = [
  (a, b) => `A bus arrives at a time equally likely to be anywhere from ${a} to ${b} minutes after you reach the stop. X is the arrival time in minutes.`,
  (a, b) => `A pizza is delivered at a time equally likely to be anywhere from ${a} to ${b} minutes after the order. X is the delivery time.`,
  (a, b) => `A random number generator picks X uniformly from the interval [${a}, ${b}].`,
  (a, b) => `An elevator arrives at a time equally likely to be anywhere from ${a} to ${b} seconds after you press the button. X is that time.`,
  (a, b) => `A machine cuts a rod at a point equally likely to be anywhere from ${a} to ${b} cm from the left end. X is where it cuts.`,
  (a, b) => `A train's delay is equally likely to be any time from ${a} to ${b} minutes. X is the delay.`,
]

function scenario() {
  const a = choice([0, 0, 1, 2, 3, 5, 10])
  const b = a + choice([2, 4, 5, 8, 10, 20])
  return { a, b, w: b - a, text: choice(STORIES)(a, b) }
}

// A nice point strictly inside (a, b).
const inside = (a, w) => a + (w <= 2 ? choice([0.5, 1, 1.5]) : w <= 10 ? randInt(1, w - 1) : choice([2, 5, 8, 10, 12, 15, 18]))

const HEIGHT_HINT = {
  latex: '\\int_A^B c\\,dx = c(B - A) = 1 \\;\\Rightarrow\\; c = \\frac{1}{B-A}',
  text: 'The area under a flat line is a rectangle: height c times width B − A. Set it equal to 1.',
}

// derivation steps, each with the box to fill; the letters are A, B, c, x
// (a typed lowercase a or b means the same end)
const VARS = ['A', 'B', 'a', 'b', 'c', 'x']
const POINTS = [
  { A: 1, B: 4, c: 0.7, x: 2.5 },
  { A: -2, B: 3, c: 1.3, x: 0.4 },
  { A: 0.5, B: 6, c: 2, x: 5.2 },
].map(e => ({ ...e, a: e.A, b: e.B }))
const STEPS = [
  {
    lines: ['f(x) &= c, \\quad A \\le x \\le B', `\\int_A^B c\\,dx &= ${BOX}`],
    answer: 'c(B-A)',
    choices: ['c(A-B)', 'cB', 'c/(B-A)'],
    ask: 'Derive the uniform pdf. The area under f(x) = c: what goes in the box?',
    hint: { latex: '\\int_A^B c\\,dx = \\Big[cx\\Big]_A^B = cB - cA', text: 'c is a constant, so its antiderivative is cx. Top limit minus bottom limit.' },
  },
  {
    lines: ['\\int_A^B c\\,dx &= c(B - A) = 1', `c &= ${BOX}`],
    answer: '1/(B-A)',
    choices: ['B-A', '1/(A-B)', '1/B-1/A'],
    ask: 'Derive the uniform pdf. A pdf has area 1: what goes in the box?',
    hint: HEIGHT_HINT,
  },
  {
    lines: [`F(x) &= \\int_A^x \\frac{1}{B-A}\\,dt = ${BOX}`],
    answer: '(x-A)/(B-A)',
    choices: ['x/(B-A)', '(B-x)/(B-A)', '1/(B-A)'],
    ask: 'The uniform cdf on [A, B]: what goes in the box (for A ≤ x ≤ B)?',
    hint: { latex: '\\int_A^x \\frac{dt}{B-A} = \\frac{x - A}{B - A}', text: 'Integrate the flat height from the left end A up to x: the length x − A over the full length B − A.' },
  },
  {
    lines: [`E[X] &= \\int_A^B \\frac{x}{B-A}\\,dx = ${BOX}`],
    answer: '(A+B)/2',
    choices: ['(B-A)/2', '(A+B)/(B-A)', '(B^2-A^2)/2'],
    ask: 'The uniform mean: what goes in the box? (Simplify or not.)',
    hint: {
      latex: '\\int_A^B \\frac{x}{B-A}\\,dx = \\frac{B^2 - A^2}{2(B-A)} = \\frac{(B-A)(B+A)}{2(B-A)} = \\frac{A+B}{2}',
      text: 'Antiderivative x²/(2(B − A)), then factor B² − A² = (B − A)(B + A) and cancel.',
    },
  },
]

export default {
  id: 'uniform',
  name: 'Uniform distribution',
  description: '§4.1: f(x) = 1/(B − A) on [A, B]; find the pdf given A and B, then probabilities are lengths.',
  learn: {
    formulas: [
      { label: 'Uniform pdf on [A, B]', latex: 'f(x) = \\begin{cases} \\frac{1}{B-A} & A \\le x \\le B \\\\ 0 & \\text{otherwise} \\end{cases}' },
      { label: 'Deriving it: the rectangle has area 1', latex: '\\int_A^B c\\,dx = c(B - A) = 1 \\;\\Rightarrow\\; c = \\frac{1}{B-A}' },
      { label: 'Probability is a length ratio', latex: 'P(c < X < d) = \\frac{d - c}{B - A}, \\quad A \\le c \\le d \\le B' },
      { label: 'cdf', latex: 'F(x) = \\frac{x - A}{B - A}, \\quad A \\le x \\le B' },
      { label: 'Mean and variance', latex: 'E[X] = \\frac{A+B}{2}, \\qquad \\operatorname{Var}X = \\frac{(B-A)^2}{12}' },
    ],
    how: [
      'Uniform means every value in [A, B] is equally likely, so the density is flat: f(x) = c on [A, B] and 0 elsewhere.',
      'Find the pdf given A and B: draw the rectangle from A to B. Its area must be 1, so c(B − A) = 1 and c = 1/(B − A). On [1, 6] the height must be 1/5 (height 5 would give area 25).',
      'A probability is the length you want over the whole length. Clip to [A, B] first. On [1, 6], P(2 < X < 4) = 2/5 = 0.4.',
      'Endpoints do not matter: P(X = c) = 0, so < and ≤ give the same answer.',
      'Mean: the middle, (A + B)/2. By integration, ∫ x/(B − A) dx from A to B = (B² − A²)/(2(B − A)) = (A + B)/2.',
      'Variance: E[X²] = ∫ x²/(B − A) dx = (B³ − A³)/(3(B − A)); subtract the mean squared. It always simplifies to (B − A)²/12.',
    ],
  },
  templates: [
    {
      id: 'derive',
      generate() {
        const s = choice(STEPS)
        return formula({
          ask: s.ask,
          latex: derivation(s.lines),
          size: 'derivation',
          vars: VARS,
          points: POINTS,
          answer: s.answer,
          choices: s.choices,
          placeholder: 'formula in A, B, c, x',
          hint: s.hint,
        })
      },
    },
    {
      id: 'height',
      generate() {
        const { a, b, w, text } = scenario()
        const c = 1 / w
        const ask = choice(['c', 'c', 'inside', 'outside'])
        const cases = `f(x) = \\begin{cases} c & ${a} \\le x \\le ${b} \\\\ 0 & \\text{otherwise} \\end{cases}`
        const derived = `c(${b} - ${a}) = 1 \\;\\Rightarrow\\; c = \\tfrac{1}{${w}}`
        if (ask === 'c') {
          return {
            ask: 'Derive the uniform density: find the height c.',
            text,
            latex: stack(cases, 'c = \\,?'),
            size: 'small',
            answer: c,
            answerLatex: `${derived} = ${num(c)}`,
            placeholder: 'e.g. 1/10',
            tolerance: Math.max(1e-4, c * 0.005),
            hint: HEIGHT_HINT,
            distractors: [w, 1 / b, 1 / (w + 1), 1 / (a + b)].filter(v => Number.isFinite(v)),
          }
        }
        const x0 = ask === 'inside' ? inside(a, w) : choice([b + choice([1, 2, 5]), ...(a > 0 ? [Math.max(0, a - 1)] : [])])
        const ans = ask === 'inside' ? c : 0
        return {
          ask: 'Find the density at this point (find c first).',
          text,
          latex: stack(cases, `f(${x0}) = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex:
            ask === 'inside'
              ? `${derived}, \\quad f(${x0}) = ${num(c)}`
              : `${x0} \\text{ is outside } [${a}, ${b}], \\text{ so } f(${x0}) = 0`,
          placeholder: 'e.g. 0.1',
          tolerance: ans === 0 ? 1e-6 : Math.max(1e-4, c * 0.005),
          hint: {
            latex: HEIGHT_HINT.latex,
            text: 'The height is the same everywhere in [A, B] and 0 outside it. A density value is a height, not a probability.',
          },
          distractors: ask === 'inside' ? [w, 1 / b, (x0 - a) / w] : [c, 1 / b, 1],
        }
      },
    },
    {
      id: 'prob',
      generate() {
        const { a, b, w, text } = scenario()
        const lt = () => choice(['<', '\\le'])
        const kind = choice(['above', 'below', 'between', 'between', 'clip'])
        let latex
        let lo
        let hi
        let raw = null
        if (kind === 'above') {
          lo = inside(a, w)
          hi = b
          latex = `P(X ${choice(['>', '\\ge'])} ${lo})`
        } else if (kind === 'below') {
          lo = a
          hi = inside(a, w)
          latex = `P(X ${lt()} ${hi})`
        } else if (kind === 'between') {
          const u = inside(a, w)
          let v = inside(a, w)
          for (let k = 0; v === u && k < 20; k++) v = inside(a, w)
          if (v === u) v = b
          ;[lo, hi] = [Math.min(u, v), Math.max(u, v)]
          latex = `P(${lo} ${lt()} X ${lt()} ${hi})`
        } else if (Math.random() < 0.5 || a === 0) {
          // past the right end
          lo = inside(a, w)
          hi = b
          raw = [lo, b + choice([1, 2, 5])]
          latex = `P(${raw[0]} ${lt()} X ${lt()} ${raw[1]})`
        } else {
          // before the left end
          lo = a
          hi = inside(a, w)
          raw = [Math.max(0, a - choice([1, 2])), hi]
          latex = `P(${raw[0]} ${lt()} X ${lt()} ${raw[1]})`
        }
        const ans = (hi - lo) / w
        const wrong = [1 - ans, (hi - lo) / b, (hi - lo + 1) / (w + 1)]
        if (raw) wrong.unshift((raw[1] - raw[0]) / w)
        return {
          ask: 'Probability for a uniform X: length over length.',
          text,
          latex: `${latex} = \\,?`,
          answer: ans,
          answerLatex: `\\dfrac{${hi} - ${lo}}{${b} - ${a}} = ${num(ans)}`,
          placeholder: 'e.g. 0.5',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(c < X < d) = \\int_c^d \\frac{dx}{B-A} = \\frac{d - c}{B - A}',
            text: raw
              ? `Clip to the support first: X never leaves [${a}, ${b}], so only ${lo} to ${hi} counts.`
              : 'The density is flat, so the area is a rectangle: the length of the interval you want times 1/(B − A).',
          },
          distractors: probs(...wrong),
        }
      },
    },
    {
      id: 'mean',
      generate() {
        const { a, b, w, text } = scenario()
        const mu = (a + b) / 2
        const ex2 = (a * a + a * b + b * b) / 3
        const v = ex2 - mu * mu
        const intX2 = `\\int_{${a}}^{${b}} \\tfrac{x^{2}}{${w}}\\,dx = \\tfrac{${b}^{3} - ${a}^{3}}{${3 * w}} = ${num(ex2)}`
        const q = choice([
          {
            latex: 'E[X]',
            v: mu,
            shown: `\\int_{${a}}^{${b}} \\tfrac{x}{${w}}\\,dx = \\tfrac{${b}^{2} - ${a}^{2}}{${2 * w}} = ${num(mu)}`,
            wrong: [w / 2, b / 2, (b * b - a * a) / 2],
          },
          { latex: 'E[X^2]', v: ex2, shown: intX2, wrong: [mu * mu, (b * b - a * a) / 2, (b ** 3 - a ** 3) / 3] },
          {
            latex: '\\operatorname{Var}X',
            v,
            shown: `E[X^{2}] = ${num(ex2)}, \\quad ${num(ex2)} - ${num(mu)}^{2} = ${num(v)}`,
            wrong: [ex2, ex2 - mu, w / 12, Math.sqrt(v)],
          },
          {
            latex: '\\sigma',
            v: Math.sqrt(v),
            shown: `\\operatorname{Var}X = \\tfrac{(${b} - ${a})^{2}}{12} = ${num(v)}, \\quad \\sigma = \\sqrt{${num(v)}} = ${num(Math.sqrt(v))}`,
            wrong: [v, w / 12, Math.sqrt(ex2)],
          },
        ])
        return {
          ask: 'Mean and variance of a uniform X, by integrating x·f(x).',
          text,
          latex: `${q.latex} = \\,?`,
          answer: q.v,
          answerLatex: q.shown,
          placeholder: 'e.g. 7',
          tolerance: Math.max(0.005, Math.abs(q.v) * 0.002),
          hint: {
            latex: 'E[X] = \\frac{A+B}{2}, \\quad E[X^2] = \\frac{B^3 - A^3}{3(B-A)}, \\quad \\operatorname{Var}X = E[X^2] - \\mu^2 = \\frac{(B-A)^2}{12}',
            text: 'Integrate x·f(x) and x²·f(x) with f = 1/(B − A). Variance is E[X²] minus the mean squared; σ is its square root.',
          },
          distractors: q.wrong.filter(x => Number.isFinite(x) && x > 0 && Math.abs(x - q.v) > 1e-9),
        }
      },
    },
  ],
}
