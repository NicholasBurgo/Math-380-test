import { choice, randInt } from '../../../engine/rand.js'
import { toLatex } from '../../../engine/expr.js'
import { dec, formula, num, probs, tolFor } from './util.js'
import { FAMILIES, condTex, expExponent, gridPoints, gridStep, paren, pdfCases, polyExpr, stack, work } from './continuous-pdf.js'

// §4.1: F(x) = P(X ≤ x) = ∫ f(t) dt from −∞ to x, and back again: f = F'.
// The middle piece of F is typed as a formula; values of F and f are numbers.

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
const pow = (n, v = 'x') => (n === 1 ? v : `${v}^${n}`)
// p·xⁿ/q typed, in lowest terms: 3x^2/8, x/2, 2x
function monoExpr(p, q, n) {
  const g = gcd(p, q)
  const [a, b] = [p / g, q / g]
  const body = n === 0 ? '' : pow(n)
  if (n === 0) return b === 1 ? `${a}` : `${a}/${b}`
  return `${a === 1 ? '' : a}${body}${b === 1 ? '' : `/${b}`}`
}

// F(x) as printed: 0 before the support, the formula on it, 1 after.
export function cdfCases(Ftex, lo, hi) {
  if (hi === Infinity) {
    return lo === 0
      ? `F(x) = \\begin{cases} 0 & x \\le 0 \\\\ ${Ftex} & x > 0 \\end{cases}`
      : `F(x) = \\begin{cases} 0 & x < ${lo} \\\\ ${Ftex} & x \\ge ${lo} \\end{cases}`
  }
  return `F(x) = \\begin{cases} 0 & x < ${lo} \\\\ ${Ftex} & ${condTex(lo, hi)} \\\\ 1 & x > ${hi} \\end{cases}`
}

// Grading points inside the support.
const insidePoints = (lo, hi, scale = 1) =>
  hi === Infinity ? [0.3, 1.2, 2.5].map(r => lo + r * scale) : [0.21, 0.55, 0.87].map(r => lo + r * (hi - lo))

// ---------- deriving F from f ----------

// The cdf of a density from FAMILIES as a typed formula, with the usual wrong turns.
function cdfAnswer(d) {
  const f = d.kind === 'exp' ? null : polyExpr(d.c)
  if (d.kind === 'lead') {
    return { answer: d.Fexpr, choices: [f, polyExpr([0, -d.m * d.a, d.m / 2]), `${d.m}(x-${d.a})^2`] }
  }
  if (d.kind === 'falling') {
    return { answer: d.Fexpr, choices: [f, polyExpr([0, d.m * d.b, -d.m / 2]), `${dec(d.m / 2)}(${d.b}-x)^2`] }
  }
  if (d.kind === 'trap') {
    const third = d.lo === 0 ? `${dec(d.m / 2)}x^2+${d.k}` : polyExpr([0, d.k, d.m / 2])
    return { answer: d.Fexpr, choices: [f, polyExpr([-(d.k * d.lo + d.m * d.lo * d.lo), d.k, d.m]), third] }
  }
  if (d.kind === 'power') {
    const { n, B } = d
    return {
      answer: d.Fexpr,
      choices: [monoExpr(n + 1, B, n), monoExpr(n + 1, B, n + 1), monoExpr(n * (n + 1), B, n - 1)],
    }
  }
  if (d.kind === 'decr') {
    const { b } = d
    const q = b * b
    return { answer: d.Fexpr, choices: [`2(${b}-x)/${q}`, `(${b}-x)^2/${q}`, `(${2 * b}x-2x^2)/${q}`] }
  }
  // exponential
  const ex = expExponent(d.beta)
  return {
    answer: d.Fexpr,
    choices: d.beta === 1 ? ['e^(-x)', '-e^(-x)', '1+e^(-x)'] : [`e^(${ex})`, `-e^(${ex})`, densityExpr(d.beta)],
  }
}

// (1/β)e^(−x/β) typed: e^(-x), e^(-x/3)/3, 2e^(-2x)
const densityExpr = beta =>
  beta === 1 ? 'e^(-x)' : beta < 1 ? `${dec(1 / beta)}e^(-${dec(1 / beta)}x)` : `e^(-x/${beta})/${beta}`

// The integral that defines F on the support, worked.
const cdfWork = (d, upper, result) =>
  work(`F(${upper}) = \\int_{${d.lo}}^{${upper}} ${paren(d.tex.replaceAll('x', 't'))}\\,dt = ${result}`)

// ---------- finding f from F ----------
//
// A cdf shown piecewise, its pdf typed (`answer`), wrong derivatives, and
// nice points for asking values.

const RAYLEIGH_GRID = { 1: [0.5, 1, 1.5, 2], 2: [0.5, 1, 2, 3], 4: [1, 2, 3, 4], 9: [1, 2, 3, 4.5, 6] }

function givenCdf() {
  const kind = choice(['power', 'power', 'lead', 'trap', 'decr', 'exp', 'rayleigh', 'pareto'])
  if (kind === 'rayleigh') {
    const th = choice([1, 2, 4, 9])
    const ex = th === 1 ? '-x^2' : `-x^2/${th}`
    const answer = th === 1 ? '2xe^(-x^2)' : th === 2 ? 'xe^(-x^2/2)' : th === 4 ? 'xe^(-x^2/4)/2' : `2xe^(-x^2/${th})/${th}`
    const noChain = th === 1 ? 'e^(-x^2)' : `e^(${ex})/${th}`
    return {
      lo: 0,
      hi: Infinity,
      Ftex: `1 - e^{-x^{2}${th === 1 ? '' : `/${th}`}}`,
      F: x => (x <= 0 ? 0 : 1 - Math.exp(-(x * x) / th)),
      f: x => (x <= 0 ? 0 : ((2 * x) / th) * Math.exp(-(x * x) / th)),
      answer,
      choices: [noChain, `-${answer}`, th === 1 ? 'xe^(-x^2)' : `2xe^(${ex})`],
      wrongAt: x => [Math.exp(-(x * x) / th) / th],
      grid: RAYLEIGH_GRID[th],
      points: [0.3, 0.9, 1.7].map(r => r * Math.sqrt(th)),
      chain: true,
    }
  }
  if (kind === 'pareto') {
    const k = choice([2, 3, 4])
    return {
      lo: 1,
      hi: Infinity,
      Ftex: `1 - \\frac{1}{x^{${k}}}`,
      F: x => (x < 1 ? 0 : 1 - x ** -k),
      f: x => (x < 1 ? 0 : k * x ** -(k + 1)),
      answer: `${k}/x^${k + 1}`,
      choices: [`1/x^${k + 1}`, `-${k}/x^${k + 1}`, `${k}/x^${k - 1}`],
      wrongAt: x => [x ** -(k + 1), k * x ** -(k - 1)],
      grid: [1.5, 2, 3, 4, 5],
      points: [1.3, 2.2, 3.7],
    }
  }
  const d = FAMILIES[kind === 'lead' ? choice(['lead', 'falling']) : kind]()
  const base = { lo: d.lo, hi: d.hi, Ftex: d.Ftex, F: d.F, f: d.f, grid: gridPoints(d), points: insidePoints(d.lo, d.hi, d.beta) }
  if (d.kind === 'exp') {
    const answer = densityExpr(d.beta)
    const ex = expExponent(d.beta)
    return {
      ...base,
      answer,
      choices: d.beta === 1 ? ['-e^(-x)', '1-e^(-x)', '1+e^(-x)'] : [`e^(${ex})`, `-${answer}`, d.Fexpr],
      wrongAt: x => [Math.exp(-x / d.beta)],
      chain: d.beta !== 1,
    }
  }
  if (d.kind === 'power') {
    const { n, B } = d
    return {
      ...base,
      answer: monoExpr(n + 1, B, n),
      choices: [monoExpr(1, B, n), monoExpr(n + 1, B, n + 1), d.Fexpr],
      wrongAt: x => [x ** n / B, ((n + 1) * x ** (n + 1)) / B],
    }
  }
  if (d.kind === 'decr') {
    const q = d.b * d.b
    return {
      ...base,
      answer: `2(${d.b}-x)/${q}`,
      choices: [`(${2 * d.b}-x)/${q}`, d.Fexpr, `(${d.b}-x)/${q}`],
      wrongAt: x => [(2 * d.b - x) / q, (d.b - x) / q],
    }
  }
  // a line k + mx: F = F0 + kx + (m/2)x² on the support, f = k + mx. Slips:
  // not bringing the 2 down, and keeping the constant F0 (or, when F0 = 0,
  // dropping k)
  const [k, m] = d.c
  const F0 = -(k * d.lo + (m / 2) * d.lo * d.lo)
  const kept = Math.abs(F0) > 1e-12 ? [k + F0, m] : [0, m]
  return {
    ...base,
    answer: polyExpr(d.c),
    choices: [polyExpr([k, m / 2]), polyExpr(kept), d.Fexpr],
    wrongAt: x => [k + (m / 2) * x, kept[0] + m * x],
  }
}

const HOW_F = 'F(x) is the area to the left of x. Integrate f from the left end of the support up to x; left of the support F = 0, past it F = 1.'

export default {
  id: 'continuous-cdf',
  name: 'Continuous cdfs',
  description: '§4.1: derive F(x) from f(x), and f(x) from F(x).',
  learn: {
    formulas: [
      { label: 'cdf', latex: 'F(x) = P(X \\le x) = \\int_{-\\infty}^{x} f(t)\\,dt' },
      { label: 'pdf from cdf', latex: "f(x) = F'(x)" },
      { label: 'Probabilities from F', latex: 'P(a < X \\le b) = F(b) - F(a), \\quad P(X > a) = 1 - F(a)' },
      {
        label: 'Support [a, b]',
        latex: 'F(x) = \\begin{cases} 0 & x < a \\\\ \\int_a^x f(t)\\,dt & a \\le x \\le b \\\\ 1 & x > b \\end{cases}',
      },
      { label: 'Exponential', latex: 'f(x) = \\tfrac{1}{\\beta}e^{-x/\\beta} \\;\\Rightarrow\\; F(x) = 1 - e^{-x/\\beta}, \\; x > 0' },
    ],
    how: [
      'F(x) is the area under f to the left of x. Use t inside the integral, since x is the upper limit.',
      'Start the integral at the left end of the support: f is 0 before it. Left of the support F = 0; past the right end F = 1.',
      'Lead example: F(x) = ∫ from 0.1 to x of (12.5t − 1.25) dt = 6.25x² − 1.25x + 0.0625 for 0.1 ≤ x ≤ 0.5.',
      'Check your F: it must be 0 at the left end and 1 at the right end (6.25(0.25) − 0.625 + 0.0625 = 1).',
      'Going back: differentiate F piece by piece. The lead cdf gives f(x) = 12.5x − 1.25, and the 0 and 1 pieces give f = 0.',
      'Use the chain rule on pieces like 1 − e^(−x²/4): the derivative is (2x/4)e^(−x²/4).',
      'Once you have F, P(a < X ≤ b) = F(b) − F(a): no new integral.',
    ],
  },
  templates: [
    {
      id: 'derive',
      generate() {
        const d = FAMILIES[choice(['lead', 'lead', 'falling', 'trap', 'power', 'power', 'decr', 'exp'])]()
        const { answer, choices } = cdfAnswer(d)
        const range = d.hi === Infinity ? 'x > 0' : `${d.lo} ≤ x ≤ ${d.hi}`
        return formula({
          ask: `Derive the cdf. Type F(x) for ${range}.`,
          latex: stack(pdfCases(d.tex, d.lo, d.hi), 'F(x) = \\,?'),
          size: 'small',
          vars: ['x'],
          points: insidePoints(d.lo, d.hi, d.beta).map(x => ({ x })),
          answer,
          choices,
          answerLatex: cdfWork(d, 'x', d.Ftex),
          placeholder: 'F(x) in terms of x',
          hint: {
            latex: cdfCases(d.Ftex, d.lo, d.hi),
            text: `Integrate f(t) from ${d.lo} (where the support starts) up to x. Before the support F = 0${d.hi === Infinity ? '' : ', after it F = 1'}.`,
          },
        })
      },
    },
    {
      id: 'value',
      generate() {
        const d = FAMILIES[choice(['lead', 'falling', 'trap', 'power', 'decr', 'exp'])]()
        const pts = gridPoints(d)
        const where = d.hi === Infinity ? choice(['in', 'in', 'in', 'below']) : choice(['in', 'in', 'in', 'in', 'below', 'above'])
        let x0
        let ans
        let shown
        let wrong
        if (where === 'in') {
          x0 = choice(pts)
          ans = d.F(x0)
          shown = cdfWork(d, x0, num(ans))
          wrong = [d.f(x0), d.G(x0), 1 - ans]
        } else if (where === 'below') {
          x0 = d.lo > 0 ? choice([0, Number(dec(d.lo - gridStep(d)))]) : -1
          ans = 0
          shown = `x = ${x0} \\text{ is left of the support, so } F(${x0}) = 0`
          wrong = [1, d.F(pts[0]), d.G(x0) - d.G(d.lo)]
        } else {
          x0 = Number(dec(d.hi + gridStep(d)))
          ans = 1
          shown = `x = ${x0} \\text{ is past the support, so } F(${x0}) = 1`
          wrong = [0, d.F(pts[pts.length - 1]), d.G(x0) - d.G(d.lo)]
        }
        return {
          ask: 'Find the cdf value F(x₀) = P(X ≤ x₀).',
          latex: stack(pdfCases(d.tex, d.lo, d.hi), `F(${x0}) = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: shown,
          placeholder: 'e.g. 0.1875',
          tolerance: ans === 0 || ans === 1 ? 1e-6 : tolFor(ans),
          hint: { latex: cdfCases(d.Ftex, d.lo, d.hi), text: HOW_F },
          distractors: wrong.filter(w => Number.isFinite(w) && w >= 0 && w <= 1 && Math.abs(w - ans) > 1e-9),
        }
      },
    },
    {
      id: 'pdf',
      generate() {
        const c = givenCdf()
        const range = c.hi === Infinity ? (c.lo === 0 ? 'x > 0' : `x ≥ ${c.lo}`) : `${c.lo} ≤ x ≤ ${c.hi}`
        return formula({
          ask: `Find the pdf from the cdf. Type f(x) for ${range}.`,
          latex: stack(cdfCases(c.Ftex, c.lo, c.hi), 'f(x) = \\,?'),
          size: 'small',
          vars: ['x'],
          points: c.points.map(x => ({ x })),
          answer: c.answer,
          choices: c.choices,
          answerLatex: `f(x) = F'(x) = ${toLatex(c.answer, ['x'])}`,
          placeholder: 'f(x) in terms of x',
          hint: {
            latex: "f(x) = F'(x)",
            text: c.chain
              ? 'Differentiate the middle piece. The chain rule brings down the derivative of the exponent, and the 1 in front differentiates to 0.'
              : 'Differentiate the middle piece of F term by term (power rule). Outside the support f = 0.',
          },
        })
      },
    },
    {
      id: 'pdf-value',
      generate() {
        const c = givenCdf()
        const x0 = choice(c.grid)
        const ans = c.f(x0)
        return {
          ask: 'Find the density value f(x₀) from the cdf.',
          latex: stack(cdfCases(c.Ftex, c.lo, c.hi), `f(${x0}) = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: work(`f(x) = F'(x) = ${toLatex(c.answer, ['x'])}, \\quad f(${x0}) = ${num(ans)}`),
          placeholder: 'e.g. 0.375',
          tolerance: Math.max(0.0005, Math.abs(ans) * 0.005),
          hint: {
            latex: "f(x) = F'(x)",
            text: 'Differentiate F first, then plug in. F(x₀) itself is a probability, not the density.',
          },
          distractors: [c.F(x0), ...c.wrongAt(x0)].filter(w => Number.isFinite(w) && w > 0),
        }
      },
    },
    {
      id: 'interval',
      generate() {
        const c = givenCdf()
        const g = c.grid
        const kind = choice(['between', 'between', 'above', 'below'])
        let latex
        let ans
        let shown
        let wrong
        if (kind === 'between') {
          const i = randInt(0, g.length - 2)
          const [a, b] = [g[i], g[randInt(i + 1, g.length - 1)]]
          latex = `P(${a} < X \\le ${b})`
          ans = c.F(b) - c.F(a)
          shown = `F(${b}) - F(${a}) = ${num(c.F(b))} - ${num(c.F(a))} = ${num(ans)}`
          wrong = [c.F(b), 1 - ans, c.F(b) + c.F(a), c.f(b) - c.f(a)]
        } else if (kind === 'above') {
          const a = choice(g)
          latex = `P(X > ${a})`
          ans = 1 - c.F(a)
          shown = `1 - F(${a}) = 1 - ${num(c.F(a))} = ${num(ans)}`
          wrong = [c.F(a), c.f(a), 1 - c.f(a)]
        } else {
          const b = choice(g)
          latex = `P(X \\le ${b})`
          ans = c.F(b)
          shown = `F(${b}) = ${num(ans)}`
          wrong = [1 - ans, c.f(b)]
        }
        return {
          ask: 'Use the cdf: no integral needed.',
          latex: stack(cdfCases(c.Ftex, c.lo, c.hi), `${latex} = \\,?`),
          size: 'small',
          answer: ans,
          answerLatex: work(shown),
          placeholder: 'e.g. 0.4',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(a < X \\le b) = F(b) - F(a), \\qquad P(X > a) = 1 - F(a)',
            text: 'F already holds the area to the left. Subtract two F values for a range, or take 1 − F for a right tail.',
          },
          distractors: probs(...wrong),
        }
      },
    },
  ],
}
