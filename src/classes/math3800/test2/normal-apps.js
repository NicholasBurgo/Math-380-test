import { randInt, choice } from '../../../engine/rand.js'
import { zTable, zForLeftArea } from '../dist.js'
import { dec, num } from './util.js'

// §4.4 word problems: x ↔ z ↔ left area ↔ probability. Forward problems round
// z = (x − μ)/σ to 2 decimals and read zTable; backward ones read zForLeftArea
// and convert back with x = μ + zσ. Both are what the Tables panel shows.

const ASK = 'Use the standard normal table (Tables button).'
const AREA_TOL = 0.00015
const f4 = v => v.toFixed(4)
const zs = z => z.toFixed(2)
const round2 = z => Math.round(z * 100) / 100
const probs = (...vs) => vs.filter(v => Number.isFinite(v) && v > 0 && v < 1)

// μ and σ choices, the precision x is measured to, and how to ask about it
const STORIES = [
  {
    // the notes' hydrocarbon example
    what: 'The grams of hydrocarbons a car emits per mile are approximately normal',
    mu: [1],
    sigma: [0.25],
    step: 0.01,
    unit: '',
    who: 'cars',
    less: x => `emit less than ${x} grams per mile`,
    more: x => `emit more than ${x} grams per mile`,
    between: (a, b) => `emit between ${a} and ${b} grams per mile`,
    noun: 'emission level',
  },
  {
    // the notes' radiation example
    what: 'The radiation a person can absorb before death (in roentgens) is normal',
    mu: [500],
    sigma: [150],
    step: 10,
    unit: '',
    who: 'people',
    less: x => `would die from a dose of ${x} roentgens`,
    more: x => `would survive a dose of ${x} roentgens`,
    between: (a, b) => `have a lethal dose between ${a} and ${b} roentgens`,
    noun: 'dosage',
    radiation: true,
  },
  {
    what: 'Heights of adult women are approximately normal',
    mu: [64.5],
    sigma: [2.5],
    step: 0.5,
    unit: ' in',
    who: 'women',
    less: x => `are shorter than ${x} in`,
    more: x => `are taller than ${x} in`,
    between: (a, b) => `are between ${a} and ${b} in tall`,
    noun: 'height',
  },
  {
    what: 'Battery life (in hours) is normal',
    mu: [40, 45, 50],
    sigma: [4, 5, 6],
    step: 1,
    unit: '',
    who: 'batteries',
    less: x => `last less than ${x} hours`,
    more: x => `last more than ${x} hours`,
    between: (a, b) => `last between ${a} and ${b} hours`,
    noun: 'battery life',
  },
  {
    what: 'Scores on an exam are normal',
    mu: [70, 72, 75],
    sigma: [6, 8, 10],
    step: 1,
    unit: '',
    who: 'students',
    less: x => `score below ${x}`,
    more: x => `score above ${x}`,
    between: (a, b) => `score between ${a} and ${b}`,
    noun: 'score',
  },
  {
    what: 'IQ scores are normal',
    mu: [100],
    sigma: [15],
    step: 1,
    unit: '',
    who: 'people',
    less: x => `have an IQ below ${x}`,
    more: x => `have an IQ above ${x}`,
    between: (a, b) => `have an IQ between ${a} and ${b}`,
    noun: 'IQ score',
  },
  {
    what: 'The weight of a cereal box (in grams) is normal',
    mu: [500],
    sigma: [4, 5],
    step: 1,
    unit: '',
    who: 'boxes',
    less: x => `weigh less than ${x} g`,
    more: x => `weigh more than ${x} g`,
    between: (a, b) => `weigh between ${a} and ${b} g`,
    noun: 'weight',
    limits: (a, b) => `Boxes under ${a} g or over ${b} g are rejected.`,
  },
  {
    what: 'Bolt diameters (in mm) are normal',
    mu: [10],
    sigma: [0.03],
    step: 0.01,
    unit: '',
    who: 'bolts',
    less: x => `are narrower than ${x} mm`,
    more: x => `are wider than ${x} mm`,
    between: (a, b) => `are between ${a} and ${b} mm wide`,
    noun: 'diameter',
    limits: (a, b) => `Bolts narrower than ${a} mm or wider than ${b} mm are scrapped.`,
  },
  {
    what: 'Commute times (in minutes) are normal',
    mu: [32],
    sigma: [6],
    step: 1,
    unit: '',
    who: 'commutes',
    less: x => `take less than ${x} minutes`,
    more: x => `take more than ${x} minutes`,
    between: (a, b) => `take between ${a} and ${b} minutes`,
    noun: 'commute time',
  },
]

// A story with its μ and σ. Now and then the variance is given instead of σ.
function setup(pool = STORIES, allowVariance = true) {
  const st = choice(pool)
  const mu = choice(st.mu)
  const sigma = choice(st.sigma)
  const byVar = allowVariance && Math.random() < 0.2
  const spread = byVar ? `σ² = ${dec(sigma * sigma)}` : `σ = ${dec(sigma)}${st.unit}`
  return {
    st,
    mu,
    sigma,
    byVar,
    intro: `${st.what} with μ = ${dec(mu)}${st.unit} and ${spread}.`,
    sigmaLine: byVar ? `\\sigma = \\sqrt{${dec(sigma * sigma)}} = ${dec(sigma)}, \\; ` : '',
  }
}

// An x on the story's grid whose z = (x − μ)/σ rounds to 2 decimals without a tie.
function pickX(s, zlo = -2.6, zhi = 2.6) {
  for (;;) {
    const raw = s.mu + (zlo + Math.random() * (zhi - zlo)) * s.sigma
    const x = Number(dec(Math.round(raw / s.st.step) * s.st.step))
    const z = (x - s.mu) / s.sigma
    const h = z * 100
    const exact = Math.abs(h - Math.round(h)) < 1e-6
    if (!exact && Math.abs(h - Math.floor(h) - 0.5) < 0.05) continue
    const zr = round2(z)
    if (zr < zlo || zr > zhi || x <= 0) continue
    return { x, z, zr, exact }
  }
}
// the standardizing step, as a solution line
function zLine(s, p) {
  const head = `\\frac{${dec(p.x)} - ${dec(s.mu)}}{${dec(s.sigma)}}`
  if (p.exact) return `z = ${head} = ${zs(p.zr)}`
  return `z = ${head} = ${dec(Number(p.z.toFixed(4)))}\\ldots \\approx ${zs(p.zr)}`
}

const HINT = {
  latex: 'z = \\frac{x - \\mu}{\\sigma} \\;\\to\\; \\text{round to 2 decimals} \\;\\to\\; P(Z < z) \\text{ from the table}',
  text: 'Standardize each x and round z to 2 decimals (the table has 2) before you look it up. Less than: the entry. More than: 1 − entry. Between: the bigger entry minus the smaller.',
}
const HINT_BACK = {
  latex: '\\text{probability} \\to \\text{left area} \\to z \\to x = \\mu + z\\sigma',
  text: 'Turn the tail into a LEFT area (top 5% means left area 0.95), find the closest table entry (halfway between two: use the z halfway between), then x = μ + zσ.',
}

export default {
  id: 'normal-apps',
  name: 'Normal word problems',
  description: '§4.4: x ↔ z ↔ left area ↔ probability.',
  learn: {
    formulas: [
      { label: 'Standardize', latex: 'z = \\frac{x - \\mu}{\\sigma}' },
      { label: 'Back to x', latex: 'x = \\mu + z\\sigma' },
      { label: 'Less than', latex: 'P(X < x) = P(Z < z)' },
      { label: 'More than', latex: 'P(X > x) = 1 - P(Z < z)' },
      { label: 'Between', latex: '\\begin{gathered} P(a < X < b) \\\\ = P(Z < z_b) - P(Z < z_a) \\end{gathered}' },
      { label: 'Outside a and b', latex: '1 - P(a < X < b)' },
    ],
    how: [
      'x → z: subtract the mean, divide by σ (if you are given σ², take its square root first). Round z to 2 decimals to match the table.',
      'z → left area: row = ones and tenths, column = hundredths.',
      'Left area → probability: "less than" is the entry, "more than" is 1 − entry, "between" is a difference of entries, "outside" is 1 − the between area.',
      'Hydrocarbons (μ = 1, σ = 0.25): P(0.9 < X < 1.54) uses z = −0.40 and 2.16, so 0.9846 − 0.3446 = 0.6400.',
      'Backwards (probability → x): make it a LEFT area, find z in the table, then x = μ + zσ.',
      'Radiation (μ = 500, σ = 150): only 5% survive above x means P(X > x) = 0.05, left area 0.95, z = 1.645, x = 500 + 1.645(150) = 746.75.',
    ],
  },
  templates: [
    {
      id: 'z-score',
      generate() {
        const s = setup()
        const p = pickX(s, -3, 3)
        return {
          ask: 'Find the z-score, to 2 decimals.',
          text: s.intro,
          latex: `x = ${dec(p.x)}, \\quad z = \\,?`,
          answer: p.zr,
          answerLatex: `${s.sigmaLine}${p.exact ? zLine(s, p) : `${zLine(s, p).replace(' \\approx ', ', \\text{ so } z = ')}`}`,
          placeholder: 'e.g. 1.33',
          tolerance: 0.0051,
          hint: {
            latex: 'z = \\frac{x - \\mu}{\\sigma}',
            text: 'Subtract the mean, then divide by the standard deviation (the square root of the variance). z counts how many σ x is from μ.',
          },
          // sign flipped, divided by the variance, forgot to subtract μ
          distractors: [-p.zr, round2((p.x - s.mu) / (s.sigma * s.sigma)), round2(p.x / s.sigma)].filter(v => Number.isFinite(v) && Math.abs(v - p.zr) > 0.0051),
        }
      },
    },
    {
      id: 'less-more',
      generate() {
        const s = setup()
        const p = pickX(s)
        const more = Math.random() < 0.5
        const e = zTable(p.zr)
        const ans = more ? 1 - e : e
        const wrongVar = zTable((p.x - s.mu) / (s.sigma * s.sigma))
        return {
          ask: ASK,
          text: `${s.intro} What fraction of ${s.st.who} ${more ? s.st.more(dec(p.x)) : s.st.less(dec(p.x))}?`,
          latex: `P(X ${more ? '>' : '<'} ${dec(p.x)}) = \\,?`,
          answer: ans,
          answerLatex: `${s.sigmaLine}${zLine(s, p)}: \\; ${more ? `1 - ${f4(e)} = ${f4(ans)}` : `P(Z < ${zs(p.zr)}) = ${f4(ans)}`}`,
          placeholder: 'e.g. 0.0918',
          tolerance: AREA_TOL,
          hint: HINT,
          // the other side, the sign of z flipped twice over, z off by a row, σ² for σ
          distractors: probs(more ? e : 1 - e, more ? 1 - wrongVar : wrongVar, more ? 1 - zTable(p.zr + 0.1) : zTable(p.zr + 0.1), more ? 1 - zTable(p.zr - 0.1) : zTable(p.zr - 0.1)),
        }
      },
    },
    {
      id: 'between',
      generate() {
        const s = setup()
        let a
        let b
        do {
          a = pickX(s, -2.6, 2)
          b = pickX(s, -2, 2.6)
        } while (b.zr - a.zr < 0.3)
        const ea = zTable(a.zr)
        const eb = zTable(b.zr)
        const ans = eb - ea
        return {
          ask: ASK,
          text: `${s.intro} What fraction of ${s.st.who} ${s.st.between(dec(a.x), dec(b.x))}?`,
          latex: `P(${dec(a.x)} < X < ${dec(b.x)}) = \\,?`,
          size: 'small',
          answer: ans,
          answerLatex: `${s.sigmaLine}z_a = ${zs(a.zr)},\\; z_b = ${zs(b.zr)}: \\; ${f4(eb)} - ${f4(ea)} = ${f4(ans)}`,
          placeholder: 'e.g. 0.6400',
          tolerance: AREA_TOL,
          hint: HINT,
          // the outside, the upper entry alone, the entries added, a's tail on the wrong side
          distractors: probs(1 - ans, eb, ea + eb, eb - (1 - ea)),
        }
      },
    },
    {
      id: 'outside',
      generate() {
        const s = setup(STORIES.filter(st => st.limits))
        let a
        let b
        do {
          a = pickX(s, -2.8, -0.8)
          b = pickX(s, 0.8, 2.8)
        } while (a.x >= b.x)
        const ea = zTable(a.zr)
        const eb = zTable(b.zr)
        const ans = ea + (1 - eb)
        return {
          ask: ASK,
          text: `${s.intro} ${s.st.limits(dec(a.x), dec(b.x))} What fraction is rejected?`,
          latex: `P(X < ${dec(a.x)}) + P(X > ${dec(b.x)}) = \\,?`,
          size: 'small',
          answer: ans,
          answerLatex: `${s.sigmaLine}z = ${zs(a.zr)},\\; ${zs(b.zr)}: \\; ${f4(ea)} + (1 - ${f4(eb)}) = ${f4(ans)}`,
          placeholder: 'e.g. 0.0896',
          tolerance: AREA_TOL,
          hint: {
            latex: 'P(\\text{outside}) = P(Z < z_a) + \\big(1 - P(Z < z_b)\\big) = 1 - P(a < X < b)',
            text: 'Two tails: the entry at the low limit, plus 1 − the entry at the high limit. Round each z to 2 decimals first. The limits are rarely symmetric, so do both.',
          },
          // the accepted fraction, one tail only, the low tail doubled
          distractors: probs(eb - ea, ea, 1 - eb, 2 * ea),
        }
      },
    },
    {
      id: 'x-from-area',
      generate() {
        for (;;) {
          const s = setup(STORIES, false)
          let p
          if (Math.random() < 0.6) p = choice([1, 2.5, 5, 10, 15, 20, 25, 30, 40])
          else p = Number(((1 - zTable(randInt(30, 250) / 100)) * 100).toFixed(2))
          const top = s.st.radiation ? true : Math.random() < 0.5
          const left = top ? 1 - p / 100 : p / 100
          const r = zForLeftArea(left)
          if (r.hi - r.lo > 0.011) continue
          const x = s.mu + r.z * s.sigma
          const question = s.st.radiation
            ? `Above what dosage will only ${p}% of those exposed survive?`
            : `What ${s.st.noun} cuts off the ${top ? 'top' : 'bottom'} ${p}%?`
          const tie = r.lo !== r.hi ? `\\text{ (halfway between ${zs(r.lo)} and ${zs(r.hi)})}` : ''
          return {
            ask: ASK,
            text: `${s.intro} ${question}`,
            latex: 'x = \\,?',
            answer: x,
            answerLatex: `${top ? `P(X > x) = ${dec(p / 100)}, \\text{ left area } ${dec(Number(left.toFixed(5)))}` : `\\text{left area } ${dec(p / 100)}`}: \\; z = ${num(r.z)}${tie}, \\; x = ${dec(s.mu)} + (${num(r.z)})(${dec(s.sigma)}) = ${num(x)}`,
            placeholder: 'e.g. 746.75',
            tolerance: s.sigma * Math.max(0.0051, (r.hi - r.lo) / 2 + 0.0001) + 0.01,
            hint: HINT_BACK,
            // the wrong tail, the z of a two-sided cutoff, z left unconverted, a row slip
            distractors: [
              s.mu - r.z * s.sigma,
              s.mu + zForLeftArea(top ? 1 - p / 200 : p / 200).z * s.sigma,
              r.z,
              s.mu + (r.z + (r.z < 0 ? -0.1 : 0.1)) * s.sigma,
            ].filter(v => Number.isFinite(v)),
          }
        }
      },
    },
    {
      id: 'middle',
      generate() {
        const s = setup(STORIES, false)
        const A = choice([50, 60, 68, 70, 80, 90, 95, 98, 99])
        const upper = Math.random() < 0.5
        const left = upper ? (1 + A / 100) / 2 : (1 - A / 100) / 2
        const r = zForLeftArea(left)
        const x = s.mu + r.z * s.sigma
        const tie = r.lo !== r.hi ? `\\text{ (halfway between ${zs(r.lo)} and ${zs(r.hi)})}` : ''
        return {
          ask: ASK,
          text: `${s.intro} The middle ${A}% of values lie between x₁ and x₂, centered on μ. Find ${upper ? 'x₂' : 'x₁'}.`,
          latex: `P(x_1 < X < x_2) = ${dec(A / 100)}`,
          answer: x,
          answerLatex: `\\text{each tail } ${dec((1 - A / 100) / 2)}, \\text{ left area } ${dec(Number(left.toFixed(5)))}: \\; z = ${num(r.z)}${tie}, \\; x = ${dec(s.mu)} + (${num(r.z)})(${dec(s.sigma)}) = ${num(x)}`,
          placeholder: 'e.g. 124.68',
          tolerance: s.sigma * Math.max(0.0051, (r.hi - r.lo) / 2 + 0.0001) + 0.01,
          hint: {
            latex: 'P(-z < Z < z) = A \\;\\Rightarrow\\; P(Z < z) = \\frac{1 + A}{2}, \\quad x = \\mu \\pm z\\sigma',
            text: 'The middle A leaves (1 − A)/2 in each tail. The upper cutoff has left area (1 + A)/2; the lower one is the same distance below μ.',
          },
          // the other end, A not split into two tails, z left unconverted, a row slip
          distractors: [2 * s.mu - x, s.mu + (upper ? 1 : -1) * zForLeftArea(A / 100).z * s.sigma, r.z, s.mu + (r.z + (upper ? 0.1 : -0.1)) * s.sigma].filter(
            v => Number.isFinite(v),
          ),
        }
      },
    },
  ],
}
