import { choice } from '../../../engine/rand.js'
import { BOX, derivation, formula, lettered } from './util.js'
import { stack } from './continuous-pdf.js'

// §4.2–4.3: m_X(t) = E[e^(tX)] = ∫ e^(tx) f(x) dx, one step at a time, like
// the geometric derivations: the lines so far, then a box to fill. The notes
// do f(x) = e^(−x) on x > 0 and then the gamma MGF; the exponential (β or λ)
// and the uniform are the same moves.

// ---------- f(x) = e^(−x), the notes' example ----------

const E1 = ['t', 'x']
const E1_POINTS = [
  { t: 0.3, x: 1.7 },
  { t: -0.8, x: 0.6 },
  { t: 0.55, x: 2.4 },
]
const E1_DEF = 'm_X(t) &= E[e^{tX}] = \\int_0^{\\infty} e^{tx}\\,e^{-x}\\,dx'
const COMBINE_HINT = {
  latex: 'e^{tx}e^{-x} = e^{tx - x} = e^{-(1-t)x}',
  text: 'Same base, so add the exponents: tx + (−x) = (t − 1)x. Multiplying the exponents is the classic slip.',
}
const KEY_HINT = {
  latex: '\\int_0^{\\infty} e^{-cx}\\,dx = \\Big[-\\frac{e^{-cx}}{c}\\Big]_0^{\\infty} = \\frac{1}{c}, \\quad c > 0',
  text: 'The antiderivative is −e^(−cx)/c. At ∞ it is 0 only when c > 0; at 0 it is −1/c.',
}

// ---------- exponential with β or λ ----------

const EXP = ['t', 'x', 'beta', 'lambda']
const EXP_POINTS = [
  { t: 0.2, x: 1.1, beta: 2, lambda: 3 },
  { t: -0.6, x: 0.4, beta: 0.5, lambda: 0.8 },
  { t: 0.05, x: 2.5, beta: 4, lambda: 1.5 },
]
const BETA_LINES = [
  'm_X(t) &= \\int_0^{\\infty} e^{tx}\\,\\frac{1}{\\beta}e^{-x/\\beta}\\,dx',
  '&= \\frac{1}{\\beta}\\int_0^{\\infty} e^{-(1/\\beta - t)x}\\,dx',
  '&= \\frac{1}{\\beta}\\cdot\\frac{1}{1/\\beta - t}',
]
const LAMBDA_LINES = ['m_X(t) &= \\int_0^{\\infty} e^{tx}\\,\\lambda e^{-\\lambda x}\\,dx', '&= \\lambda\\int_0^{\\infty} e^{-(\\lambda - t)x}\\,dx']

// ---------- uniform on [a, b] ----------

const UNI = ['t', 'x', 'a', 'b']
const UNI_POINTS = [
  { t: 0.7, x: 1.2, a: 0.5, b: 2 },
  { t: -1.3, x: 3, a: 1, b: 4 },
  { t: 2.1, x: -0.4, a: -1, b: 1.5 },
]
const UNI_LINES = [
  'm_X(t) &= E[e^{tX}] = \\int_a^b e^{tx}\\,\\frac{1}{b-a}\\,dx',
  '&= \\frac{1}{b-a}\\int_a^b e^{tx}\\,dx',
  '&= \\frac{1}{b-a}\\cdot\\frac{e^{bt} - e^{at}}{t}',
]

// ---------- gamma ----------

const GAM = ['t', 'x', 'beta', 'alpha']
const GAM_POINTS = [
  { t: 0.2, x: 1.3, beta: 2, alpha: 3 },
  { t: -0.5, x: 0.7, beta: 0.5, alpha: 2 },
  { t: 0.3, x: 2.2, beta: 1.5, alpha: 1.5 },
]
const GAM_LINES = [
  'm_X(t) &= \\int_0^{\\infty} e^{tx}\\,\\frac{x^{\\alpha-1}e^{-x/\\beta}}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\,dx',
  '&= \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\int_0^{\\infty} x^{\\alpha-1}e^{-x(1-\\beta t)/\\beta}\\,dx',
  '&\\text{let } z = \\frac{x(1-\\beta t)}{\\beta}: \\; x = \\frac{\\beta z}{1-\\beta t}, \\; dx = \\frac{\\beta}{1-\\beta t}\\,dz',
  '&= \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\left(\\frac{\\beta}{1-\\beta t}\\right)^{\\alpha}\\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz',
  '&= \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\left(\\frac{\\beta}{1-\\beta t}\\right)^{\\alpha}\\Gamma(\\alpha)',
]
const GAMMA_HINT_TEXT =
  'Combine the exponentials, substitute z = x(1 − βt)/β so the integral becomes Γ(α), then cancel Γ(α) and β^α.'

const box = (vars, points, rest, opts) => formula({ vars, points, size: 'derivation', placeholder: `formula in ${vars.join(', ')}`, ...rest, ...opts })

// ---------- specific densities for `numbers` ----------

function specific() {
  const kind = choice(['beta', 'beta', 'lambda', 'uniform', 'gamma', 'notes'])
  if (kind === 'notes') {
    return {
      cases: 'e^{-x} & x > 0',
      answer: '1/(1-t)',
      choices: ['1/(t-1)', '1/(1+t)', 'e^t/(1-t)'],
      limit: 1,
      domain: 't < 1',
      hint: 'Combine to e^(−(1 − t)x) and integrate: 1/(1 − t).',
    }
  }
  if (kind === 'beta') {
    const b = choice([2, 3, 4, 5, 10])
    return {
      cases: `\\frac{1}{${b}}e^{-x/${b}} & x > 0`,
      answer: `1/(1-${b}t)`,
      choices: [`${b}/(1-${b}t)`, `1/(1-t/${b})`, `1/(1+${b}t)`],
      limit: 1 / b,
      domain: `t < 1/${b}`,
      hint: `Here β = ${b}: combine to e^(−(1/${b} − t)x), integrate, and multiply by 1/${b}.`,
    }
  }
  if (kind === 'lambda') {
    const l = choice([2, 3, 5])
    return {
      cases: `${l}e^{-${l}x} & x > 0`,
      answer: `${l}/(${l}-t)`,
      choices: [`1/(${l}-t)`, `${l}/(${l}+t)`, `1/(1-${l}t)`],
      limit: l,
      domain: `t < ${l}`,
      hint: `Here λ = ${l}: combine to e^(−(${l} − t)x), integrate to 1/(${l} − t), and multiply by ${l}.`,
    }
  }
  if (kind === 'uniform') {
    const [a, b] = choice([
      [0, 1],
      [0, 2],
      [0, 4],
      [1, 3],
      [2, 4],
      [1, 2],
    ])
    const w = b - a
    const top = a === 0 ? `e^(${b}t)-1` : `e^(${b}t)-e^(${a}t)`
    const wt = w === 1 ? 't' : `${w}t`
    return {
      cases: `${w === 1 ? '1' : `\\frac{1}{${w}}`} & ${a} \\le x \\le ${b}`,
      answer: `(${top})/(${wt})`,
      choices: [`(${top})/${w === 1 ? '1' : w}`, `(${a === 0 ? `1-e^(${b}t)` : `e^(${a}t)-e^(${b}t)`})/(${wt})`, `(${top})/t^2`],
      limit: null,
      domain: 't ≠ 0',
      hint: `Integrate e^(tx)/${w} from ${a} to ${b}: (e^(${b}t) − ${a === 0 ? '1' : `e^(${a}t)`})/(${w === 1 ? '' : w}t).`,
    }
  }
  // gamma shapes with whole-number α
  const [al, be, tex] = choice([
    [2, 1, 'xe^{-x}'],
    [3, 1, '\\frac{1}{2}x^{2}e^{-x}'],
    [2, 2, '\\frac{1}{4}xe^{-x/2}'],
    [3, 2, '\\frac{1}{16}x^{2}e^{-x/2}'],
    [2, 3, '\\frac{1}{9}xe^{-x/3}'],
  ])
  const bt = be === 1 ? 't' : `${be}t`
  return {
    cases: `${tex} & x > 0`,
    answer: `(1-${bt})^(-${al})`,
    choices: [`(1-${bt})^${al}`, `(1-${bt})^(-${al - 1})`, `(1+${bt})^(-${al})`],
    limit: 1 / be,
    domain: be === 1 ? 't < 1' : `t < 1/${be}`,
    hint: `This is gamma with α = ${al}, β = ${be}: m(t) = (1 − βt)^(−α).`,
  }
}

const WHY = [
  {
    step: 'e^{tx}e^{-x} = e^{-(1-t)x}',
    right: 'Same base: add the exponents, tx − x = −(1 − t)x.',
  },
  {
    step: '\\int_0^{\\infty} e^{-(1-t)x}\\,dx = \\frac{1}{1-t}',
    right: 'The antiderivative −e^(−cx)/c goes to 0 at ∞ only when c = 1 − t > 0, so this needs t < 1.',
  },
  {
    step: '\\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz = \\Gamma(\\alpha)',
    right: 'That integral is the definition of the gamma function.',
  },
  {
    step: 'm_X(t) = \\int_{-\\infty}^{\\infty} e^{tx}f(x)\\,dx',
    right: 'Definition of the MGF: m_X(t) = E[e^(tX)], an expected value against the pdf.',
  },
  {
    step: '\\frac{1}{\\beta}\\cdot\\frac{1}{1/\\beta - t} = \\frac{1}{1-\\beta t}',
    right: 'Multiply the top and bottom by β.',
  },
  {
    step: 'x = \\frac{\\beta z}{1-\\beta t}, \\quad dx = \\frac{\\beta}{1-\\beta t}\\,dz',
    right: 'Substitute z = x(1 − βt)/β, solve for x, and differentiate.',
  },
  {
    step: '\\int_a^b e^{tx}\\,dx = \\frac{e^{bt} - e^{at}}{t}',
    right: 'The antiderivative of e^(tx) is e^(tx)/t, which needs t to be nonzero.',
  },
]

export default {
  id: 'continuous-mgf',
  name: 'Deriving continuous MGFs',
  description: '§4.2–4.3: m_X(t) = ∫ e^(tx) f(x) dx, and when it exists.',
  learn: {
    formulas: [
      { label: 'MGF of a continuous X', latex: 'm_X(t) = E[e^{tX}] = \\int_{-\\infty}^{\\infty} e^{tx} f(x)\\,dx' },
      { label: 'The key integral', latex: '\\int_0^{\\infty} e^{-cx}\\,dx = \\frac{1}{c}, \\quad c > 0' },
      { label: 'The notes: f(x) = e^(−x), x > 0', latex: 'm_X(t) = \\frac{1}{1-t}, \\quad t < 1' },
      {
        label: 'Exponential',
        latex: '\\tfrac{1}{\\beta}e^{-x/\\beta}: \\; \\frac{1}{1-\\beta t}, \\; t < \\tfrac{1}{\\beta} \\qquad \\lambda e^{-\\lambda x}: \\; \\frac{\\lambda}{\\lambda - t}, \\; t < \\lambda',
      },
      { label: 'Uniform on [a, b]', latex: 'm_X(t) = \\frac{e^{bt} - e^{at}}{(b-a)t}, \\; t \\ne 0, \\quad m_X(0) = 1' },
      { label: 'Gamma', latex: 'm_X(t) = (1 - \\beta t)^{-\\alpha}, \\quad t < \\frac{1}{\\beta}' },
    ],
    how: [
      'Start from the definition: m_X(t) = E[e^(tX)] = ∫ e^(tx) f(x) dx over the support.',
      'Combine the exponentials (same base, add the exponents): e^(tx)·e^(−x) = e^(−(1 − t)x).',
      '∫ from 0 to ∞ of e^(−cx) dx = 1/c, but only if c > 0; otherwise it blows up. That condition is where the MGF exists: 1 − t > 0, so t < 1.',
      'With β: e^(tx)e^(−x/β) = e^(−(1/β − t)x), so m(t) = (1/β)·1/(1/β − t) = 1/(1 − βt) for t < 1/β. With rate λ: λ/(λ − t) for t < λ.',
      'Uniform: (1/(b − a)) ∫ from a to b of e^(tx) dx = (e^(bt) − e^(at))/((b − a)t). A finite interval always converges; t = 0 just gives m(0) = 1.',
      'Gamma: combine to x^(α−1)e^(−x(1 − βt)/β), substitute z = x(1 − βt)/β, and the integral becomes Γ(α)(β/(1 − βt))^α. Everything cancels to (1 − βt)^(−α).',
    ],
  },
  templates: [
    {
      id: 'combine',
      generate() {
        if (Math.random() < 0.4) {
          return box(
            E1,
            E1_POINTS,
            {
              ask: 'f(x) = e^(−x) for x > 0. Start the MGF from its definition: what goes in the box?',
              latex: derivation([`m_X(t) &= E[e^{tX}] = \\int_0^{\\infty} ${BOX}\\,dx`]),
              hint: {
                latex: 'E[H(X)] = \\int H(x)\\,f(x)\\,dx, \\quad H(x) = e^{tx}',
                text: 'An expected value integrates H(x) times the pdf. Here H(x) = e^(tx) and f(x) = e^(−x).',
              },
            },
            { answer: 'e^(tx)e^(-x)', choices: ['e^(tx)', 'xe^(-x)', 'e^te^(-x)'] },
          )
        }
        return box(
          E1,
          E1_POINTS,
          {
            ask: 'f(x) = e^(−x) for x > 0. Combine the exponentials: what goes in the box?',
            latex: derivation([E1_DEF, `&= \\int_0^{\\infty} e^{${BOX}}\\,dx`]),
            hint: COMBINE_HINT,
          },
          { answer: '(t-1)x', choices: ['-tx^2', '(t+1)x', '(1-t)x'] },
        )
      },
    },
    {
      id: 'integral',
      generate() {
        return box(
          E1,
          E1_POINTS,
          {
            ask: 'f(x) = e^(−x) for x > 0. Do the integral (for t < 1): what goes in the box?',
            latex: derivation([E1_DEF, '&= \\int_0^{\\infty} e^{-(1-t)x}\\,dx', `&= ${BOX}`]),
            hint: KEY_HINT,
          },
          { answer: '1/(1-t)', choices: ['1/(t-1)', '1/(1+t)', '1-t'] },
        )
      },
    },
    {
      id: 'domain',
      generate() {
        const form = choice([
          {
            lines: [E1_DEF, '&= \\int_0^{\\infty} e^{-(1-t)x}\\,dx'],
            right: 't < 1',
            wrong: ['t > 1', 't \\ne 1', 't < 0'],
            hint: { latex: 'c = 1 - t > 0 \\iff t < 1', text: 'The integral of e^(−cx) out to ∞ is finite only when c > 0, and here c = 1 − t.' },
          },
          {
            lines: BETA_LINES.slice(0, 2),
            right: 't < \\frac{1}{\\beta}',
            wrong: ['t > \\frac{1}{\\beta}', 't < \\beta', 't \\ne \\frac{1}{\\beta}'],
            hint: { latex: 'c = \\tfrac{1}{\\beta} - t > 0 \\iff t < \\tfrac{1}{\\beta}', text: 'The exponent is −(1/β − t)x. It must decay, so 1/β − t > 0.' },
          },
          {
            lines: LAMBDA_LINES,
            right: 't < \\lambda',
            wrong: ['t > \\lambda', 't < \\frac{1}{\\lambda}', 't \\ne \\lambda'],
            hint: { latex: 'c = \\lambda - t > 0 \\iff t < \\lambda', text: 'The exponent is −(λ − t)x. It must decay, so λ − t > 0.' },
          },
          {
            lines: UNI_LINES.slice(0, 2),
            right: '\\text{every } t',
            wrong: ['t \\ne 0', 't < \\frac{1}{b-a}', 't > 0'],
            hint: {
              latex: '\\int_a^b e^{tx}\\,dx \\text{ is finite for every } t, \\quad m_X(0) = \\int_a^b \\frac{dx}{b-a} = 1',
              text: 'Over a finite interval nothing can blow up. The formula has t in the denominator, but at t = 0 the MGF is simply 1.',
            },
          },
        ])
        const pick = lettered({ latex: form.right }, form.wrong.map(w => ({ latex: w })))
        return {
          ask: 'For which t is this integral finite (where the MGF exists)?',
          latex: derivation(form.lines),
          size: 'derivation',
          ...pick,
          placeholder: 'a, b, c or d',
          hint: form.hint,
        }
      },
    },
    {
      id: 'exponential',
      generate() {
        const step = choice(['beta-rate', 'beta-int', 'beta-final', 'lambda-rate', 'lambda-final'])
        const hintB = {
          latex: 'm_X(t) = \\frac{1}{\\beta}\\cdot\\frac{1}{1/\\beta - t} = \\frac{1}{1-\\beta t}, \\quad t < \\frac{1}{\\beta}',
          text: 'Combine the exponents, use ∫ e^(−cx) dx = 1/c with c = 1/β − t, then multiply top and bottom by β.',
        }
        const hintL = {
          latex: 'm_X(t) = \\lambda\\int_0^{\\infty} e^{-(\\lambda - t)x}\\,dx = \\frac{\\lambda}{\\lambda - t}, \\quad t < \\lambda',
          text: 'Combine e^(tx)e^(−λx) = e^(−(λ − t)x), then ∫ e^(−cx) dx = 1/c with c = λ − t.',
        }
        const S = {
          'beta-rate': [
            { ask: 'Exponential MGF with β. Combine the exponentials: what goes in the box?', latex: derivation([BETA_LINES[0], `&= \\frac{1}{\\beta}\\int_0^{\\infty} e^{-\\left(${BOX}\\right)x}\\,dx`]), hint: hintB },
            { answer: '1/beta-t', choices: ['1/beta+t', 't-1/beta', 'beta-t'] },
          ],
          'beta-int': [
            { ask: 'Exponential MGF with β. Do the integral (for t < 1/β): what goes in the box?', latex: derivation([...BETA_LINES.slice(0, 2), `&= \\frac{1}{\\beta}\\cdot ${BOX}`]), hint: hintB },
            { answer: '1/(1/beta-t)', choices: ['1/(t-1/beta)', '1/beta-t', '1/(1/beta+t)'] },
          ],
          'beta-final': [
            { ask: 'Exponential MGF with β. Simplify: what goes in the box?', latex: derivation([...BETA_LINES, `&= ${BOX}, \\quad t < \\frac{1}{\\beta}`]), hint: hintB },
            { answer: '1/(1-beta t)', choices: ['beta/(1-beta t)', '1/(1-t/beta)', '1/(1+beta t)'] },
          ],
          'lambda-rate': [
            { ask: 'Exponential MGF with rate λ. Combine the exponentials: what goes in the box?', latex: derivation([LAMBDA_LINES[0], `&= \\lambda\\int_0^{\\infty} e^{-\\left(${BOX}\\right)x}\\,dx`]), hint: hintL },
            { answer: 'lambda-t', choices: ['lambda+t', 't-lambda', '1/lambda-t'] },
          ],
          'lambda-final': [
            { ask: 'Exponential MGF with rate λ. Do the integral (for t < λ): what goes in the box?', latex: derivation([...LAMBDA_LINES, `&= ${BOX}`]), hint: hintL },
            { answer: 'lambda/(lambda-t)', choices: ['1/(lambda-t)', 'lambda/(t-lambda)', 'lambda/(lambda+t)'] },
          ],
        }[step]
        return box(EXP, EXP_POINTS, ...S)
      },
    },
    {
      id: 'uniform',
      generate() {
        const hint = {
          latex: '\\int_a^b e^{tx}\\,dx = \\Big[\\frac{e^{tx}}{t}\\Big]_a^b = \\frac{e^{bt} - e^{at}}{t}, \\quad t \\ne 0',
          text: 'The uniform density is the constant 1/(b − a). Pull it out, integrate e^(tx) to e^(tx)/t, and evaluate from a to b.',
        }
        const step = choice(['def', 'int', 'final'])
        if (step === 'def') {
          return box(
            UNI,
            UNI_POINTS,
            { ask: 'X is uniform on [a, b]. Start the MGF from its definition: what goes in the box?', latex: derivation([`m_X(t) &= E[e^{tX}] = \\int_a^b ${BOX}\\,dx`]), hint },
            { answer: 'e^(tx)/(b-a)', choices: ['e^(tx)', 'xe^(tx)/(b-a)', 'e^t/(b-a)'] },
          )
        }
        if (step === 'int') {
          return box(
            UNI,
            UNI_POINTS,
            { ask: 'X is uniform on [a, b]. Do the integral (t ≠ 0): what goes in the box?', latex: derivation([...UNI_LINES.slice(0, 2), `&= \\frac{1}{b-a}\\cdot ${BOX}`]), hint },
            { answer: '(e^(bt)-e^(at))/t', choices: ['e^(bt)-e^(at)', 't(e^(bt)-e^(at))', '(e^(at)-e^(bt))/t'] },
          )
        }
        return box(
          UNI,
          UNI_POINTS,
          { ask: 'X is uniform on [a, b]. Simplify: what goes in the box?', latex: derivation([...UNI_LINES, `&= ${BOX}, \\quad t \\ne 0`]), hint },
          { answer: '(e^(bt)-e^(at))/((b-a)t)', choices: ['(e^(bt)-e^(at))/(b-a)', '(e^(at)-e^(bt))/((b-a)t)', '(e^(bt)-e^(at))t/(b-a)'] },
        )
      },
    },
    {
      id: 'gamma',
      generate() {
        const step = choice(['exponent', 'dx', 'constant', 'final'])
        const hint = {
          latex: 'm_X(t) = \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\left(\\frac{\\beta}{1-\\beta t}\\right)^{\\alpha}\\Gamma(\\alpha) = (1-\\beta t)^{-\\alpha}',
          text: GAMMA_HINT_TEXT,
        }
        const S = {
          exponent: [
            {
              ask: 'Gamma MGF. Combine the exponentials: what goes in the box?',
              latex: derivation([GAM_LINES[0], `&= \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\int_0^{\\infty} x^{\\alpha-1}e^{${BOX}}\\,dx`]),
              hint: { latex: 'tx - \\frac{x}{\\beta} = -\\frac{x(1-\\beta t)}{\\beta}', text: 'Add the exponents tx and −x/β, then factor out −x/β.' },
            },
            { answer: '-x(1-beta t)/beta', choices: ['-x(1+beta t)/beta', '-tx^2/beta', '-x(1-t)/beta'] },
          ],
          dx: [
            {
              ask: 'Gamma MGF. Substitute z = x(1 − βt)/β: what goes in the box?',
              latex: derivation([
                ...GAM_LINES.slice(0, 2),
                `&\\text{let } z = \\frac{x(1-\\beta t)}{\\beta}: \\; x = \\frac{\\beta z}{1-\\beta t}, \\; dx = ${BOX}\\,dz`,
              ]),
              hint: { latex: 'x = \\frac{\\beta}{1-\\beta t}\\,z \\;\\Rightarrow\\; dx = \\frac{\\beta}{1-\\beta t}\\,dz', text: 'x is a constant times z, so dx is that same constant times dz.' },
            },
            { answer: 'beta/(1-beta t)', choices: ['(1-beta t)/beta', 'beta', '1/(1-beta t)'] },
          ],
          constant: [
            {
              ask: 'Gamma MGF. After substituting, what comes out in front of the z-integral?',
              latex: derivation([
                ...GAM_LINES.slice(0, 3),
                `&= \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\,${BOX}\\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz`,
              ]),
              hint: {
                latex: 'x^{\\alpha-1}\\,dx = \\left(\\frac{\\beta z}{1-\\beta t}\\right)^{\\alpha-1}\\frac{\\beta}{1-\\beta t}\\,dz = \\left(\\frac{\\beta}{1-\\beta t}\\right)^{\\alpha} z^{\\alpha-1}\\,dz',
                text: 'x^(α−1) gives the constant to the power α − 1, and dx gives one more factor of it.',
              },
            },
            { answer: '(beta/(1-beta t))^alpha', choices: ['(beta/(1-beta t))^(alpha-1)', 'beta/(1-beta t)', '((1-beta t)/beta)^alpha'] },
          ],
          final: [
            {
              ask: 'Gamma MGF. Use ∫ z^(α−1)e^(−z) dz = Γ(α) and simplify: what goes in the box?',
              latex: derivation([...GAM_LINES, `&= ${BOX}, \\quad t < \\frac{1}{\\beta}`]),
              hint,
            },
            { answer: '(1-beta t)^(-alpha)', choices: ['(1-beta t)^alpha', '(1-t/beta)^(-alpha)', '(1+beta t)^(-alpha)'] },
          ],
        }[step]
        return box(GAM, GAM_POINTS, ...S)
      },
    },
    {
      id: 'numbers',
      generate() {
        const s = specific()
        // grading points inside the domain (t ≠ 0 for the uniform)
        const ts = s.limit === null ? [0.6, -0.9, 1.4] : [-1.1, 0.25 * s.limit, 0.6 * s.limit]
        return formula({
          ask: `Derive the MGF and type m_X(t) (for ${s.domain}).`,
          latex: stack(`f(x) = \\begin{cases} ${s.cases} \\\\ 0 & \\text{otherwise} \\end{cases}`, 'm_X(t) = \\,?'),
          size: 'small',
          vars: ['t'],
          points: ts.map(t => ({ t })),
          answer: s.answer,
          choices: s.choices,
          placeholder: 'm(t) in terms of t',
          hint: { latex: 'm_X(t) = \\int e^{tx} f(x)\\,dx', text: s.hint },
        })
      },
    },
    {
      id: 'why',
      generate() {
        const s = choice(WHY)
        const wrong = WHY.filter(o => o !== s)
          .map(o => o.right)
          .sort(() => Math.random() - 0.5)
        return {
          ask: 'Continuous MGFs: why is this step true?',
          latex: s.step,
          size: 'small',
          ...lettered(s.right, wrong),
          placeholder: 'a, b, c or d',
          hint: { latex: s.step, text: s.right },
        }
      },
    },
  ],
}
