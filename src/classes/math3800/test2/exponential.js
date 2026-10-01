import { choice } from '../../../engine/rand.js'
import { dec, num, tolFor } from './util.js'

// §4.3: in a Poisson process with rate λ, the time W of the first event is
// exponential with β = 1/λ. A story gives the rate one of two ways, "3 per hour"
// or "1 every 5 hours" (the paramecium example), and says what unit W is in.

const SEC = { second: 1, minute: 60, hour: 3600, day: 86400 }
const units = (n, unit) => (n === 1 ? unit : `${unit}s`)
const clean = (v, places) => Math.abs(v * 10 ** places - Math.round(v * 10 ** places)) < 1e-9
// wrong answers that still look like probabilities
const keep = (...vs) => vs.filter(v => Number.isFinite(v) && v > 0.0005 && v < 0.9995)

// Each story's realistic rates: `every` lists mean waits m ("1 every m units"),
// `rate` lists λ ("λ per unit"), both by unit.
const STORIES = [
  {
    lead: 'A killer paramecium emits killer particles',
    first: 'the first particle is emitted',
    notes: true,
    every: { hour: [2, 4, 5, 8, 10] },
    rate: { hour: [0.1, 0.2, 0.25, 0.5] },
  },
  {
    lead: 'Calls reach a help desk',
    first: 'the first call',
    every: { minute: [2, 4, 5, 10, 15, 20, 30], hour: [2, 4] },
    rate: { minute: [0.2, 0.25, 0.5, 2], hour: [2, 3, 4, 5, 6, 10, 12, 20] },
  },
  {
    lead: 'Customers walk into a coffee shop',
    first: 'the first customer arrives',
    every: { minute: [2, 4, 5, 10, 12, 15] },
    rate: { minute: [0.2, 0.25, 0.5, 2, 3], hour: [3, 4, 5, 6, 10, 12, 20, 30] },
  },
  {
    lead: 'A Geiger counter clicks',
    first: 'the first click',
    every: { second: [2, 4, 5, 10, 20, 30], minute: [2, 4, 5] },
    rate: { second: [0.5, 2, 4, 5], minute: [0.5, 1, 2, 3, 4, 6] },
  },
  {
    lead: 'Emails land in an inbox',
    first: 'the first email',
    every: { minute: [5, 10, 12, 15, 20, 30], hour: [2, 4, 5, 8] },
    rate: { minute: [0.2, 0.25, 0.5], hour: [2, 3, 4, 5, 6, 10, 12] },
  },
  {
    lead: 'A web server crashes',
    first: 'the first crash',
    every: { day: [10, 20, 25, 40, 50] },
    rate: { day: [0.02, 0.05, 0.1, 0.25] },
  },
  {
    lead: 'A small fire department gets calls',
    first: 'the first call',
    every: { day: [2, 4, 5] },
    rate: { day: [0.5, 2, 3, 4, 6] },
  },
  {
    lead: 'During a meteor shower, meteors streak across the sky',
    first: 'the first meteor',
    every: { minute: [2, 4, 5, 10, 12, 15, 20, 30] },
    rate: { minute: [0.2, 0.25, 0.5, 2] },
  },
  {
    lead: 'Cars reach a toll booth',
    first: 'the first car',
    every: { second: [10, 15, 20, 30], minute: [2, 4, 5] },
    rate: { second: [0.05, 0.1, 0.2, 0.25], minute: [0.5, 1, 2, 3, 4, 6] },
  },
]
const unitsOf = story => [...new Set([...Object.keys(story.every), ...Object.keys(story.rate)])]

// A Poisson process in one unit: its sentence, β and λ. The story's own list
// supplies the number unless `value` does; a form the story lacks in that unit
// falls back to the other one.
function makeProcess(story, unit, form, value) {
  if (!story[form][unit]) form = form === 'every' ? 'rate' : 'every'
  if (form === 'every') {
    const m = value ?? choice(story.every[unit])
    const sentence = story.notes
      ? `The mean number of killer particles emitted by a killer paramecium is 1 every ${m} ${units(m, unit)}.`
      : `${story.lead} at an average of 1 every ${m} ${units(m, unit)}.`
    return { form, unit, m, beta: m, lambda: 1 / m, sentence }
  }
  const lam = value ?? choice(story.rate[unit])
  return { form, unit, lam, beta: 1 / lam, lambda: lam, sentence: `${story.lead} at an average rate of ${dec(lam)} per ${unit}.` }
}
const waitLine = (story, unit) => `W is the wait, in ${unit}s, until ${story.first}.`

// A time t (in the process's unit) where t and t/β both read cleanly.
const XS = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.25, 1.5, 1.6, 2, 2.4, 2.5, 3]
function pickTimes(beta, count = 1) {
  const ts = XS.map(x => x * beta).filter(t => clean(t, 2))
  const picked = []
  while (picked.length < count) {
    const t = choice(ts)
    if (!picked.some(u => Math.abs(u - t) < 1e-9)) picked.push(t)
  }
  return picked.sort((a, b) => a - b).map(t => parseFloat(t.toFixed(2)))
}

// how λt = t/β reads in a solution
function exponent(pr, t) {
  const x = t / pr.beta
  return pr.form === 'every' ? `\\tfrac{t}{\\beta} = \\tfrac{${dec(t)}}{${pr.m}} = ${dec(x)}` : `\\lambda t = ${dec(pr.lam)}(${dec(t)}) = ${dec(x)}`
}

const HINT = {
  latex: '\\beta = \\frac{1}{\\lambda}, \\quad P(W \\le t) = 1 - e^{-t/\\beta} = 1 - e^{-\\lambda t}',
  text: 'W is exponential with mean β. "1 every 5 hours" means β = 5; "3 per hour" means λ = 3, so β = 1/3 hour. At most t is the cdf, 1 − e^(−λt).',
}

export default {
  id: 'exponential',
  name: 'Exponential and the first event',
  description: '§4.3: the wait for the first event of a Poisson process.',
  learn: {
    formulas: [
      { label: 'Exponential pdf: gamma with α = 1 (on the sheet)', latex: 'f(x) = \\frac{1}{\\beta}e^{-x/\\beta}, \\quad x > 0' },
      { label: 'Wait W for the first event, rate λ', latex: 'W \\text{ is exponential}, \\quad \\beta = \\frac{1}{\\lambda}' },
      { label: 'cdf: the first event by time t', latex: 'P(W \\le t) = 1 - e^{-\\lambda t}' },
      { label: 'Tail: no event by time t', latex: 'P(W > t) = e^{-\\lambda t}' },
      { label: 'Between', latex: 'P(a < W < b) = e^{-\\lambda a} - e^{-\\lambda b}' },
      { label: 'Mean and variance', latex: 'E[W] = \\beta = \\frac{1}{\\lambda}, \\quad \\operatorname{Var}W = \\beta^2' },
    ],
    how: [
      'λ is the rate (events per unit of time) and β = 1/λ is the mean wait. "1 every 5 hours" means β = 5 hours, λ = 1/5 per hour.',
      'Put the rate and the time in the same unit before you multiply: 3 per hour over 20 minutes is λt = 3 · (20/60) = 1.',
      'W > t means no event by time t. The count by then is Poisson with mean λt, and P(0 events) = e^(−λt).',
      'At most t is the complement, 1 − e^(−λt) (the paramecium: β = 5, t = 4, 1 − e^(−0.8) = 0.5507). Between a and b: e^(−λa) − e^(−λb).',
      'The mean wait is β, the variance β², the standard deviation β.',
    ],
  },
  templates: [
    {
      id: 'at-most',
      generate() {
        const story = choice(STORIES)
        const unit = choice(unitsOf(story))
        const pr = makeProcess(story, unit, Math.random() < 0.6 ? 'every' : 'rate')
        const [t] = pickTimes(pr.beta)
        const x = t / pr.beta
        const ans = 1 - Math.exp(-x)
        const swapped = pr.form === 'every' ? 1 - Math.exp(-t * pr.m) : 1 - Math.exp(-t / pr.lam)
        return {
          ask: 'Probability the first event comes within this time.',
          text: `${pr.sentence} ${waitLine(story, unit)}`,
          latex: `P(W ${Math.random() < 0.3 ? '<' : '\\le'} ${dec(t)}) = \\,?`,
          answer: ans,
          answerLatex: `${pr.form === 'every' ? `\\beta = ${pr.m}` : `\\lambda = ${dec(pr.lam)}`}: \\; ${exponent(pr, t)}, \\; 1 - e^{-${dec(x)}} = ${num(ans)}`,
          placeholder: 'e.g. 0.5507',
          tolerance: tolFor(ans),
          hint: HINT,
          // the complement, λ and β swapped, β/t for t/β, P(exactly one event), the pdf at t
          distractors: keep(Math.exp(-x), swapped, 1 - Math.exp(-1 / x), x * Math.exp(-x), Math.exp(-x) / pr.beta),
        }
      },
    },
    {
      id: 'units',
      generate() {
        const PAIRS = [
          { form: 'rate', from: 'hour', to: 'minute' },
          { form: 'rate', from: 'minute', to: 'second' },
          { form: 'rate', from: 'day', to: 'hour' },
          { form: 'every', from: 'minute', to: 'hour' },
          { form: 'every', from: 'second', to: 'minute' },
          { form: 'every', from: 'hour', to: 'day' },
        ]
        const TIMES = {
          minute: [3, 5, 6, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 48, 90],
          second: [5, 6, 10, 12, 15, 20, 30, 45],
          hour: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12],
          day: [0.5, 1, 1.5, 2, 3],
        }
        for (;;) {
          const pair = choice(PAIRS)
          const story = choice(STORIES.filter(s => s[pair.form][pair.from]))
          const pr = makeProcess(story, pair.from, pair.form)
          const c = SEC[pair.from] / SEC[pair.to] // W units in one of the rate's units
          const ok = TIMES[pair.to].filter(t => {
            const x = t / c / pr.beta
            return clean(t / c, 3) && clean(x, 3) && x >= 0.15 && x <= 3.2
          })
          if (!ok.length) continue
          const t = choice(ok)
          const tFrom = t / c
          const x = tFrom / pr.beta
          const more = Math.random() < 0.5
          const ans = more ? Math.exp(-x) : 1 - Math.exp(-x)
          const prob = v => (more ? Math.exp(-v) : 1 - Math.exp(-v))
          return {
            ask: 'Convert to one unit first, then find the probability.',
            text: `${pr.sentence} ${waitLine(story, pair.to)}`,
            latex: `P(W ${more ? '>' : '\\le'} ${dec(t)}) = \\,?`,
            answer: ans,
            answerLatex: `${dec(t)} \\text{ ${units(t, pair.to)}} = ${dec(tFrom)} \\text{ ${units(tFrom, pair.from)}}: \\; ${exponent(pr, tFrom)}, \\; ${more ? '' : '1 - '}e^{-${dec(x)}} = ${num(ans)}`,
            placeholder: 'e.g. 0.3935',
            tolerance: tolFor(ans),
            hint: {
              latex: '\\lambda t \\text{ with } \\lambda \\text{ and } t \\text{ in the same unit}, \\quad P(W > t) = e^{-\\lambda t}',
              text: 'Rewrite the time in the unit of the rate (15 minutes = 0.25 hours) or the rate in the unit of the time (6 per hour = 0.1 per minute). Then use e^(−λt) or 1 − e^(−λt).',
            },
            // forgot to convert, the complement, and P(exactly one event)
            distractors: keep(prob(t / pr.beta), 1 - ans, x * Math.exp(-x), prob(1 / x)),
          }
        }
      },
    },
    {
      id: 'more-than',
      generate() {
        const story = choice(STORIES)
        const unit = choice(unitsOf(story))
        const pr = makeProcess(story, unit, Math.random() < 0.5 ? 'every' : 'rate')
        const [t] = pickTimes(pr.beta)
        const x = t / pr.beta
        const ans = Math.exp(-x)
        const swapped = pr.form === 'every' ? Math.exp(-t * pr.m) : Math.exp(-t / pr.lam)
        return {
          ask: 'Probability that nothing happens before this time.',
          text: `${pr.sentence} ${waitLine(story, unit)}`,
          latex: `P(W > ${dec(t)}) = \\,?`,
          answer: ans,
          answerLatex: `${exponent(pr, t)}: \\; P(W > ${dec(t)}) = e^{-${dec(x)}} = ${num(ans)}`,
          placeholder: 'e.g. 0.4493',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(W > t) = P(\\text{no events in } [0, t]) = \\frac{e^{-\\lambda t}(\\lambda t)^0}{0!} = e^{-\\lambda t}',
            text: 'W > t means zero events by time t. That count is Poisson with mean λt, so the chance of none is e^(−λt).',
          },
          distractors: keep(1 - ans, swapped, Math.exp(-1 / x), x * Math.exp(-x)),
        }
      },
    },
    {
      id: 'between',
      generate() {
        const story = choice(STORIES)
        const unit = choice(unitsOf(story))
        const pr = makeProcess(story, unit, Math.random() < 0.5 ? 'every' : 'rate')
        let a
        let b
        do {
          ;[a, b] = pickTimes(pr.beta, 2)
        } while (b / pr.beta - a / pr.beta < 0.3)
        const xa = a / pr.beta
        const xb = b / pr.beta
        const ans = Math.exp(-xa) - Math.exp(-xb)
        return {
          ask: 'Probability the first event comes between these times.',
          text: `${pr.sentence} ${waitLine(story, unit)}`,
          latex: `P(${dec(a)} < W < ${dec(b)}) = \\,?`,
          answer: ans,
          answerLatex: `${pr.form === 'every' ? `\\beta = ${pr.m}` : `\\lambda = ${dec(pr.lam)}`}: \\; e^{-${dec(xa)}} - e^{-${dec(xb)}} = ${num(ans)}`,
          placeholder: 'e.g. 0.2325',
          tolerance: tolFor(ans),
          hint: {
            latex: 'P(a < W < b) = F(b) - F(a) = e^{-\\lambda a} - e^{-\\lambda b}',
            text: 'Subtract the cdf values: (1 − e^(−λb)) − (1 − e^(−λa)). The 1s cancel, leaving e^(−λa) − e^(−λb).',
          },
          // as if W restarted at a, the cdf at b alone, the tail past a alone
          distractors: keep(1 - Math.exp(-(xb - xa)), 1 - Math.exp(-xb), Math.exp(-xa), Math.exp(-xb)),
        }
      },
    },
    {
      id: 'mean-var',
      generate() {
        for (;;) {
          const story = choice(STORIES)
          const mixed = Math.random() < 0.35
          const PAIRS = { hour: 'minute', minute: 'second', day: 'hour' }
          const from = choice(unitsOf(story))
          const to = mixed ? PAIRS[from] : from
          if (!to) continue
          const pr = makeProcess(story, from, Math.random() < 0.5 ? 'every' : 'rate')
          const form = pr.form
          const c = SEC[from] / SEC[to]
          const beta = pr.beta * c // mean wait in W's unit
          if (beta > 60) continue
          const what = choice(form === 'every' && !mixed ? ['var', 'sd', 'rate'] : ['mean', 'mean', 'var', 'sd', form === 'every' ? 'rate' : 'mean'])
          const betaLine =
            form === 'every'
              ? mixed
                ? `\\beta = ${pr.m} \\text{ ${units(pr.m, from)}} = ${num(beta)} \\text{ ${units(beta, to)}}`
                : `\\beta = ${pr.m}`
              : mixed
                ? `\\beta = \\tfrac{1}{${dec(pr.lam)}} \\text{ ${from}} = \\tfrac{${c}}{${dec(pr.lam)}} \\text{ ${to}s} = ${num(beta)}`
                : `\\beta = \\tfrac{1}{\\lambda} = \\tfrac{1}{${dec(pr.lam)}} = ${num(beta)}`
          const plain = pr.beta // the same wait, unconverted
          const ask = {
            mean: { latex: 'E[W] = \\,?', v: beta, last: `E[W] = \\beta = ${num(beta)}`, wrong: [1 / beta, beta * beta, plain, 1 / (beta * beta)] },
            var: { latex: '\\operatorname{Var}W = \\,?', v: beta * beta, last: `\\operatorname{Var}W = \\beta^2 = ${num(beta * beta)}`, wrong: [beta, 1 / (beta * beta), plain * plain, 2 * beta * beta] },
            sd: { latex: '\\sigma_W = \\,?', v: beta, last: `\\sigma_W = \\beta = ${num(beta)}`, wrong: [beta * beta, 1 / beta, Math.sqrt(beta)] },
            rate: { latex: `\\lambda = \\,? \\text{ per ${to}}`, v: 1 / beta, last: `\\lambda = \\tfrac{1}{\\beta} = ${num(1 / beta)}`, wrong: [beta, 1 / plain, 1 / (beta * beta), beta * beta] },
          }[what]
          return {
            ask: 'Mean wait, variance and rate of the first event.',
            text: `${pr.sentence} ${waitLine(story, to)}`,
            latex: ask.latex,
            answer: ask.v,
            answerLatex: `${betaLine}, \\; ${ask.last}`,
            placeholder: 'e.g. 15',
            tolerance: Math.max(0.0005, ask.v * 0.003),
            hint: {
              latex: '\\beta = \\frac{1}{\\lambda}, \\quad E[W] = \\beta, \\quad \\operatorname{Var}W = \\beta^2',
              text: 'β is the mean wait, in the unit W is measured in: 4 per hour is β = 1/4 hour = 15 minutes. The variance is β² and the standard deviation is β.',
            },
            distractors: ask.wrong.filter(w => Number.isFinite(w) && w > 0 && Math.abs(w - ask.v) > Math.max(0.0005, ask.v * 0.003)),
          }
        }
      },
    },
  ],
}
