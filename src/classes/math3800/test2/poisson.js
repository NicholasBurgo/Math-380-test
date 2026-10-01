import { choice, randInt } from '../../../engine/rand.js'
import { toLatex } from '../../../engine/expr.js'
import { factorial, poissonPdf } from '../dist.js'
import { dec, formula, num, probs, tolFor } from './util.js'

// Poisson stories: an average rate λ per unit, and an interval of s units
// (given in other units when `div` is not 1: 20 minutes is s = 20/60 hour).
const STORIES = [
  {
    rates: [6, 9, 12, 15, 18, 24, 30, 36],
    wins: [10, 15, 20, 30, 40, 45, 90],
    div: 60,
    unit: 'hour',
    text: (l, w) => `A help line gets an average of ${l} calls per hour. X is the number of calls in ${an(w)} ${w}-minute window.`,
  },
  {
    rates: [8, 10, 12, 20, 24, 30, 45],
    wins: [6, 10, 12, 15, 20, 30],
    div: 60,
    unit: 'hour',
    text: (l, w) => `Customers arrive at a store at an average rate of ${l} per hour. X is the number of customers who arrive in ${an(w)} ${w}-minute period.`,
  },
  {
    rates: [12, 18, 24, 30, 40],
    wins: [5, 6, 10, 15],
    div: 60,
    unit: 'hour',
    text: (l, w) => `During a meteor shower, an average of ${l} meteors per hour are visible. X is the number of meteors seen in ${w} minutes.`,
  },
  {
    rates: [0.1, 0.2, 0.25, 0.3, 0.4, 0.5],
    wins: [4, 5, 6, 8, 10, 12, 15, 20],
    div: 1,
    unit: 'page',
    text: (l, w) => `A textbook has an average of ${l} typos per page. X is the number of typos in ${an(w)} ${w}-page chapter.`,
    wname: 'pages',
  },
  {
    rates: [4000, 5000, 6000, 7000, 8000],
    wins: [0.001, 0.0005],
    div: 1,
    unit: 'cubic millimeter',
    text: (l, w) =>
      `The average white blood cell count is ${l} per cubic millimeter of blood. A ${w} cubic millimeter drop is taken. X is the number of white blood cells in the drop.`,
    wname: 'cubic millimeter',
  },
  {
    rates: [2, 2.5, 4, 5, 6, 8, 10],
    wins: [200, 250, 300, 400, 500, 600, 750],
    div: 1000,
    unit: 'km',
    text: (l, w) => `A copper wire has an average of ${l} flaws per km. X is the number of flaws in ${an(w)} ${w} m piece of the wire.`,
  },
  {
    rates: [0.5, 1.5, 2, 2.5, 3],
    wins: [2, 3, 4],
    div: 1,
    unit: 'mile',
    text: (l, w) => `A highway has an average of ${l} potholes per mile. X is the number of potholes on ${an(w)} ${w}-mile stretch.`,
    wname: 'miles',
  },
  {
    rates: [2, 3, 4, 6, 8],
    wins: [3, 4, 6, 9],
    div: 12,
    unit: 'year',
    text: (l, w) => `Radioactive gas is released at a power plant an average of ${l} times per year. X is the number of releases in ${w} months.`,
  },
  {
    rates: [24, 36, 48, 60, 72],
    wins: [1, 2, 3, 4, 6],
    div: 24,
    unit: 'day',
    text: (l, w) => `An inbox gets an average of ${l} emails per day. X is the number of emails in ${an(w)} ${w}-hour stretch.`,
  },
]

const SMALL_UNIT = { 60: 'minutes', 12: 'months', 24: 'hours', 1000: 'm' }
// a 6-page chapter, an 8-page chapter
const an = n => (/^(8|1[18](?!\d))/.test(String(n)) ? 'an' : 'a')

// s in the rate's unit, for the worked line and the hint
function sizeOf(st, w) {
  if (st.div === 1) return { latex: dec(w), words: `${dec(w)} ${st.wname}` }
  if (st.div === 1000) return { latex: dec(w / 1000), words: `${w} m = ${dec(w / 1000)} km` }
  return { latex: `\\tfrac{${w}}{${st.div}}`, words: `${w} ${SMALL_UNIT[st.div]} = ${w}/${st.div} ${st.unit}` }
}

// A story whose k = λs is between lo and hi with at most 2 decimals.
function story(lo = 0.5, hi = 9) {
  for (;;) {
    const st = choice(STORIES)
    const l = choice(st.rates)
    const w = choice(st.wins)
    const k = parseFloat(((l * w) / st.div).toFixed(6))
    if (k < lo || k > hi || Math.abs(k * 100 - Math.round(k * 100)) > 1e-6) continue
    const s = sizeOf(st, w)
    return {
      l,
      k,
      text: st.text(l, w),
      rescaled: st.div !== 1,
      work: `k = \\lambda s = ${dec(l)} \\cdot ${s.latex} = ${dec(k)}`,
      why: `λ = ${dec(l)} per ${st.unit}, and the interval is ${s.words}, so k = λs = ${dec(k)}.`,
      wrongK: [l, l * w, (l * st.div) / w, w / st.div].filter(v => Math.abs(v - k) > 1e-9),
    }
  }
}

// Sometimes the notes just name k.
function plain() {
  const k = choice([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6])
  return { l: k, k, text: `X is Poisson with k = ${dec(k)}.`, work: null, why: `Here k = ${dec(k)} is given.`, wrongK: [] }
}

const f = (k, x) => poissonPdf(k, x)
const below = (k, c) => {
  let t = 0
  for (let x = 0; x <= c; x++) t += f(k, x)
  return t
}

// e^{-k}(1 + k + k^2/2! + ...) up to x = c, as a worked line
function series(K, c) {
  const terms = []
  for (let x = 0; x <= c; x++) terms.push(x === 0 ? '1' : x === 1 ? K : `\\frac{${K}^{${x}}}{${x}!}`)
  return c === 0 ? `e^{-${K}}` : `e^{-${K}}\\left(${terms.join(' + ')}\\right)`
}

const PDF = 'f(x) = \\frac{e^{-k}k^x}{x!}, \\quad k = \\lambda s'
const lead = s => `\\displaystyle ${s.work ? `${s.work}, \\quad ` : ''}`

export default {
  id: 'poisson',
  name: 'Poisson distribution',
  description: '§3.8: k = λs, probabilities, mean and variance.',
  learn: {
    formulas: [
      { label: 'pdf (on the sheet), x = 0, 1, 2, …', latex: 'f(x) = \\frac{e^{-k}k^x}{x!}' },
      { label: 'Parameter: λ per unit, over s units', latex: 'k = \\lambda s' },
      { label: 'Mean and variance', latex: 'E[X] = \\operatorname{Var}X = k, \\quad \\sigma = \\sqrt{k}' },
      { label: 'At least one', latex: 'P(X \\ge 1) = 1 - e^{-k}' },
      {
        label: 'Notes example: 6000 per mm³, a 0.001 mm³ drop',
        latex: '\\begin{gathered} k = 6000(0.001) = 6 \\\\ P(X \\le 2) = e^{-6}(1 + 6 + 18) \\\\ \\approx 0.0620 \\end{gathered}',
      },
    ],
    how: [
      'Poisson: X counts events in an interval of time, length or space (calls in an hour, typos on a page, cells in a drop).',
      'Steps from the notes: find the basic unit, the average number per unit (λ), and the size of the interval in that unit (s). Then k = λs.',
      'Convert before multiplying: 12 calls per hour over 20 minutes is s = 20/60 hour, so k = 12 · 20/60 = 4.',
      'Use k to write the pdf: f(x) = e^(−k)k^x/x!. Since 0! = 1, f(0) = e^(−k).',
      'At most c: add f(0) through f(c). At least c: 1 minus f(0) through f(c − 1). Factor out e^(−k) to save work.',
      'The mean and the variance are both k, so the standard deviation is √k.',
    ],
  },
  templates: [
    {
      id: 'find-k',
      generate() {
        const s = story(0.25, 12)
        return {
          ask: 'Find the Poisson parameter k for X.',
          text: s.text,
          latex: 'k = \\,?',
          answer: s.k,
          answerLatex: s.work,
          placeholder: 'e.g. 4',
          tolerance: Math.max(0.005, s.k * 0.002),
          hint: {
            latex: 'k = \\lambda s',
            text: `${s.why} Put s in the same unit as the rate first.`,
          },
          distractors: s.wrongK,
        }
      },
    },
    {
      id: 'pmf',
      generate() {
        const s = Math.random() < 0.25 ? plain() : story()
        const K = dec(s.k)
        const xs = []
        for (let x = 0; x <= 9; x++) if (f(s.k, x) >= 0.01) xs.push(x)
        const x = choice(xs)
        const v = f(s.k, x)
        return {
          ask: 'Find the probability.',
          text: s.text,
          latex: `P(X = ${x}) = \\,?`,
          answer: v,
          answerLatex: `${lead(s)}\\frac{e^{-${K}}\\,${K}^{${x}}}{${x}!} = ${num(v)}`,
          placeholder: 'e.g. 0.195',
          tolerance: tolFor(v),
          hint: { latex: PDF, text: `${s.why} Then f(${x}) = e^(−k)k^${x}/${x}!.` },
          distractors: probs(
            f(s.l, x), // used λ, not k
            Math.exp(-s.k) * Math.pow(s.k, x), // forgot x!
            Math.pow(s.k, x) / factorial(x), // forgot e^(-k)
            below(s.k, x), // P(X <= x)
            f(s.k, x + 1),
          ).filter(d => Math.abs(d - v) > tolFor(v)),
        }
      },
    },
    {
      id: 'tail',
      generate() {
        for (;;) {
          const s = Math.random() < 0.2 ? plain() : story()
          const K = dec(s.k)
          const c = randInt(1, 3)
          const kind = choice(['le', 'le', 'ge', 'ge', 'gt', 'lt'])
          let ev
          if (kind === 'le')
            ev = { words: `at most ${c}`, latex: `P(X \\le ${c})`, v: below(s.k, c), shown: series(K, c), wrong: [below(s.k, c - 1), 1 - below(s.k, c)] }
          else if (kind === 'lt')
            ev = { words: `fewer than ${c}`, latex: `P(X < ${c})`, v: below(s.k, c - 1), shown: series(K, c - 1), wrong: [below(s.k, c), 1 - below(s.k, c - 1)] }
          else if (kind === 'ge')
            ev = {
              words: c === 1 ? 'at least one' : `at least ${c}`,
              latex: `P(X \\ge ${c})`,
              v: 1 - below(s.k, c - 1),
              shown: `1 - ${series(K, c - 1)}`,
              wrong: [1 - below(s.k, c), below(s.k, c - 1)],
            }
          else
            ev = { words: `more than ${c}`, latex: `P(X > ${c})`, v: 1 - below(s.k, c), shown: `1 - ${series(K, c)}`, wrong: [1 - below(s.k, c - 1), below(s.k, c)] }
          if (ev.v < 0.01 || ev.v > 0.99) continue
          // the same event with λ in place of k
          const kind2 = { le: below(s.l, c), lt: below(s.l, c - 1), ge: 1 - below(s.l, c - 1), gt: 1 - below(s.l, c) }[kind]
          return {
            ask: `Find the probability that X is ${ev.words}.`,
            text: s.text,
            latex: `${ev.latex} = \\,?`,
            answer: ev.v,
            answerLatex: `${lead(s)}${ev.latex} = ${ev.shown} = ${num(ev.v)}`,
            placeholder: 'e.g. 0.062',
            tolerance: tolFor(ev.v),
            hint: {
              latex: 'P(X \\le c) = e^{-k}\\left(1 + k + \\frac{k^2}{2!} + \\cdots + \\frac{k^c}{c!}\\right)',
              text: `${s.why} At most: add from 0 up. At least: 1 minus the values below.`,
            },
            distractors: probs(...ev.wrong, kind2).filter(d => Math.abs(d - ev.v) > tolFor(ev.v)),
          }
        }
      },
    },
    {
      id: 'moments',
      generate() {
        const s = story()
        const K = dec(s.k)
        const r = Math.sqrt(s.k)
        const ask = choice([
          { latex: 'E[X] = \\,?', v: s.k, shown: `E[X] = k = ${K}`, wrong: [s.l, s.k * s.k, r] },
          { latex: '\\operatorname{Var}X = \\,?', v: s.k, shown: `\\operatorname{Var}X = k = ${K}`, wrong: [r, s.k * s.k, s.l] },
          { latex: '\\sigma = \\,?', v: r, shown: `\\sigma = \\sqrt{k} = \\sqrt{${K}} = ${num(r)}`, wrong: [s.k, Math.sqrt(s.l), s.k * s.k] },
        ])
        return {
          ask: 'Poisson mean and variance.',
          text: s.text,
          latex: ask.latex,
          answer: ask.v,
          answerLatex: `${s.work}, \\quad ${ask.shown}`,
          placeholder: 'e.g. 4',
          tolerance: Math.max(0.005, Math.abs(ask.v) * 0.002),
          hint: {
            latex: 'E[X] = \\operatorname{Var}X = k, \\quad \\sigma = \\sqrt{k}',
            text: `${s.why} The mean and the variance are both k; σ is √k.`,
          },
          distractors: ask.wrong.filter(w => Math.abs(w - ask.v) > 1e-9),
        }
      },
    },
    {
      id: 'write-pdf',
      generate() {
        const s = story()
        const K = dec(s.k)
        const L = dec(s.l)
        const answer = `e^(-${K})${K}^x/x!`
        const wrong = [`e^(${K})${K}^x/x!`, `e^(-${K})${K}^x`, `e^(-${K})x^${K}/x!`]
        if (s.l !== s.k) wrong.unshift(`e^(-${L})${L}^x/x!`)
        return formula({
          ask: 'Find k, then write the pdf of X. Type f(x).',
          text: s.text,
          latex: 'f(x) = \\,?',
          vars: ['x'],
          points: [0, 1, 2, 3, 5].map(x => ({ x })),
          answer,
          answerLatex: `\\displaystyle ${s.work}, \\quad f(x) = ${toLatex(answer, ['x'])}`,
          choices: wrong.slice(0, 3),
          placeholder: 'f(x) in terms of x, e.g. e^(-2)2^x/x!',
          hint: { latex: PDF, text: `${s.why} Then f(x) = e^(−k)k^x/x! with that k.` },
        })
      },
    },
  ],
}
