import { randInt, choice, shuffle } from '../../../engine/rand.js'
import { randProbs } from '../util.js'
import { derivation, dec, lettered, num } from './util.js'

// Moments from a moment generating function: the notes' rule E[X^k] = m^(k)(0),
// on the MGFs the course meets (geometric, binomial, a finite pmf, gamma,
// exponential, chi-squared, normal), plus naming the distribution an MGF belongs to.

// The moments a problem can ask for, as written under the MGF.
const ASK = { mean: 'E[X]', second: 'E[X^2]', var: '\\operatorname{Var}X' }

// m_X(t) on the first line, the moment to find on the second.
const show = (mgf, what) => derivation([`m_X(t) &= ${mgf}`, `${what} &= \\,?`])

const tolM = v => Math.max(0.005, Math.abs(v) * 0.002)

// v squared, written with parentheses when v is negative
const sq = v => (v < 0 ? `(${num(v)})^2` : `${num(v)}^2`)

// Var X = m''(0) - [m'(0)]^2 with the numbers in
const varLine = (second, mean, v) => `m_X''(0) - [m_X'(0)]^2 = ${num(second)} - ${sq(mean)} = ${num(v)}`

const minus = v => (v < 0 ? `−${-v}` : `${v}`) // a number in plain text, with a real minus sign

// "kt" with the coefficient written the usual way: t, -t, 3t, -2t
const coefT = k => (k === 1 ? 't' : k === -1 ? '-t' : `${k}t`)

// The normal MGF e^{mu t + sigma^2 t^2 / 2}, as it would be printed.
function normalMgf(mu, s2) {
  const quad = s2 % 2 === 0 ? `${s2 / 2}t^2` : `${s2 === 1 ? '' : s2}t^2/2`
  return `e^{${coefT(mu)} + ${quad}}`
}

// (1 - 2t)^{-k/2}: an integer power when k is even
const halfPow = k => (k % 2 === 0 ? `-${k / 2}` : `-${k}/2`)

// Gamma, exponential, chi-squared or normal: the MGF, its moments, the first
// two derivatives written out, and the mistakes people make with each.
function continuousCase() {
  const fam = choice(['gamma', 'exponential', 'chi', 'normal'])
  if (fam === 'gamma') {
    const a = randInt(2, 5)
    const b = choice([0.5, 2, 3, 4, 5])
    const B = dec(b)
    const mean = a * b
    const v = a * b * b
    const second = a * (a + 1) * b * b
    return {
      mgf: `(1 - ${B}t)^{-${a}}`,
      mean,
      second,
      v,
      d1: `m_X'(t) = ${a}(${B})(1 - ${B}t)^{-${a + 1}}`,
      d2: `m_X''(t) = ${a}(${a + 1})(${B})^2(1 - ${B}t)^{-${a + 2}}`,
      wrong: { mean: [a, v, b], second: [v, mean * mean, mean], var: [second, mean, a * a * b] },
      hint: {
        latex: "m_X(t) = (1 - \\beta t)^{-\\alpha}: \\quad m_X'(0) = \\alpha\\beta, \\quad m_X''(0) = \\alpha(\\alpha + 1)\\beta^2",
        text: `Gamma MGF with α = ${a} and β = ${B}. Each derivative brings down the power and a factor of β (chain rule), and at t = 0 the base is 1. The variance comes out to αβ².`,
      },
    }
  }
  if (fam === 'exponential') {
    const b = choice([0.5, 2, 3, 4, 5, 10])
    const B = dec(b)
    return {
      mgf: `\\frac{1}{1 - ${B}t}`,
      mean: b,
      second: 2 * b * b,
      v: b * b,
      d1: `m_X'(t) = ${B}(1 - ${B}t)^{-2}`,
      d2: `m_X''(t) = 2(${B})^2(1 - ${B}t)^{-3}`,
      wrong: { mean: [1 / b, b * b, 2 * b], second: [b * b, 2 * b, 4 * b * b], var: [2 * b * b, b, 1 / (b * b)] },
      hint: {
        latex: "m_X(t) = (1 - \\beta t)^{-1}: \\quad m_X'(0) = \\beta, \\quad m_X''(0) = 2\\beta^2",
        text: `Exponential MGF (gamma with α = 1) with β = ${B}. Write it as (1 − βt)^(−1) and use the chain rule. The mean is β and the variance is β².`,
      },
    }
  }
  if (fam === 'chi') {
    const g = randInt(1, 20)
    return {
      mgf: `(1 - 2t)^{${halfPow(g)}}`,
      mean: g,
      second: g * (g + 2),
      v: 2 * g,
      d1: `m_X'(t) = ${g}(1 - 2t)^{${halfPow(g + 2)}}`,
      d2: `m_X''(t) = ${g}(${g + 2})(1 - 2t)^{${halfPow(g + 4)}}`,
      wrong: { mean: [g / 2, 2 * g, g * g], second: [2 * g, g * g, g * (g + 1)], var: [g * (g + 2), g, 4 * g] },
      hint: {
        latex: "m_X(t) = (1 - 2t)^{-\\gamma/2}: \\quad m_X'(0) = \\gamma, \\quad m_X''(0) = \\gamma(\\gamma + 2)",
        text: `Chi-squared with γ = ${g} degrees of freedom: gamma with α = γ/2 and β = 2. The chain rule brings down −γ/2 and −2, so m′(0) = γ. The variance is 2γ.`,
      },
    }
  }
  const mu = choice([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 10])
  const s2 = choice([1, 4, 9, 16, 25])
  const mgf = normalMgf(mu, s2)
  const lin = `(${mu} + ${s2 === 1 ? '' : s2}t)`
  return {
    mgf,
    mean: mu,
    second: s2 + mu * mu,
    v: s2,
    d1: `m_X'(t) = ${lin}${mgf}`,
    d2: `m_X''(t) = [${s2} + ${lin}^2]${mgf}`,
    wrong: { mean: [s2 / 2, s2, -mu], second: [s2, mu * mu, s2 / 2 + mu * mu], var: [s2 / 2, s2 + mu * mu, Math.sqrt(s2)] },
    hint: {
      latex: "m_X(t) = e^{\\mu t + \\sigma^2 t^2/2}: \\quad m_X'(0) = \\mu, \\quad m_X''(0) = \\sigma^2 + \\mu^2",
      text: `Normal MGF: the coefficient of t is μ = ${minus(mu)}, and the coefficient of t² is σ²/2, so σ² = ${s2}. Differentiating brings down (μ + σ²t) each time.`,
    },
  }
}

// "Describe the distribution": the MGF, the right description, three near misses.
const IDENTIFY = {
  geometric() {
    const p = choice([0.1, 0.2, 0.25, 0.4, 0.8])
    const P = dec(p)
    const Q = dec(1 - p)
    return {
      mgf: `\\frac{${P}e^t}{1 - ${Q}e^t}`,
      right: `geometric with p = ${P}`,
      wrong: [`geometric with p = ${Q}`, `binomial with n = 1 and p = ${P}`, `exponential with β = ${dec(1 / p)}`],
      hint: {
        latex: '\\frac{pe^t}{1 - qe^t} \\;\\text{ is geometric}',
        text: `A fraction with pe^t on top and 1 − qe^t below is the geometric MGF. p is the number on top (${P}); the number subtracted below is q = 1 − p = ${Q}.`,
      },
    }
  },
  binomial() {
    const n = randInt(3, 15)
    const p = choice([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.9])
    const P = dec(p)
    const Q = dec(1 - p)
    return {
      mgf: `(${Q} + ${P}e^t)^{${n}}`,
      right: `binomial with n = ${n} and p = ${P}`,
      wrong: [`binomial with n = ${n} and p = ${Q}`, `geometric with p = ${P}`, `normal with μ = ${num(n * p)} and σ² = ${num(n * p * (1 - p))}`],
      hint: {
        latex: '(q + pe^t)^n \\;\\text{ is binomial}',
        text: `The power is n = ${n} and the coefficient of e^t is p = ${P}. A normal with the same mean np and variance npq has a different MGF, so it is a different distribution.`,
      },
    }
  },
  gamma() {
    const a = randInt(2, 6)
    const b = choice([0.5, 3, 4, 5, 10].filter(v => v !== a))
    const B = dec(b)
    return {
      mgf: `(1 - ${B}t)^{-${a}}`,
      right: `gamma with α = ${a} and β = ${B}`,
      wrong: [`gamma with α = ${B} and β = ${a}`, `exponential with β = ${B}`, `chi-squared with γ = ${2 * a}`],
      hint: {
        latex: '(1 - \\beta t)^{-\\alpha} \\;\\text{ is gamma}',
        text: `β is the number multiplying t inside the parentheses (${B}); α is the power without its minus sign (${a}). It is chi-squared only when β = 2.`,
      },
    }
  },
  exponential() {
    const b = choice([0.5, 4, 5, 10])
    const B = dec(b)
    return {
      mgf: `\\frac{1}{1 - ${B}t}`,
      right: `exponential with β = ${B}`,
      wrong: [`exponential with β = ${dec(1 / b)}`, `gamma with α = ${B} and β = 1`, `normal with μ = ${B} and σ² = ${dec(b * b)}`],
      hint: {
        latex: '\\frac{1}{1 - \\beta t} = (1 - \\beta t)^{-1}',
        text: `Gamma with α = 1 is exponential, and β is the number multiplying t (${B}). β is the mean; the rate λ is 1/β.`,
      },
    }
  },
  chi() {
    const g = randInt(3, 12)
    const wrong =
      g % 2 === 0
        ? [`chi-squared with γ = ${g / 2}`, `gamma with α = ${g} and β = 2`, `normal with μ = ${g} and σ² = ${2 * g}`]
        : [`gamma with α = ${g} and β = 2`, `exponential with β = 2`, `normal with μ = ${g} and σ² = ${2 * g}`]
    return {
      mgf: `(1 - 2t)^{${halfPow(g)}}`,
      right: `chi-squared with γ = ${g}`,
      wrong,
      hint: {
        latex: '(1 - 2t)^{-\\gamma/2} \\;\\text{ is chi-squared}',
        text: `Chi-squared is gamma with β = 2 and α = γ/2, so the degrees of freedom are twice the power: γ = 2 × ${g % 2 === 0 ? g / 2 : `${g}/2`} = ${g}.`,
      },
    }
  },
  normal() {
    const mu = choice([-4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
    const s2 = choice([1, 4, 9, 16])
    return {
      mgf: normalMgf(mu, s2),
      right: `normal with μ = ${minus(mu)} and σ² = ${s2}`,
      wrong: [
        `normal with μ = ${minus(mu)} and σ² = ${dec(s2 / 2)}`,
        `normal with μ = ${minus(mu)} and σ² = ${2 * s2}`,
        `normal with μ = ${minus(-mu)} and σ² = ${s2}`,
      ],
      hint: {
        latex: 'e^{\\mu t + \\sigma^2 t^2/2} \\;\\text{ is normal}',
        text: `The coefficient of t is μ (${minus(mu)}). The coefficient of t² is σ²/2, so double it: σ² = ${s2}.`,
      },
    }
  },
}

// Which expression in m_X and its derivatives gives each quantity.
const WHICH = [
  {
    q: 'E[X]',
    right: "m_X'(0)",
    wrong: ['m_X(0)', "m_X''(0)", "m_X'(1)"],
    hint: {
      latex: "m_X'(t) = E[Xe^{tX}] \\;\\Rightarrow\\; m_X'(0) = E[X]",
      text: 'One derivative brings down one X. Evaluate at t = 0 so e^(tX) becomes 1; at t = 1 you would get E[Xe^X] instead.',
    },
  },
  {
    q: 'E[X^2]',
    right: "m_X''(0)",
    wrong: ["[m_X'(0)]^2", "m_X''(0) - [m_X'(0)]^2", "m_X'(0)"],
    hint: {
      latex: "m_X''(t) = E[X^2e^{tX}] \\;\\Rightarrow\\; m_X''(0) = E[X^2]",
      text: 'Two derivatives bring down X twice. [m′(0)]² is (E[X])², a different number.',
    },
  },
  {
    q: '\\operatorname{Var}X',
    right: "m_X''(0) - [m_X'(0)]^2",
    wrong: ["m_X''(0)", "[m_X'(0)]^2 - m_X''(0)", "m_X''(0) - m_X'(0)"],
    hint: {
      latex: "\\operatorname{Var}X = E[X^2] - (E[X])^2 = m_X''(0) - [m_X'(0)]^2",
      text: 'The shortcut formula for the variance, with each moment read off a derivative at t = 0. Square the first derivative before subtracting.',
    },
  },
  {
    q: 'E[X^3]',
    right: "m_X'''(0)",
    wrong: ["[m_X'(0)]^3", "m_X''(0)\\,m_X'(0)", "3m_X'(0)"],
    hint: {
      latex: 'E[X^k] = m_X^{(k)}(0)',
      text: 'The k-th derivative at 0 is the k-th moment. Moments do not multiply: E[X³] is not (E[X])³.',
    },
  },
  {
    q: '\\sigma',
    right: "\\sqrt{m_X''(0) - [m_X'(0)]^2}",
    wrong: ["m_X''(0) - [m_X'(0)]^2", "\\sqrt{m_X''(0)} - m_X'(0)", "\\sqrt{m_X''(0)}"],
    hint: {
      latex: "\\sigma = \\sqrt{\\operatorname{Var}X} = \\sqrt{m_X''(0) - [m_X'(0)]^2}",
      text: 'Find the variance first, then take the square root of the whole difference.',
    },
  },
  {
    q: 'm_X(0)',
    right: '1',
    wrong: ['0', 'E[X]', 'e'],
    hint: {
      latex: 'm_X(0) = E[e^{0 \\cdot X}] = E[1] = 1',
      text: 'At t = 0, e^(tX) = 1 for every outcome. Every MGF passes through (0, 1): a quick check on your algebra.',
    },
  },
]

export default {
  id: 'mgf',
  name: 'Moment generating functions',
  description: '§3.4, §4.2–4.4: moments from an MGF, discrete or continuous.',
  learn: {
    formulas: [
      { label: 'Definition', latex: 'm_X(t) = E[e^{tX}] = \\sum_x e^{tx}f(x) \\;\\text{ or }\\; \\int_{-\\infty}^{\\infty} e^{tx}f(x)\\,dx' },
      { label: 'Moments', latex: 'E[X^k] = \\frac{d^k m_X(t)}{dt^k}\\bigg|_{t=0}, \\qquad m_X(0) = 1' },
      { label: 'Mean and variance', latex: "E[X] = m_X'(0), \\quad \\operatorname{Var}X = m_X''(0) - [m_X'(0)]^2" },
      {
        label: 'Geometric and binomial (q = 1 − p)',
        latex: '\\frac{pe^t}{1 - qe^t}: \\; \\mu = \\frac{1}{p},\\; \\sigma^2 = \\frac{q}{p^2} \\qquad (q + pe^t)^n: \\; \\mu = np,\\; \\sigma^2 = npq',
      },
      {
        label: 'Gamma (exponential: α = 1; chi-squared: β = 2, α = γ/2)',
        latex: '(1 - \\beta t)^{-\\alpha}: \\; \\mu = \\alpha\\beta,\\; \\sigma^2 = \\alpha\\beta^2',
      },
      { label: 'Normal', latex: 'e^{\\mu t + \\sigma^2 t^2/2}: \\; \\text{mean } \\mu,\\; \\text{variance } \\sigma^2' },
    ],
    how: [
      'Each derivative of m_X(t) = E[e^(tX)] brings down one more factor of X. At t = 0, e^(tX) = 1, so m′(0) = E[X], m″(0) = E[X²], m‴(0) = E[X³].',
      'Variance takes both: Var X = m″(0) − [m′(0)]². m″(0) by itself is E[X²], not the variance.',
      'A finite sum like 0.2 + 0.5e^t + 0.3e^(2t) is Σ e^(tx) f(x): each exponent is a value x and its coefficient is f(x). So E[X] = 0(0.2) + 1(0.5) + 2(0.3).',
      'Powers like (q + pe^t)^n or (1 − βt)^(−α): chain rule, then put t = 0, where the inside equals 1.',
      'Know the families to check your answer: pe^t/(1 − qe^t) is geometric, (q + pe^t)^n binomial, (1 − βt)^(−α) gamma (exponential if α = 1, chi-squared with γ = 2α if β = 2), e^(μt + σ²t²/2) normal.',
      'The MGF determines the distribution: 0.4e^t/(1 − 0.6e^t) is geometric with p = 0.4. Matching only the mean and variance is not enough.',
    ],
  },
  templates: [
    {
      id: 'geometric',
      generate() {
        const p = choice([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8])
        const q = 1 - p
        const P = dec(p)
        const Q = dec(q)
        const mean = 1 / p
        const second = (1 + q) / (p * p)
        const v = q / (p * p)
        const what = choice(['mean', 'second', 'var'])
        const by = {
          mean: {
            ans: mean,
            shown: `m_X'(0) = \\frac{${P}}{(1 - ${Q})^2} = \\frac{1}{${P}} = ${num(mean)}`,
            wrong: [q / p, 1 / q, second],
            hint: {
              latex: "m_X'(t) = \\frac{pe^t}{(1 - qe^t)^2} \\;\\Rightarrow\\; m_X'(0) = \\frac{p}{p^2} = \\frac{1}{p}",
              text: `This is the geometric MGF pe^t/(1 − qe^t) with p = ${P}. Quotient rule, then t = 0, where 1 − q = p.`,
            },
          },
          second: {
            ans: second,
            shown: `m_X''(0) = \\frac{${P}(1 + ${Q})}{(1 - ${Q})^3} = \\frac{${dec(1 + q)}}{${dec(p * p)}} = ${num(second)}`,
            wrong: [v, 1 / (p * p), 2 / (p * p)],
            hint: {
              latex: "m_X''(t) = \\frac{pe^t(1 + qe^t)}{(1 - qe^t)^3} \\;\\Rightarrow\\; m_X''(0) = \\frac{1 + q}{p^2}",
              text: 'Differentiate m′(t) = pe^t/(1 − qe^t)² again, then set t = 0. E[X²] is m″(0) itself: nothing is subtracted.',
            },
          },
          var: {
            ans: v,
            shown: varLine(second, mean, v),
            wrong: [second, 1 / (p * p), q / p],
            hint: {
              latex: "\\operatorname{Var}X = m_X''(0) - [m_X'(0)]^2 = \\frac{1 + q}{p^2} - \\frac{1}{p^2} = \\frac{q}{p^2}",
              text: `m″(0) is E[X²], not the variance: subtract the squared mean. For the geometric MGF this always gives q/p², here with p = ${P}.`,
            },
          },
        }[what]
        return {
          ask: 'X has this moment generating function.',
          latex: show(`\\frac{${P}e^t}{1 - ${Q}e^t}`, ASK[what]),
          size: 'small',
          answer: by.ans,
          answerLatex: by.shown,
          placeholder: 'e.g. 2.5',
          tolerance: tolM(by.ans),
          hint: by.hint,
          distractors: by.wrong.filter(w => Math.abs(w - by.ans) > 1e-9),
        }
      },
    },
    {
      id: 'binomial',
      generate() {
        const n = randInt(4, 20)
        const p = choice([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9])
        const q = 1 - p
        const P = dec(p)
        const Q = dec(q)
        const inner = Math.random() < 0.7 ? `${Q} + ${P}e^t` : `${P}e^t + ${Q}`
        const mean = n * p
        const second = n * (n - 1) * p * p + n * p
        const v = n * p * q
        const what = choice(['mean', 'second', 'var'])
        const by = {
          mean: {
            ans: mean,
            shown: `m_X'(t) = ${n}(${inner})^{${n - 1}}(${P}e^t) \\;\\Rightarrow\\; m_X'(0) = ${n}(${P}) = ${num(mean)}`,
            wrong: [n * q, n * p * p, v],
            hint: {
              latex: "m_X'(t) = n(q + pe^t)^{n-1}pe^t \\;\\Rightarrow\\; m_X'(0) = np",
              text: `Binomial MGF (q + pe^t)^n with n = ${n} and p = ${P}, the coefficient of e^t. Chain rule, then t = 0, where q + p = 1.`,
            },
          },
          second: {
            ans: second,
            shown: `m_X''(0) = n(n - 1)p^2 + np = ${n}(${n - 1})(${P})^2 + ${num(mean)} = ${num(second)}`,
            wrong: [v, mean * mean, n * (n - 1) * p * p],
            hint: {
              latex: "m_X''(t) = n(n-1)(q + pe^t)^{n-2}(pe^t)^2 + n(q + pe^t)^{n-1}pe^t",
              text: 'Product rule on n(q + pe^t)^(n−1)pe^t, then t = 0: n(n − 1)p² + np. That is E[X²]; do not subtract anything.',
            },
          },
          var: {
            ans: v,
            shown: varLine(second, mean, v),
            wrong: [second, mean, n * p * p],
            hint: {
              latex: "\\operatorname{Var}X = m_X''(0) - [m_X'(0)]^2 = n(n-1)p^2 + np - (np)^2 = npq",
              text: `Subtract the squared mean from m″(0). For a binomial MGF this always simplifies to npq, here n = ${n}, p = ${P}, q = ${Q}.`,
            },
          },
        }[what]
        return {
          ask: 'X has this moment generating function.',
          latex: show(`(${inner})^{${n}}`, ASK[what]),
          size: 'small',
          answer: by.ans,
          answerLatex: by.shown,
          placeholder: 'e.g. 4.8',
          tolerance: tolM(by.ans),
          hint: by.hint,
          distractors: by.wrong.filter(w => Math.abs(w - by.ans) > 1e-9),
        }
      },
    },
    {
      id: 'finite',
      generate() {
        const count = choice([3, 3, 4])
        const xs = shuffle([-2, -1, 0, 1, 2, 3, 4])
          .slice(0, count)
          .sort((a, b) => a - b)
        const ps = randProbs(count).map(v => v / 100)
        const term = (x, w) => (x === 0 ? dec(w) : `${dec(w)}e^{${coefT(x)}}`)
        const mgf = xs.map((x, i) => term(x, ps[i])).join(' + ')
        const E = g => xs.reduce((s, x, i) => s + g(x) * ps[i], 0)
        const mean = E(x => x)
        const second = E(x => x * x)
        const v = second - mean * mean
        const paren = x => (x < 0 ? `(${x})` : `${x}`)
        const what = choice(['mean', 'second', 'var', 'pmf'])
        let by
        if (what === 'pmf') {
          const i = randInt(0, count - 1)
          const k = xs[i]
          by = {
            q: `P(X = ${k})`,
            ans: ps[i],
            shown: `P(X = ${k}) = ${k === 0 ? '\\text{the constant term}' : `\\text{the coefficient of } e^{${coefT(k)}}`} = ${dec(ps[i])}`,
            wrong: ps.filter((_, j) => j !== i),
            tol: 0.005,
            hint: {
              latex: 'm_X(t) = \\sum_x e^{tx} f(x)',
              text: `For a discrete X the MGF is a sum of e^(xt) times P(X = x). Read the ${k === 0 ? 'constant term (e^0 = 1)' : `coefficient on e^(${coefT(k)})`}.`,
            },
          }
        } else if (what === 'mean') {
          by = {
            q: ASK.mean,
            ans: mean,
            shown: `m_X'(0) = ${xs.map((x, i) => `${paren(x)}(${dec(ps[i])})`).join(' + ')} = ${num(mean)}`,
            wrong: [xs.reduce((a, b) => a + b, 0) / count, second, mean * mean],
            hint: {
              latex: "m_X(t) = \\sum_x e^{tx}f(x) \\;\\Rightarrow\\; m_X'(0) = \\sum_x x\\,f(x)",
              text: 'Each term c·e^(xt) says P(X = x) = c. One derivative brings down x, and t = 0 turns every e^(xt) into 1.',
            },
          }
        } else if (what === 'second') {
          by = {
            q: ASK.second,
            ans: second,
            shown: `m_X''(0) = ${xs.map((x, i) => `${paren(x)}^2(${dec(ps[i])})`).join(' + ')} = ${num(second)}`,
            wrong: [mean * mean, v, mean],
            hint: {
              latex: "m_X''(0) = \\sum_x x^2 f(x)",
              text: 'Two derivatives bring down x², then t = 0. Square each exponent, weight it by its coefficient, and add.',
            },
          }
        } else {
          by = {
            q: ASK.var,
            ans: v,
            shown: varLine(second, mean, v),
            wrong: [second, second - mean, mean * mean],
            hint: {
              latex: "\\operatorname{Var}X = m_X''(0) - [m_X'(0)]^2 = \\sum_x x^2 f(x) - \\Big(\\sum_x x\\,f(x)\\Big)^2",
              text: 'Get E[X²] and E[X] from the terms (exponent times coefficient), then subtract the squared mean.',
            },
          }
        }
        return {
          ask: 'X has this moment generating function.',
          latex: show(mgf, by.q),
          size: 'small',
          answer: by.ans,
          answerLatex: by.shown,
          placeholder: 'e.g. 1.1',
          tolerance: by.tol ?? tolM(by.ans),
          hint: by.hint,
          distractors: by.wrong.filter(w => Math.abs(w - by.ans) > 1e-9),
        }
      },
    },
    {
      id: 'continuous',
      generate() {
        const c = continuousCase()
        const what = choice(['mean', 'second', 'var'])
        const ans = what === 'mean' ? c.mean : what === 'second' ? c.second : c.v
        const shown =
          what === 'mean'
            ? `${c.d1} \\;\\Rightarrow\\; m_X'(0) = ${num(c.mean)}`
            : what === 'second'
              ? `${c.d2} \\;\\Rightarrow\\; m_X''(0) = ${num(c.second)}`
              : varLine(c.second, c.mean, c.v)
        return {
          ask: 'X has this moment generating function.',
          latex: show(c.mgf, ASK[what]),
          size: 'small',
          answer: ans,
          answerLatex: shown,
          placeholder: 'e.g. 12',
          tolerance: tolM(ans),
          hint: c.hint,
          distractors: c.wrong[what].filter(w => Math.abs(w - ans) > 1e-9),
        }
      },
    },
    {
      id: 'identify',
      generate() {
        const c = IDENTIFY[choice(Object.keys(IDENTIFY))]()
        return {
          ask: 'Which distribution has this moment generating function?',
          latex: `m_X(t) = ${c.mgf}`,
          ...lettered(c.right, shuffle(c.wrong)),
          placeholder: 'a, b, c or d',
          hint: c.hint,
        }
      },
    },
    {
      id: 'which',
      generate() {
        const w = choice(WHICH)
        return {
          ask: 'Which expression gives this?',
          latex: `${w.q} = \\,?`,
          ...lettered({ latex: w.right }, shuffle(w.wrong).map(latex => ({ latex }))),
          placeholder: 'a, b, c or d',
          hint: w.hint,
        }
      },
    },
  ],
}
