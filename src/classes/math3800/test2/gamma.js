import { randInt, choice } from '../../../engine/rand.js'
import { lnGamma } from '../dist.js'
import { dec, num } from './util.js'

// §4.3: the gamma function, the integral behind every gamma pdf, the constant
// that makes A x^m e^{-x/β} a pdf, and the gamma mean and variance. Answers are
// exact: factorials, products of half-integers, and whole-number (or β = 1/2,
// written e^{-2x}) scales.

const fact = n => {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}
// Γ(α + k)/Γ(α) = α(α + 1)···(α + k − 1)
const rising = (a, k) => {
  let p = 1
  for (let i = 0; i < k; i++) p *= a + i
  return p
}
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))

// pieces of an integrand: x, x^{2}; e^{-x/3}, e^{-x}, e^{-2x} (β = 1/2)
const xPow = m => (m === 1 ? 'x' : `x^{${m}}`)
const expo = b => (b === 0.5 ? 'e^{-2x}' : b === 1 ? 'e^{-x}' : `e^{-x/${b}}`)
const bPow = (b, k) => (b === 0.5 ? `\\left(\\tfrac{1}{2}\\right)^{${k}}` : `${b}^{${k}}`)
// a half-integer argument as 2.5, or as \tfrac{5}{2}
const arg = (a, frac) => (frac && !Number.isInteger(a) ? `\\tfrac{${2 * a}}{2}` : dec(a))
const G = (a, frac) => (frac && !Number.isInteger(a) ? `\\Gamma\\left(${arg(a, true)}\\right)` : `\\Gamma(${dec(a)})`)
// Γ(a) to 4 decimals, as a problem would hand it to you
const gammaValue = a => Number(Math.exp(lnGamma(a)).toFixed(4))

const HINT_GAMMA = {
  latex: '\\Gamma(\\alpha) = \\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz, \\quad \\Gamma(n+1) = n!',
  text: 'α is one more than the power of z: ∫ z³e^(−z) dz = Γ(4) = 3! = 6. So Γ(n) = (n − 1)!, not n!.',
}
const HINT_SCALE = {
  latex: '\\int_0^{\\infty} x^{\\alpha-1}e^{-x/\\beta}\\,dx = \\Gamma(\\alpha)\\,\\beta^{\\alpha}',
  text: 'α is one more than the power of x, and β divides x in the exponent (e^(−2x) means β = 1/2). Substituting z = x/β turns the integral into β^α times Γ(α).',
}

export default {
  id: 'gamma',
  name: 'Gamma function and gamma distribution',
  description: '§4.3: Γ integrals, the constant that makes a pdf, mean and variance.',
  learn: {
    formulas: [
      { label: 'Gamma function (on the sheet)', latex: '\\Gamma(\\alpha) = \\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz' },
      { label: 'Properties', latex: '\\begin{gathered} \\Gamma(\\alpha+1) = \\alpha\\,\\Gamma(\\alpha) \\\\ \\Gamma(1) = 1, \\quad \\Gamma(n+1) = n! \\end{gathered}' },
      { label: 'With a scale β', latex: '\\int_0^{\\infty} x^{\\alpha-1}e^{-x/\\beta}\\,dx = \\Gamma(\\alpha)\\,\\beta^{\\alpha}' },
      { label: 'Gamma pdf, x > 0 (on the sheet)', latex: 'f(x) = \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}\\,x^{\\alpha-1}e^{-x/\\beta}' },
      { label: 'Mean and variance', latex: '\\mu = \\alpha\\beta, \\quad \\sigma^2 = \\alpha\\beta^2' },
      { label: 'Chi-squared, γ degrees of freedom', latex: '\\begin{gathered} \\alpha = \\tfrac{\\gamma}{2}, \\quad \\beta = 2 \\\\ \\mu = \\gamma, \\quad \\sigma^2 = 2\\gamma \\end{gathered}' },
    ],
    how: [
      'Match the integral to Γ: the power of z is α − 1. ∫ z³e^(−z) dz is Γ(4) = 3! = 6. Being off by one here is the classic slip.',
      'Not a whole number? Step with Γ(α + 1) = αΓ(α): Γ(4.5) = 3.5 · 2.5 · Γ(2.5). So Γ(α + k)/Γ(α) = α(α + 1)···(α + k − 1).',
      'With a scale: ∫ x^(α−1)e^(−x/β) dx = Γ(α)β^α. For x²e^(−x/3): α = 3, β = 3, so 2! · 3³ = 54. Read e^(−2x) as β = 1/2.',
      'The A that makes A·x^(α−1)e^(−x/β) a pdf is 1 over that integral: A = 1/(Γ(α)β^α). For x²e^(−x/3), A = 1/54.',
      'Read α and β off the pdf (α = power of x plus 1), then μ = αβ and σ² = αβ².',
      'Chi-squared with γ degrees of freedom is gamma with α = γ/2 and β = 2, so μ = γ and σ² = 2γ.',
    ],
  },
  templates: [
    {
      id: 'factorial',
      generate() {
        if (Math.random() < 0.65) {
          const n = randInt(2, 7)
          const ans = fact(n)
          return {
            ask: 'Evaluate with the gamma function.',
            latex: `\\int_0^{\\infty} z^{${n}}e^{-z}\\,dz = \\,?`,
            answer: ans,
            answerLatex: `\\Gamma(${n + 1}) = ${n}! = ${ans}`,
            placeholder: 'e.g. 6',
            tolerance: 0.001,
            hint: HINT_GAMMA,
            distractors: [fact(n - 1), fact(n + 1), n],
          }
        }
        const k = randInt(3, 8)
        const ans = fact(k - 1)
        return {
          ask: 'Evaluate the gamma function.',
          latex: `\\Gamma(${k}) = \\,?`,
          answer: ans,
          answerLatex: `\\Gamma(${k}) = ${k - 1}! = ${ans}`,
          placeholder: 'e.g. 24',
          tolerance: 0.001,
          hint: HINT_GAMMA,
          distractors: [fact(k), fact(k - 2), k],
        }
      },
    },
    {
      id: 'recursion',
      generate() {
        const frac = Math.random() < 0.4
        const kind = choice(['ratio', 'ratio', 'up', 'down'])
        const a = choice([0.5, 1.5, 2.5, 3.5, 4.5])
        const k = randInt(1, kind === 'ratio' ? 3 : 2)
        const prod = rising(a, k)
        // the factors α + k − 1, ..., α, largest first
        const factors = Array.from({ length: k }, (_, i) => arg(a + k - 1 - i, frac)).join(' \\cdot ')
        const hint = {
          latex: '\\Gamma(\\alpha+1) = \\alpha\\,\\Gamma(\\alpha) \\;\\Rightarrow\\; \\Gamma(\\alpha+k) = (\\alpha+k-1)\\cdots(\\alpha+1)\\,\\alpha\\,\\Gamma(\\alpha)',
          text: 'Peel one step at a time: each step down multiplies by the number one below the argument. Γ(4.5) = 3.5 · Γ(3.5) = 3.5 · 2.5 · Γ(2.5).',
        }
        if (kind === 'ratio') {
          return {
            ask: 'Use Γ(α + 1) = αΓ(α).',
            latex: `\\frac{${G(a + k, frac)}}{${G(a, frac)}} = \\,?`,
            answer: prod,
            answerLatex: `${G(a + k, frac)} = ${factors} \\cdot ${G(a, frac)}, \\text{ so the ratio} = ${num(prod)}`,
            placeholder: 'e.g. 8.75',
            tolerance: Math.max(0.001, prod * 0.001),
            hint,
            distractors: [rising(a + 1, k), rising(a, k + 1), k > 1 ? rising(a, k - 1) : a + 1],
          }
        }
        if (kind === 'up') {
          const v = gammaValue(a)
          const ans = v * prod
          return {
            ask: 'Use Γ(α + 1) = αΓ(α) to step from the value given.',
            latex: `\\begin{gathered} ${G(a, frac)} \\approx ${v} \\\\ ${G(a + k, frac)} = \\,? \\end{gathered}`,
            answer: ans,
            answerLatex: `${G(a + k, frac)} = ${factors} \\cdot ${v} = ${num(ans)}`,
            placeholder: 'e.g. 11.63',
            tolerance: Math.max(0.0005, ans * 0.002),
            hint,
            distractors: [v * rising(a + 1, k), v * rising(a, k + 1), v * (a + k)],
          }
        }
        // down: from Γ(α + k), divide back to Γ(α)
        const v = gammaValue(a + k)
        const ans = v / prod
        return {
          ask: 'Use Γ(α + 1) = αΓ(α) to step down from the value given.',
          latex: `\\begin{gathered} ${G(a + k, frac)} \\approx ${v} \\\\ ${G(a, frac)} = \\,? \\end{gathered}`,
          answer: ans,
          answerLatex: `${G(a, frac)} = \\frac{${G(a + k, frac)}}{${factors}} = \\frac{${v}}{${factors}} = ${num(ans)}`,
          placeholder: 'e.g. 1.329',
          tolerance: Math.max(0.0005, ans * 0.002),
          hint,
          distractors: [v * prod, v / rising(a + 1, k), v / (a + k)],
        }
      },
    },
    {
      id: 'integral',
      generate() {
        const m = randInt(1, 4)
        const b = choice(m <= 2 ? [2, 3, 4, 5, 0.5] : [2, 3, 0.5])
        const scale = b ** (m + 1)
        const ans = fact(m) * scale
        return {
          ask: 'Evaluate with the gamma function.',
          latex: `\\int_0^{\\infty} ${xPow(m)}\\,${expo(b)}\\,dx = \\,?`,
          answer: ans,
          answerLatex: `\\alpha = ${m + 1},\\; \\beta = ${b === 0.5 ? '\\tfrac{1}{2}' : b}: \\; \\Gamma(${m + 1})\\,${bPow(b, m + 1)} = ${m}! \\cdot ${num(scale)} = ${num(ans)}`,
          placeholder: 'e.g. 54',
          tolerance: Math.max(0.0005, ans * 0.001),
          hint: HINT_SCALE,
          distractors: [fact(m) * b ** m, fact(m + 1) * scale, fact(m) * (1 / b) ** (m + 1), fact(m - 1) * b ** m],
        }
      },
    },
    {
      id: 'constant',
      generate() {
        const m = randInt(1, 4)
        const b = choice(m <= 2 ? [2, 3, 4, 5, 0.5] : [2, 3, 0.5])
        const I = fact(m) * b ** (m + 1)
        const ans = 1 / I
        // A as a reduced fraction: 1/54, or 2^(m+1)/m! when β = 1/2
        let top = 1
        let bottom = I
        if (b === 0.5) {
          top = 2 ** (m + 1)
          bottom = fact(m)
        }
        const g = gcd(top, bottom)
        top /= g
        bottom /= g
        const shown = bottom === 1 ? `${top}` : `\\frac{${top}}{${bottom}}`
        return {
          ask: 'Find the A that makes f a pdf on x > 0.',
          latex: `f(x) = A\\,${xPow(m)}\\,${expo(b)}`,
          answer: ans,
          answerLatex: `A = \\frac{1}{\\Gamma(${m + 1})\\,${bPow(b, m + 1)}} = ${shown}`,
          placeholder: 'e.g. 1/54',
          tolerance: ans * 0.005,
          hint: {
            latex: 'A\\int_0^{\\infty} x^{\\alpha-1}e^{-x/\\beta}\\,dx = A\\,\\Gamma(\\alpha)\\beta^{\\alpha} = 1',
            text: 'A pdf integrates to 1, so A is 1 over the integral. For x²e^(−x/3): α = 3, β = 3, the integral is 2! · 3³ = 54, so A = 1/54.',
          },
          distractors: [1 / (fact(m) * b ** m), 1 / (fact(m + 1) * b ** (m + 1)), I, 1 / (fact(m) * (1 / b) ** (m + 1))],
        }
      },
    },
    {
      id: 'mean-var',
      generate() {
        let a
        let b
        let text
        let latexHead = ''
        let read = ''
        if (Math.random() < 0.5) {
          // read α and β off a pdf with its constant worked out
          let D
          do {
            a = randInt(2, 5)
            b = choice([2, 3, 4, 5])
            D = fact(a - 1) * b ** a
          } while (D > 1600)
          text = 'X has the pdf below, for x > 0.'
          latexHead = `f(x) = \\frac{1}{${D}}\\,${xPow(a - 1)}\\,e^{-x/${b}} \\\\ `
          read = `\\alpha = ${a},\\; \\beta = ${b}: \\; `
        } else {
          a = choice([1.5, 2, 2.5, 3, 4, 5, 6])
          b = choice([0.5, 2, 3, 4, 5, 10])
          text = `X has a gamma distribution with α = ${dec(a)} and β = ${dec(b)}.`
        }
        const ask = choice([
          {
            latex: 'E[X] = \\,?',
            v: a * b,
            shown: `\\mu = \\alpha\\beta = ${dec(a)} \\cdot ${dec(b)} = ${num(a * b)}`,
            wrong: [a * b * b, (a - 1) * b, a / b],
          },
          {
            latex: '\\operatorname{Var}X = \\,?',
            v: a * b * b,
            shown: `\\sigma^2 = \\alpha\\beta^2 = ${dec(a)} \\cdot ${dec(b)}^2 = ${num(a * b * b)}`,
            wrong: [a * b, a * a * b * b, (a - 1) * b * b],
          },
          {
            latex: '\\sigma_X = \\,?',
            v: b * Math.sqrt(a),
            shown: `\\sigma = \\sqrt{\\alpha}\\,\\beta = \\sqrt{${dec(a)}} \\cdot ${dec(b)} = ${num(b * Math.sqrt(a))}`,
            wrong: [a * b * b, Math.sqrt(a * b), a * b],
          },
        ])
        return {
          ask: 'Gamma mean and variance.',
          text,
          latex: latexHead ? `\\begin{gathered} ${latexHead}${ask.latex} \\end{gathered}` : ask.latex,
          answer: ask.v,
          answerLatex: `${read}${ask.shown}`,
          placeholder: 'e.g. 6',
          tolerance: Math.max(0.0005, ask.v * 0.002),
          hint: {
            latex: 'f(x) = \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}x^{\\alpha-1}e^{-x/\\beta}: \\quad \\mu = \\alpha\\beta, \\; \\sigma^2 = \\alpha\\beta^2',
            text: 'α is one more than the power of x, and β is what divides x in the exponent. The mean is αβ, the variance αβ², and σ is the square root of the variance.',
          },
          distractors: ask.wrong.filter(w => w > 0 && Math.abs(w - ask.v) > 1e-9),
        }
      },
    },
    {
      id: 'chi-squared',
      generate() {
        const df = randInt(2, 20)
        const hint = {
          latex: '\\chi^2_\\gamma = \\text{gamma with } \\alpha = \\tfrac{\\gamma}{2},\\; \\beta = 2 \\;\\Rightarrow\\; \\mu = \\gamma,\\; \\sigma^2 = 2\\gamma',
          text: 'A chi-squared variable with γ degrees of freedom is a gamma variable with α = γ/2 and β = 2. Then μ = αβ = γ and σ² = αβ² = 2γ.',
        }
        const which = choice(['alpha', 'beta', 'mean', 'mean', 'var', 'var', 'df'])
        if (which === 'df') {
          const a = df / 2
          return {
            ask: 'This gamma variable is chi-squared. How many degrees of freedom?',
            text: `X has a gamma distribution with α = ${dec(a)} and β = 2.`,
            latex: '\\gamma = \\,?',
            answer: df,
            answerLatex: `\\alpha = \\tfrac{\\gamma}{2} \\;\\Rightarrow\\; \\gamma = 2(${dec(a)}) = ${df}`,
            placeholder: 'e.g. 7',
            tolerance: 0.001,
            hint,
            distractors: [a, 2 * df, df + 2],
          }
        }
        const ask = {
          alpha: {
            latex: '\\alpha = \\,?',
            v: df / 2,
            shown: `\\alpha = \\tfrac{\\gamma}{2} = \\tfrac{${df}}{2} = ${dec(df / 2)}`,
            wrong: [df, 2, df / 2 - 1],
          },
          beta: { latex: '\\beta = \\,?', v: 2, shown: '\\beta = 2', wrong: [df / 2, df, 0.5] },
          mean: {
            latex: 'E[X] = \\,?',
            v: df,
            shown: `\\mu = \\alpha\\beta = \\tfrac{${df}}{2} \\cdot 2 = ${df}`,
            wrong: [2 * df, df / 2, df - 2],
          },
          var: {
            latex: '\\operatorname{Var}X = \\,?',
            v: 2 * df,
            shown: `\\sigma^2 = \\alpha\\beta^2 = \\tfrac{${df}}{2} \\cdot 4 = ${2 * df}`,
            wrong: [df, 4 * df, df * df],
          },
        }[which]
        return {
          ask: which === 'alpha' || which === 'beta' ? 'Chi-squared is a gamma distribution. Find its parameter.' : 'Chi-squared as a gamma distribution: mean and variance.',
          text: `X is chi-squared with γ = ${df} degrees of freedom.`,
          latex: ask.latex,
          answer: ask.v,
          answerLatex: ask.shown,
          placeholder: 'e.g. 4',
          tolerance: 0.001,
          hint,
          distractors: ask.wrong.filter(w => w > 0 && w !== ask.v),
        }
      },
    },
  ],
}
