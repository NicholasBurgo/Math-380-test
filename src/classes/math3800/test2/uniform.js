import { choice, randInt } from '../../../engine/rand.js'
import { BOX, derivation, formula, num, probs, tolFor } from './util.js'
import { stack } from './continuous-pdf.js'

// §4.1: the uniform density is flat, f(x) = c on [a, b], and area 1 forces
// c = 1/(b − a). Every probability is then a length ratio.

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
  latex: '\\int_a^b c\\,dx = c(b - a) = 1 \\;\\Rightarrow\\; c = \\frac{1}{b-a}',
  text: 'The area under a flat line is a rectangle: height c times width b − a. Set it equal to 1.',
}

// derivation steps, each with the box to fill; the letters are a, b, c, x
const VARS = ['a', 'b', 'c', 'x']
const POINTS = [
  { a: 1, b: 4, c: 0.7, x: 2.5 },
  { a: -2, b: 3, c: 1.3, x: 0.4 },
  { a: 0.5, b: 6, c: 2, x: 5.2 },
]
const STEPS = [
  {
    lines: ['f(x) &= c, \\quad a \\le x \\le b', `\\int_a^b c\\,dx &= ${BOX}`],
    answer: 'c(b-a)',
    choices: ['c(a-b)', 'cb', 'c/(b-a)'],
    ask: 'Derive the uniform pdf. The area under f(x) = c: what goes in the box?',
    hint: { latex: '\\int_a^b c\\,dx = \\Big[cx\\Big]_a^b = cb - ca', text: 'c is a constant, so its antiderivative is cx. Top limit minus bottom limit.' },
  },
  {
    lines: ['\\int_a^b c\\,dx &= c(b - a) = 1', `c &= ${BOX}`],
    answer: '1/(b-a)',
    choices: ['b-a', '1/(a-b)', '1/b-1/a'],
    ask: 'Derive the uniform pdf. A pdf has area 1: what goes in the box?',
    hint: HEIGHT_HINT,
  },
  {
    lines: [`F(x) &= \\int_a^x \\frac{1}{b-a}\\,dt = ${BOX}`],
    answer: '(x-a)/(b-a)',
    choices: ['x/(b-a)', '(b-x)/(b-a)', '1/(b-a)'],
    ask: 'The uniform cdf on [a, b]: what goes in the box (for a ≤ x ≤ b)?',
    hint: { latex: '\\int_a^x \\frac{dt}{b-a} = \\frac{x - a}{b - a}', text: 'Integrate the flat height from the left end a up to x: the length x − a over the full length b − a.' },
  },
  {
    lines: [`E[X] &= \\int_a^b \\frac{x}{b-a}\\,dx = ${BOX}`],
    answer: '(a+b)/2',
    choices: ['(b-a)/2', '(a+b)/(b-a)', '(b^2-a^2)/2'],
    ask: 'The uniform mean: what goes in the box? (Simplify or not.)',
    hint: {
      latex: '\\int_a^b \\frac{x}{b-a}\\,dx = \\frac{b^2 - a^2}{2(b-a)} = \\frac{(b-a)(b+a)}{2(b-a)} = \\frac{a+b}{2}',
      text: 'Antiderivative x²/(2(b − a)), then factor b² − a² = (b − a)(b + a) and cancel.',
    },
  },
]

export default {
  id: 'uniform',
  name: 'Uniform distribution',
  description: '§4.1: derive the pdf, then probabilities are lengths.',
  learn: {
    formulas: [
      { label: 'Uniform pdf on [a, b]', latex: 'f(x) = \\begin{cases} \\frac{1}{b-a} & a \\le x \\le b \\\\ 0 & \\text{otherwise} \\end{cases}' },
      { label: 'Deriving it', latex: '\\int_a^b c\\,dx = c(b - a) = 1 \\;\\Rightarrow\\; c = \\frac{1}{b-a}' },
      { label: 'Probability is a length ratio', latex: 'P(c < X < d) = \\frac{d - c}{b - a}, \\quad a \\le c \\le d \\le b' },
      { label: 'cdf', latex: 'F(x) = \\frac{x - a}{b - a}, \\quad a \\le x \\le b' },
      { label: 'Mean and variance', latex: 'E[X] = \\frac{a+b}{2}, \\qquad \\operatorname{Var}X = \\frac{(b-a)^2}{12}' },
    ],
    how: [
      'Uniform means every value in [a, b] is equally likely, so the density is flat: f(x) = c on [a, b] and 0 elsewhere.',
      'Derive c: the area under a flat line is a rectangle, c(b − a). Area 1 gives c = 1/(b − a). On [1, 6] the height must be 1/5 (height 5 would give area 25).',
      'A probability is the length you want over the whole length. Clip to [a, b] first. On [1, 6], P(2 < X < 4) = 2/5 = 0.4.',
      'Endpoints do not matter: P(X = c) = 0, so < and ≤ give the same answer.',
      'Mean: the middle, (a + b)/2. By integration, ∫ x/(b − a) dx from a to b = (b² − a²)/(2(b − a)) = (a + b)/2.',
      'Variance: E[X²] = ∫ x²/(b − a) dx = (b³ − a³)/(3(b − a)); subtract the mean squared. It always simplifies to (b − a)²/12.',
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
          placeholder: 'formula in a, b, c, x',
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
            text: 'The height is the same everywhere in [a, b] and 0 outside it. A density value is a height, not a probability.',
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
            latex: 'P(c < X < d) = \\int_c^d \\frac{dx}{b-a} = \\frac{d - c}{b - a}',
            text: raw
              ? `Clip to the support first: X never leaves [${a}, ${b}], so only ${lo} to ${hi} counts.`
              : 'The density is flat, so the area is a rectangle: the length of the interval you want times 1/(b − a).',
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
            latex: 'E[X] = \\frac{a+b}{2}, \\quad E[X^2] = \\frac{b^3 - a^3}{3(b-a)}, \\quad \\operatorname{Var}X = E[X^2] - \\mu^2 = \\frac{(b-a)^2}{12}',
            text: 'Integrate x·f(x) and x²·f(x) with f = 1/(b − a). Variance is E[X²] minus the mean squared; σ is its square root.',
          },
          distractors: q.wrong.filter(x => Number.isFinite(x) && x > 0 && Math.abs(x - q.v) > 1e-9),
        }
      },
    },
  ],
}
