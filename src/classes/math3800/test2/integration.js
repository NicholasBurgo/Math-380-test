import { choice, randInt } from '../../../engine/rand.js'
import { sameFormula } from '../../../engine/expr.js'
import { BOX, antiderivative, derivation, formula, lettered, num } from './util.js'

// §4.2–4.3: integration by parts, once. The review notes from the last class:
// be able to do ∫ x e^x dx by parts (not ∫ x² e^x dx), and see that
// ∫₀^∞ x⁴ e^(−x) dx is a gamma integral, not parts. In this course these
// integrals are E[X] = ∫ x f(x) dx for exponential densities, so the rates are
// a = ±1, ±2, ±3 and a = −1/β, written e^{-x/β}.

const fact = n => (n <= 1 ? 1 : n * fact(n - 1))
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))

// The rate a = p/q in e^{ax}: a whole number (q = 1) or −1/β (p = −1, q = β),
// with e^{ax} typed and in LaTeX: e^(2x), e^{-x/3}.
function rate(p, q = 1) {
  const ex = q === 1 ? (p === 1 ? 'x' : p === -1 ? '-x' : `${p}x`) : `-x/${q}`
  return { p, q, a: p / q, ex, tex: `e^{${ex}}`, typed: ex === 'x' ? 'e^x' : `e^(${ex})` }
}
const someRate = () => choice([[1], [-1], [2], [-2], [3], [-3], [-1, 2], [-1, 3], [-1, 4]].map(r => rate(...r)))

// (n/d)·x^k·e^{ax}, typed and in LaTeX: e^(2x)/4, (x/2)e^(2x), -3xe^(-x/3), \frac{e^{2x}}{4}
function term(r, n, d, k = 0) {
  const g = gcd(Math.abs(n), d)
  const m = Math.abs(n) / g
  const den = d / g
  const sign = n < 0 ? '-' : ''
  const xT = k === 0 ? '' : k === 1 ? 'x' : `x^${k}`
  const xL = k === 0 ? '' : k === 1 ? 'x' : `x^{${k}}`
  if (den === 1) {
    const lead = m === 1 ? '' : String(m)
    return { typed: `${sign}${lead}${xT}${r.typed}`, tex: `${sign}${lead}${xL}${r.tex}` }
  }
  const top = `${m === 1 ? '' : m}${xT}`
  if (!top) return { typed: `${sign}${r.typed}/${den}`, tex: `${sign}\\frac{${r.tex}}{${den}}` }
  return { typed: `${sign}(${top}/${den})${r.typed}`, tex: `${sign}\\frac{${m === 1 ? '' : m}${xL}}{${den}}${r.tex}` }
}

// The pieces of ∫ x e^{ax} dx = (x/a)e^{ax} − e^{ax}/a² + C for a rate, and the slips.
function pieces(r) {
  const s = Math.sign(r.p)
  const P = Math.abs(r.p)
  return {
    integrand: { typed: `x${r.typed}`, tex: `x${r.tex}` },
    v: term(r, s * r.q, P), // e^{ax}/a
    w: term(r, r.q * r.q, P * P), // e^{ax}/a²
    uv: term(r, s * r.q, P, 1), // (x/a)e^{ax}
    // slips
    e: term(r, 1, 1), // forgot the 1/a
    ae: term(r, r.p, r.q), // differentiated instead
    negV: term(r, -s * r.q, P),
    negW: term(r, -r.q * r.q, P * P),
    xw: term(r, r.q * r.q, P * P, 1),
    xe: term(r, 1, 1, 1),
    apart: term(r, s * r.q, 2 * P, 2), // ∫x dx times ∫e^{ax} dx
    power: { typed: `e^(${r.ex}+1)/(${r.ex}+1)` }, // the power rule on e^{ax}
  }
}

// a − b, with b's own sign folded in: "x - -3e" reads as "x + 3e"
const minus = (a, b) => (b.startsWith('-') ? `${a} + ${b.slice(1)}` : `${a} - ${b}`)
const paren = t => (t.startsWith('-') ? `\\left(${t}\\right)` : t)
// typed form as plain text, with real minus signs
const plain = s => s.replaceAll('-', '−')

// F(x) = (x/a − 1/a²)e^{ax}, the antiderivative the definite integrals use
const F = (a, x) => (x / a - 1 / (a * a)) * Math.exp(a * x)

// Value-graded boxes: x values where every slip differs from the answer.
const PARTS_POINTS = [{ x: -0.9 }, { x: 0.4 }, { x: 1.2 }]

// The slips that really are wrong for this rate (some vanish when a = 1), no two alike.
function slips(p, candidates) {
  const kept = []
  for (const c of candidates) if (!p.accept(c) && !kept.some(k => sameFormula(k, c, p.expr.vars, PARTS_POINTS))) kept.push(c)
  return { ...p, choices: kept.slice(0, 3) }
}

export default {
  id: 'integration',
  name: 'Integration by parts',
  description: '§4.2–4.3: by parts once on x·e^(ax); xⁿe^(−x) on (0, ∞) is a gamma integral.',
  learn: {
    formulas: [
      { label: 'Integration by parts', latex: '\\int u\\,dv = uv - \\int v\\,du' },
      { label: 'Once, with u = x', latex: '\\int xe^{ax}\\,dx = \\frac{x}{a}e^{ax} - \\frac{e^{ax}}{a^2} + C' },
      { label: 'The notes', latex: '\\int_0^1 xe^{x}\\,dx = \\Big[xe^{x} - e^{x}\\Big]_0^1 = 0 - (-1) = 1' },
      { label: 'Exponential mean by parts', latex: '\\int_0^{\\infty} xe^{-x/\\beta}\\,dx = \\beta^2, \\qquad \\int_0^{\\infty} x\\cdot\\lambda e^{-\\lambda x}\\,dx = \\frac{1}{\\lambda}' },
      { label: 'Not by parts: gamma (on the sheet)', latex: '\\int_0^{\\infty} x^n e^{-x}\\,dx = \\Gamma(n+1) = n!' },
    ],
    how: [
      'Pick u = x because it gets simpler (du = dx), and dv = e^(ax) dx, which integrates to v = e^(ax)/a. Picking u = e^(ax) instead leaves ∫ (x²/2)·a e^(ax) dx, which is worse.',
      'One round only: uv − ∫ v du = (x/a)e^(ax) − ∫ e^(ax)/a dx = (x/a)e^(ax) − e^(ax)/a² + C. The a² comes from dividing by a twice.',
      'Worked (the notes): ∫₀¹ x eˣ dx = [x eˣ − eˣ]₀¹ = (e − e) − (0 − 1) = 1. The bottom limit counts: at x = 0 the bracket is −1, not 0.',
      'On (0, ∞) with a decaying exponential, the boundary term vanishes at ∞ (the exponential beats x), so only x = 0 counts: ∫₀^∞ x e^(−x/β) dx = [−βx e^(−x/β) − β² e^(−x/β)]₀^∞ = β².',
      'That is the exponential mean by parts: E[X] = ∫₀^∞ x·λe^(−λx) dx = λ · 1/λ² = 1/λ, or β for f(x) = (1/β)e^(−x/β).',
      'x² e^(−x) on (0, ∞) is Γ(3) = 2! = 2, not two rounds of parts. Any xⁿe^(−x) on (0, ∞) is Γ(n + 1) = n!, and xⁿe^(−x/β) is n!·β^(n+1).',
    ],
  },
  templates: [
    {
      id: 'steps',
      generate() {
        const r = someRate()
        const P = pieces(r)
        const lines = [
          `\\int ${P.integrand.tex}\\,dx &= uv - \\int v\\,du`,
          `u = x, \\quad dv &= ${r.tex}\\,dx`,
          `du = dx, \\quad v &= ${P.v.tex}`,
          `\\int ${P.integrand.tex}\\,dx &= x\\cdot ${paren(P.v.tex)} - \\int ${paren(P.v.tex)}\\,dx`,
        ]
        const step = choice(['v', 'parts', 'finish', 'which'])
        if (step === 'which') {
          const pick = lettered({ latex: `u = x,\\; dv = ${r.tex}\\,dx` }, [
            { latex: `u = ${r.tex},\\; dv = x\\,dx` },
            { latex: `u = ${P.integrand.tex},\\; dv = dx` },
            { latex: `u = 1,\\; dv = ${P.integrand.tex}\\,dx` },
          ])
          return {
            ask: 'By parts, once: which u and dv?',
            latex: `\\int ${P.integrand.tex}\\,dx = uv - \\int v\\,du`,
            ...pick,
            placeholder: 'a, b, c or d',
            hint: {
              latex: `u = x \\Rightarrow du = dx, \\qquad dv = ${r.tex}\\,dx \\Rightarrow v = ${P.v.tex}`,
              text: 'Let u be the factor that gets simpler when you differentiate it: x becomes 1. With u = e^(ax) the leftover integral has x² in it, which is worse.',
            },
          }
        }
        if (step === 'v') {
          return antiderivative({
            ask: 'By parts, once: integrate dv. What goes in the box?',
            latex: derivation([...lines.slice(0, 2), `du = dx, \\quad v &= ${BOX}`]),
            size: 'derivation',
            integrand: r.typed,
            answer: P.v.typed,
            answerLatex: `v = ${P.v.tex}`,
            choices: [P.ae.typed, P.e.typed, P.w.typed, P.negV.typed, P.uv.typed, P.power.typed],
            placeholder: 'v in terms of x',
            hint: {
              latex: `v = \\int ${r.tex}\\,dx = ${P.v.tex}`,
              text: 'Integrate dv, do not differentiate it: ∫ e^(ax) dx = e^(ax)/a. Check by differentiating: the chain rule brings the a back down.',
            },
          })
        }
        if (step === 'parts') {
          return slips(
            formula({
              ask: 'By parts, once: write uv − ∫ v du. What goes in the box?',
              latex: derivation([...lines.slice(0, 3), `\\int ${P.integrand.tex}\\,dx &= x\\cdot ${paren(P.v.tex)} - \\int ${BOX}\\,dx`]),
              size: 'derivation',
              vars: ['x'],
              points: PARTS_POINTS,
              answer: P.v.typed,
              answerLatex: P.v.tex,
              placeholder: 'formula in x',
              hint: {
                latex: '\\int u\\,dv = uv - \\int v\\,du, \\quad du = dx',
                text: 'The leftover integral is ∫ v du, and du = dx, so its integrand is just v. The x is gone: that is why u = x.',
              },
            }),
            [P.uv.typed, P.negV.typed, P.w.typed, P.e.typed, P.ae.typed, P.apart.typed],
          )
        }
        return antiderivative({
          ask: 'By parts, once: do the last integral. What goes in the box?',
          latex: derivation([...lines, `&= ${P.uv.tex} - ${BOX} + C`]),
          size: 'derivation',
          integrand: P.v.typed,
          answer: P.w.typed,
          answerLatex: P.w.tex,
          choices: [P.v.typed, P.negW.typed, P.xw.typed, P.e.typed, P.ae.typed, P.power.typed],
          placeholder: 'formula in x',
          hint: {
            latex: `\\int ${paren(P.v.tex)}\\,dx = ${P.w.tex}`,
            text: 'Integrate v once more: dividing by a again gives e^(ax)/a². The minus sign in front of the integral stays outside.',
          },
        })
      },
    },
    {
      id: 'antiderivative',
      generate() {
        const r = someRate()
        const P = pieces(r)
        return antiderivative({
          ask: 'Integrate by parts (once).',
          latex: `\\int ${P.integrand.tex}\\,dx = \\,?`,
          integrand: P.integrand.typed,
          answer: `${minus(P.uv.typed, P.w.typed)} + C`,
          answerLatex: `${minus(P.uv.tex, P.w.tex)} + C`,
          choices: [
            `${P.uv.typed} + ${P.w.typed} + C`, // sign slip on the second term
            `${minus(P.uv.typed, P.v.typed)} + C`, // a in place of a²
            `${P.uv.typed} + C`, // second term dropped
            `${P.apart.typed} + C`, // ∫x dx times ∫e^{ax} dx
            `${minus(P.xe.typed, P.e.typed)} + C`, // forgot the 1/a's
          ],
          hint: {
            latex: '\\int xe^{ax}\\,dx = \\frac{x}{a}e^{ax} - \\frac{e^{ax}}{a^2} + C',
            text: `u = x and dv = ${plain(r.typed)} dx, so du = dx and v = ${plain(P.v.typed)}. Then uv − ∫ v du. Check: the derivative of your answer is ${plain(P.integrand.typed)}.`,
          },
        })
      },
    },
    {
      id: 'definite',
      generate() {
        const kind = choice(['notes', 'finite', 'finite', 'finite', 'infinite', 'infinite', 'rate', 'scale'])
        const finiteHint = {
          latex: '\\int_0^b xe^{ax}\\,dx = \\Big[\\frac{x}{a}e^{ax} - \\frac{e^{ax}}{a^2}\\Big]_0^b',
          text: 'By parts once (u = x, dv = e^(ax) dx), then top minus bottom. The bottom limit does not vanish: at x = 0 the bracket is −1/a².',
        }
        const infiniteHint = {
          latex: '\\int_0^{\\infty} xe^{ax}\\,dx = \\Big[\\frac{x}{a}e^{ax} - \\frac{e^{ax}}{a^2}\\Big]_0^{\\infty} = \\frac{1}{a^2}, \\quad a < 0',
          text: 'By parts once. At ∞ both terms go to 0 (the exponential beats x), so the answer is minus the value at 0. With e^(−x/β), 1/a² = β².',
        }
        const meanHint = {
          latex: '\\mu = \\int_0^{\\infty} x\\cdot\\lambda e^{-\\lambda x}\\,dx = \\lambda\\cdot\\frac{1}{\\lambda^2} = \\frac{1}{\\lambda}',
          text: 'Pull the constant out, do ∫ x e^(−λx) dx by parts once (it is 1/λ²), and multiply back. With (1/β)e^(−x/β) the same steps give β.',
        }
        if (kind === 'rate' || kind === 'scale') {
          const l = kind === 'rate' ? choice([2, 3, 4, 5]) : null
          const b = kind === 'scale' ? choice([2, 3, 4, 5]) : null
          const r = l ? rate(-l) : rate(-1, b)
          const P = pieces(r)
          const bracket = `\\Big[${minus(P.uv.tex, P.w.tex)}\\Big]_0^{\\infty}`
          const ans = l ? 1 / l : b
          return {
            ask: l ? `Find the mean of the exponential with rate λ = ${l}, by parts.` : `Find the mean of the exponential with f(x) = (1/${b})e^(−x/${b}), x > 0, by parts.`,
            latex: `E[X] = \\int_0^{\\infty} x\\cdot ${l ? `${l}${r.tex}` : `\\frac{1}{${b}}${r.tex}`}\\,dx = \\,?`,
            answer: ans,
            answerLatex: l
              ? `${l}${bracket} = ${l} \\cdot \\tfrac{1}{${l * l}} = ${num(ans)}`
              : `\\tfrac{1}{${b}}${bracket} = \\tfrac{1}{${b}} \\cdot ${b * b} = ${b}`,
            placeholder: l ? 'e.g. 0.125' : 'e.g. 7',
            tolerance: ans * 0.002,
            hint: meanHint,
            distractors: l ? [l, 1 / (l * l), 2 / l] : [b * b, 1 / b, 2 * b],
          }
        }
        if (kind === 'infinite') {
          const r = choice([rate(-1), rate(-2), rate(-3), rate(-1, 2), rate(-1, 3), rate(-1, 4)])
          const P = pieces(r)
          const ans = 1 / (r.a * r.a)
          return {
            ask: 'Evaluate by parts.',
            latex: `\\int_0^{\\infty} ${P.integrand.tex}\\,dx = \\,?`,
            answer: ans,
            answerLatex: `\\Big[${minus(P.uv.tex, P.w.tex)}\\Big]_0^{\\infty} = 0 - (${num(-ans)}) = ${num(ans)}`,
            placeholder: 'e.g. 6.25',
            tolerance: ans * 0.002,
            hint: infiniteHint,
            // 1/a for 1/a², twice the answer, one power too many
            distractors: [1 / Math.abs(r.a), 2 * ans, ans / Math.abs(r.a), 0],
          }
        }
        // ∫ from 0 to b: the notes' ∫₀¹ x eˣ dx = 1, or a clean rate with e^{ab} at most e^4
        let r
        let b
        if (kind === 'notes') {
          r = rate(1)
          b = 1
        } else {
          do {
            r = someRate()
            b = randInt(1, 3)
          } while (r.a * b > 4)
        }
        const P = pieces(r)
        const a = r.a
        const top = F(a, b)
        const bottom = F(a, 0)
        const ans = top - bottom
        return {
          ask: 'Evaluate by parts.',
          latex: `\\int_0^{${b}} ${P.integrand.tex}\\,dx = \\,?`,
          answer: ans,
          answerLatex: `\\Big[${minus(P.uv.tex, P.w.tex)}\\Big]_0^{${b}} = ${num(top)} - (${num(bottom)}) = ${num(ans)}`,
          placeholder: 'e.g. 2.5',
          tolerance: Math.abs(ans) * 0.002,
          hint: finiteHint,
          // the first three go negative for a decaying exponential; then the last two count
          distractors: [
            (b / a + 1 / (a * a)) * Math.exp(a * b) - 1 / (a * a), // sign slip on the second term
            top, // lower limit dropped
            (b / a - 1 / a) * Math.exp(a * b) + 1 / a, // 1/a in place of 1/a²
            -bottom, // the top treated like ∞
            (1 - Math.exp(a * b)) / (a * a), // uv dropped, only −∫ v du
          ],
        }
      },
    },
    {
      id: 'gamma-not-parts',
      generate() {
        const hint = {
          latex: '\\int_0^{\\infty} x^n e^{-x}\\,dx = \\Gamma(n+1) = n!, \\qquad \\int_0^{\\infty} x^n e^{-x/\\beta}\\,dx = n!\\,\\beta^{n+1}',
          text: "Not by parts: it's Γ(n + 1). Parts would take n rounds; the gamma function on the sheet does it in one line. The power of x is n, so α = n + 1, and e^(−x/β) adds a factor β^(n+1).",
        }
        if (Math.random() < 0.6) {
          const n = randInt(2, 6)
          const ans = fact(n)
          return {
            ask: 'Evaluate.',
            latex: `\\int_0^{\\infty} x^{${n}}e^{-x}\\,dx = \\,?`,
            answer: ans,
            answerLatex: `\\Gamma(${n + 1}) = ${n}! = ${ans}`,
            placeholder: 'a whole number',
            tolerance: 0.001,
            hint,
            distractors: [fact(n - 1), fact(n + 1), n],
          }
        }
        const [n, b] = choice([
          [2, 2],
          [2, 3],
          [2, 4],
          [3, 2],
          [3, 3],
        ])
        const scale = b ** (n + 1)
        const ans = fact(n) * scale
        return {
          ask: 'Evaluate.',
          latex: `\\int_0^{\\infty} x^{${n}}e^{-x/${b}}\\,dx = \\,?`,
          answer: ans,
          answerLatex: `\\Gamma(${n + 1})\\,${b}^{${n + 1}} = ${n}! \\cdot ${scale} = ${ans}`,
          placeholder: 'a whole number',
          tolerance: 0.001,
          hint,
          distractors: [fact(n) * b ** n, fact(n + 1) * scale, fact(n), fact(n - 1) * scale],
        }
      },
    },
  ],
}
