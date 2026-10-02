import { choice } from '../../../engine/rand.js'
import { gcd, pdfTable, randProbs } from '../util.js'
import { BOX, dec, derivation, formula, lettered } from './util.js'
import { stack } from './continuous-pdf.js'

// Finding an MGF from its definition, m_X(t) = E[e^(tX)]: Σ e^(tx) f(x) for a
// discrete X (a pdf table, a formula on a few values, an infinite pdf whose sum
// is a geometric series) and ∫ e^(tx) f(x) dx for a continuous one. The
// continuous derivations go one step at a time, like the geometric ones: the
// lines so far, then a box to fill. The notes do f(x) = e^(−x) on x > 0; the
// exponential (β or λ) and the uniform are the same moves.

// ---------- discrete: Σ e^(tx) f(x) ----------

// t values for a finite sum (any t will do)
const SUM_POINTS = [{ t: -0.8 }, { t: 0.3 }, { t: 1.2 }]
// t values inside every series' region qe^t < 1 (q is at most 0.8, so t < 0.22)
const SERIES_POINTS = [{ t: -1.2 }, { t: -0.4 }, { t: 0.15 }]

const minus = v => (v < 0 ? `−${-v}` : `${v}`) // a number in plain text, with a real minus sign

// e^(kt) as typed: 1, e^t, e^(-t), e^(2t), e^(0.3t)
const expT = k => (k === 0 ? '1' : k === 1 ? 'e^t' : k === -1 ? 'e^(-t)' : `e^(${dec(k)}t)`)

// Σ c·e^(kt) as typed, from [c, k] pairs, like powers combined and zero terms
// dropped: 0.2+0.5e^t+0.3e^(2t)
function sumT(pairs) {
  const byK = new Map()
  for (const [c, k] of pairs) byK.set(k, (byK.get(k) ?? 0) + c)
  return [...byK]
    .map(([k, c]) => [parseFloat(c.toFixed(6)), k])
    .filter(([c]) => c !== 0)
    .map(([c, k], i) => {
      const size = Math.abs(c)
      const term = k === 0 ? dec(size) : size === 1 ? expT(k) : `${dec(size)}${expT(k)}`
      return c < 0 ? `-${term}` : i === 0 ? term : `+${term}`
    })
    .join('')
}

// f(x) = (numerator)/(sum of the numerators) on a few values
const FINITE_PDFS = [
  { tex: 'x', w: x => x, xs: [1, 2, 3] },
  { tex: 'x', w: x => x, xs: [1, 2, 3, 4] },
  { tex: 'x + 1', w: x => x + 1, xs: [0, 1, 2] },
  { tex: 'x + 1', w: x => x + 1, xs: [0, 1, 2, 3] },
  { tex: 'x + 2', w: x => x + 2, xs: [-1, 0, 1, 2] },
  { tex: '4 - x', w: x => 4 - x, xs: [0, 1, 2, 3] },
  { tex: '3 - x', w: x => 3 - x, xs: [0, 1, 2] },
  { tex: '2x + 1', w: x => 2 * x + 1, xs: [0, 1, 2] },
  { tex: 'x^2', w: x => x * x, xs: [1, 2, 3] },
  { tex: 'x^2 + 1', w: x => x * x + 1, xs: [-1, 0, 1] },
  { tex: '1', w: () => 1, xs: [1, 2, 3, 4] },
  { tex: '1', w: () => 1, xs: [0, 1, 2] },
]

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

const box = (vars, points, rest, opts) => formula({ vars, points, size: 'derivation', placeholder: `formula in ${vars.join(', ')}`, ...rest, ...opts })

// ---------- specific densities for `numbers` ----------

function specific() {
  const kind = choice(['beta', 'beta', 'lambda', 'uniform', 'notes'])
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
  // uniform on [a, b]
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
    step: 'm_X(t) = \\int_{-\\infty}^{\\infty} e^{tx}f(x)\\,dx',
    right: 'Definition of the MGF: m_X(t) = E[e^(tX)], an expected value against the pdf.',
  },
  {
    step: '\\frac{1}{\\beta}\\cdot\\frac{1}{1/\\beta - t} = \\frac{1}{1-\\beta t}',
    right: 'Multiply the top and bottom by β.',
  },
  {
    step: '\\int_a^b e^{tx}\\,dx = \\frac{e^{bt} - e^{at}}{t}',
    right: 'The antiderivative of e^(tx) is e^(tx)/t, which needs t to be nonzero.',
  },
]

export default {
  id: 'continuous-mgf',
  name: 'Finding an MGF: E(e^(tX))',
  description: '§3.4, §4.2: m_X(t) = Σ e^(tx) f(x) or ∫ e^(tx) f(x) dx.',
  learn: {
    formulas: [
      { label: 'MGF of a discrete X', latex: 'm_X(t) = E[e^{tX}] = \\sum_x e^{tx} f(x)' },
      { label: 'MGF of a continuous X', latex: 'm_X(t) = E[e^{tX}] = \\int_{-\\infty}^{\\infty} e^{tx} f(x)\\,dx' },
      {
        label: 'Example: a table',
        latex: stack(
          '\\begin{array}{c|ccc} x & 0 & 1 & 2 \\\\ \\hline f(x) & 0.2 & 0.5 & 0.3 \\end{array}',
          'm_X(t) = 0.2e^{0t} + 0.5e^{1t} + 0.3e^{2t} = 0.2 + 0.5e^{t} + 0.3e^{2t}',
        ),
      },
      {
        label: 'Example: a series, f(x) = 0.3(0.7)^x for x = 0, 1, 2, ...',
        latex: derivation([
          'm_X(t) &= \\sum_{x=0}^{\\infty} e^{tx}(0.3)(0.7)^x',
          '&= 0.3\\sum_{x=0}^{\\infty} (0.7e^t)^x',
          '&= \\frac{0.3}{1 - 0.7e^t}, \\quad t < -\\ln 0.7',
        ]),
      },
      { label: 'Geometric series (on the sheet)', latex: '\\sum_{k=1}^{\\infty} ar^{k-1} = \\frac{a}{1-r}, \\; |r| < 1' },
      { label: 'The key integral', latex: '\\int_0^{\\infty} e^{-cx}\\,dx = \\frac{1}{c}, \\quad c > 0' },
      { label: 'The notes: f(x) = e^(−x), x > 0', latex: 'm_X(t) = \\frac{1}{1-t}, \\quad t < 1' },
      {
        label: 'Exponential',
        latex: '\\tfrac{1}{\\beta}e^{-x/\\beta}: \\; \\frac{1}{1-\\beta t}, \\; t < \\tfrac{1}{\\beta} \\qquad \\lambda e^{-\\lambda x}: \\; \\frac{\\lambda}{\\lambda - t}, \\; t < \\lambda',
      },
      { label: 'Uniform on [a, b]', latex: 'm_X(t) = \\frac{e^{bt} - e^{at}}{(b-a)t}, \\; t \\ne 0, \\quad m_X(0) = 1' },
    ],
    how: [
      'Start from the definition, m_X(t) = E[e^(tX)]: Σ e^(tx) f(x) over the values of a discrete X, ∫ e^(tx) f(x) dx over the support of a continuous one.',
      'A table: one term per column, f(x)e^(tx). x = 0 gives the constant f(0) (e^0 = 1), x = 1 gives f(1)e^t, x = 2 gives f(2)e^(2t). Check: at t = 0 the terms add to 1.',
      'A formula on a few values, like f(x) = x/6 for x = 1, 2, 3: list f(1), f(2), f(3) first, then add: (e^t + 2e^(2t) + 3e^(3t))/6.',
      'An infinite pdf like f(x) = 0.3(0.7)^x for x = 0, 1, 2, ...: e^(tx)(0.7)^x = (0.7e^t)^x, so the MGF is 0.3 times a geometric series with first term 1 and ratio 0.7e^t, which sums to 0.3/(1 − 0.7e^t). It converges when 0.7e^t < 1, so t < −ln 0.7.',
      'Starting at x = 1, as in f(x) = (0.7)^(x−1)(0.3): write e^(tx) = e^t·e^(t(x−1)) and pull out 0.3e^t. The rest is Σ (0.7e^t)^(x−1), first term 1 again, so m_X(t) = 0.3e^t/(1 − 0.7e^t).',
      'Continuous: combine the exponentials (same base, add the exponents): e^(tx)·e^(−x) = e^(−(1 − t)x).',
      '∫ from 0 to ∞ of e^(−cx) dx = 1/c, but only if c > 0; otherwise it blows up. That condition is where the MGF exists: 1 − t > 0, so t < 1.',
      'With β: e^(tx)e^(−x/β) = e^(−(1/β − t)x), so m(t) = (1/β)·1/(1/β − t) = 1/(1 − βt) for t < 1/β. With rate λ: λ/(λ − t) for t < λ.',
      'Uniform: (1/(b − a)) ∫ from a to b of e^(tx) dx = (e^(bt) − e^(at))/((b − a)t). A finite interval always converges; t = 0 just gives m(0) = 1.',
    ],
  },
  templates: [
    {
      id: 'discrete-table',
      generate() {
        const xs = choice([
          [0, 1, 2],
          [1, 2, 3],
          [-1, 0, 1],
          [0, 1, 2, 3],
          [-1, 0, 1, 2],
          [1, 2, 3, 4],
        ])
        const ps = randProbs(xs.length)
        const fs = ps.map(v => v / 100)
        const last = xs.length - 1
        const zero = xs.indexOf(0)
        const unweighted = sumT(xs.map(x => [1, x]))
        // x and f(x) swapped; on −1, 0, 1 with f(−1) = f(1) that cancels to 0,
        // so then the values taken as equally likely
        const swapped = sumT(xs.map((x, i) => [x, fs[i]])) || `(${unweighted})/${xs.length}`
        return formula({
          ask: 'X has this pdf. Find its moment generating function and type m_X(t).',
          latex: stack(pdfTable(xs, ps), 'm_X(t) = \\,?'),
          size: 'small',
          vars: ['t'],
          points: SUM_POINTS,
          answer: sumT(xs.map((x, i) => [fs[i], x])),
          // e^(xt) unweighted, the derivative Σ x f(x)e^(xt), the roles swapped
          choices: [unweighted, sumT(xs.map((x, i) => [x * fs[i], x])), swapped],
          placeholder: 'm(t) in terms of t',
          hint: {
            latex: 'm_X(t) = E[e^{tX}] = \\sum_x e^{tx} f(x)',
            text: `One term per column, f(x) times e^(tx): the x = ${xs[last]} column gives ${sumT([[fs[last], xs[last]]])}${zero < 0 ? '' : `, and the x = 0 column gives the constant ${dec(fs[zero])} (e^0 = 1)`}. Check: at t = 0 the terms add to 1.`,
          },
        })
      },
    },
    {
      id: 'discrete-formula',
      generate() {
        const d = choice(FINITE_PDFS)
        const S = d.xs.reduce((s, x) => s + d.w(x), 0)
        const top = sumT(d.xs.map(x => [d.w(x), x]))
        // e^(E[X] t), pulling the expectation inside the exponential (or, when
        // E[X] = 0, the values taken as equally likely)
        const M = d.xs.reduce((s, x) => s + x * d.w(x), 0)
        const g = gcd(Math.abs(M), S)
        const kt = M / g === 1 ? 't' : M / g === -1 ? '-t' : `${M / g}t`
        const atMean = M === 0 ? `(${sumT(d.xs.map(x => [1, x]))})/${d.xs.length}` : S / g === 1 ? `e^(${kt})` : `e^(${kt}/${S / g})`
        return formula({
          ask: 'X has this pdf. Find its moment generating function and type m_X(t).',
          latex: stack(`f(x) = \\frac{${d.tex}}{${S}}, \\quad x = ${d.xs.join(', ')}`, 'm_X(t) = \\,?'),
          size: 'small',
          vars: ['t'],
          points: SUM_POINTS,
          answer: `(${top})/${S}`,
          choices: [top, `(${sumT(d.xs.map(x => [x * d.w(x), x]))})/${S}`, atMean],
          placeholder: 'm(t) in terms of t',
          hint: {
            latex: 'm_X(t) = \\sum_x e^{tx} f(x)',
            text: `List the values first: ${d.xs.map(x => `f(${minus(x)}) = ${d.w(x)}/${S}`).join(', ')}. Then add up f(x)e^(tx); the ${S} can stay as one common denominator.`,
          },
        })
      },
    },
    {
      id: 'discrete-series',
      generate() {
        const p = choice([0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8])
        const P = dec(p)
        const Q = dec(1 - p)
        // f(x) = pq^x from x = 0, or q^(x-1)p from x = 1
        const zero = Math.random() < 0.5
        const domain = `t < −ln ${Q}`
        const hint = zero
          ? {
              latex: '\\sum_{x=0}^{\\infty} e^{tx}\\,pq^x = p\\sum_{x=0}^{\\infty} (qe^t)^x = \\frac{p}{1 - qe^t}',
              text: `e^(tx)(${Q})^x = (${Q}e^t)^x, so pulling out ${P} leaves a geometric series with first term 1 (the x = 0 term) and ratio ${Q}e^t: first term over (1 − ratio). It converges when ${Q}e^t < 1, so ${domain}.`,
            }
          : {
              latex: '\\sum_{x=1}^{\\infty} e^{tx}\\,q^{x-1}p = pe^t\\sum_{x=1}^{\\infty} (qe^t)^{x-1} = \\frac{pe^t}{1 - qe^t}',
              text: `Write e^(tx) = e^t·e^(t(x−1)) and pull out ${P}e^t: what is left is Σ (${Q}e^t)^(x−1), a geometric series with first term 1 (the x = 1 term) and ratio ${Q}e^t. It converges when ${Q}e^t < 1, so ${domain}.`,
            }
        const step = choice(['final', 'final', 'ratio', 'sum'])
        if (step === 'final') {
          const pdf = zero ? `${P}(${Q})^x, \\quad x = 0, 1, 2, \\ldots` : `(${Q})^{x-1}(${P}), \\quad x = 1, 2, 3, \\ldots`
          return formula({
            ask: `X has this pdf. Find its moment generating function and type m_X(t) (for ${domain}).`,
            latex: stack(`f(x) = ${pdf}`, 'm_X(t) = \\,?'),
            size: 'small',
            vars: ['t'],
            points: SERIES_POINTS,
            answer: zero ? `${P}/(1-${Q}e^t)` : `${P}e^t/(1-${Q}e^t)`,
            // the other starting point's answer, p and q mixed up, the p left out
            choices: zero ? [`${P}e^t/(1-${Q}e^t)`, `${P}/(1-${P}e^t)`, `1/(1-${Q}e^t)`] : [`${P}/(1-${Q}e^t)`, `${P}e^t/(1-${P}e^t)`, `e^t/(1-${Q}e^t)`],
            placeholder: 'm(t) in terms of t',
            hint,
          })
        }
        const sum = `\\sum_{x=${zero ? 0 : 1}}^{\\infty}`
        const power = zero ? 'x' : '{x-1}'
        const lead = zero ? P : `${P}e^t` // what comes out in front of the series
        const def = `m_X(t) &= E[e^{tX}] = ${sum} e^{tx}${zero ? `(${P})(${Q})^x` : `(${Q})^{x-1}(${P})`}`
        if (step === 'ratio') {
          return box(
            ['t'],
            SERIES_POINTS,
            { ask: 'Write the MGF as a geometric series: what goes in the box?', latex: derivation([def, `&= ${lead}${sum} \\left(${BOX}\\right)^${power}`]), hint },
            { answer: `${Q}e^t`, choices: [`${P}e^t`, `e^(${Q}t)`, `${Q}+e^t`] },
          )
        }
        return box(
          ['t'],
          SERIES_POINTS,
          {
            ask: `Sum the geometric series (for ${domain}): what goes in the box?`,
            latex: derivation([def, `&= ${lead}${sum} (${Q}e^t)^${power}`, `&= ${lead}\\cdot ${BOX}`]),
            hint,
          },
          { answer: `1/(1-${Q}e^t)`, choices: [`${Q}e^t/(1-${Q}e^t)`, `1/(1-${P}e^t)`, `1/(1+${Q}e^t)`] },
        )
      },
    },
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
