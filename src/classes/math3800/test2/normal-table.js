import { randInt, choice } from '../../../engine/rand.js'
import { zTable, zForLeftArea } from '../dist.js'
import { dec, num } from './util.js'

// §4.4: reading the standard normal table both ways. Every entry is P(Z < z)
// for z to 2 decimals, the area to the LEFT. Areas come from zTable and z
// values from zForLeftArea, exactly what the Tables panel shows. Backwards
// problems mostly use areas that are table entries, so z comes out clean.

const ASK = 'Use the standard normal table (Tables button).'
const ASK_Z = 'Find z₀. Use the standard normal table (Tables button).'
// an area read off the table: ±1 in the fourth decimal
const AREA_TOL = 0.00015
const f4 = v => v.toFixed(4)
const zs = z => z.toFixed(2)
// a z in hundredths between lo and hi
const someZ = (lo, hi) => randInt(Math.round(lo * 100), Math.round(hi * 100)) / 100
// keep z answers off the flat tails of the table, where several entries repeat
const usable = r => Math.abs(r.z) <= 2.6 && r.hi - r.lo < 0.011
// a z read back from an area: when the area sits halfway between two entries,
// either neighbor (or the midpoint) is right
const zTol = r => Math.max(0.0051, (r.hi - r.lo) / 2 + 0.0001)
const probs = (...vs) => vs.filter(v => Number.isFinite(v) && v > 0 && v < 1)
const zOf = left => (left > 0 && left < 1 ? zForLeftArea(left).z : NaN)
// wrong z values, likeliest mistake first; then the sign flipped, a row slip
// either way, and (when z is a single entry) the next column. Choices mode
// drops negatives when the answer is positive, so the list runs long.
const zWrong = (r, ...vs) =>
  [...vs, -r.z, r.z + 0.1, r.z - 0.1, ...(r.lo === r.hi ? [r.z + 0.01, r.z - 0.01] : [])]
    .map(v => Math.round(v * 1000) / 1000)
    .filter(v => Number.isFinite(v) && Math.abs(v - r.z) > zTol(r))

// where z sits in the table: row = ones and tenths, column = hundredths
function cell(z) {
  const h = Math.round(Math.abs(z) * 100)
  return `\\text{row } ${z < 0 ? '-' : ''}${(Math.floor(h / 10) / 10).toFixed(1)},\\ \\text{column } 0.0${h % 10}`
}
// an area as printed in a problem: 4 decimals for table entries, short otherwise
const area4 = a => (String(a).length > 5 ? f4(a) : dec(a))
// how the left area turns into z, as a solution line
function readBack(left, r) {
  const L = dec(Number(left.toFixed(5)))
  if (r.lo !== r.hi) return `${L} \\text{ is halfway between } ${f4(zTable(r.lo))} \\text{ and } ${f4(zTable(r.hi))}, \\text{ at } ${zs(r.lo)} \\text{ and } ${zs(r.hi)}`
  if (Math.abs(zTable(r.z) - left) < 1e-9) return `${f4(zTable(r.z))} \\text{ is the entry at } ${zs(r.z)}`
  return `\\text{the closest entry to } ${L} \\text{ is } ${f4(zTable(r.z))}`
}

const HINT_AREA = {
  latex: 'P(Z < z) = \\text{entry}, \\quad P(Z > z) = 1 - \\text{entry}, \\quad P(a < Z < b) = \\text{entry}(b) - \\text{entry}(a)',
  text: 'Row: z to one decimal. Column: the second decimal. The entry is the area to the LEFT of z; anything else is built from left areas.',
}
const HINT_Z = {
  latex: 'P(Z > z_0) = r \\;\\Rightarrow\\; P(Z < z_0) = 1 - r',
  text: 'Turn the area into a LEFT area first. Then search the body of the table for the entry closest to it and read its row and column. Halfway between two entries: use the z halfway between.',
}

export default {
  id: 'normal-table',
  name: 'Standard normal table',
  description: '§4.4: areas from z, and z from areas.',
  learn: {
    formulas: [
      { label: 'Each entry is the area to the LEFT', latex: '\\text{entry at } z = P(Z < z)' },
      { label: 'Right tail', latex: 'P(Z > z) = 1 - P(Z < z)' },
      { label: 'Between', latex: '\\begin{gathered} P(a < Z < b) \\\\ = P(Z < b) - P(Z < a) \\end{gathered}' },
      { label: 'Both tails', latex: '\\begin{gathered} P(Z < -c \\text{ or } Z > c) \\\\ = 2P(Z < -c) \\end{gathered}' },
      { label: 'Notation: area r to the RIGHT of z_r', latex: '\\begin{gathered} P(Z > z_r) = r \\\\ P(Z < z_r) = 1 - r \\end{gathered}' },
    ],
    how: [
      'Row: the ones and tenths of z. Column: the hundredths. P(Z < 1.42) is row 1.4, column 0.02: 0.9222.',
      'The entry is always the area to the LEFT. "Greater than" is 1 − entry: P(Z > 0.51) = 1 − 0.6950 = 0.3050.',
      'Between: look up both ends and subtract. P(−0.13 < Z < 2.40) = 0.9918 − 0.4483 = 0.5435.',
      'Backwards (z from an area): make it a LEFT area, find the closest entry in the body of the table, and read its row and column.',
      'A right area r is left area 1 − r. A middle area A between −z0 and z0 is left area (1 + A)/2. For P(a < Z < z0) = A, the left area at z0 is A + P(Z < a).',
      'Halfway between two entries? Use the z halfway between: left area 0.95 sits between 0.9495 (1.64) and 0.9505 (1.65), so z = 1.645.',
    ],
  },
  templates: [
    {
      id: 'left',
      generate() {
        const z = someZ(-3.4, 3.4)
        const ans = zTable(z)
        const rowOnly = Math.trunc(z * 10) / 10
        return {
          ask: ASK,
          latex: `P(Z ${Math.random() < 0.25 ? '\\le' : '<'} ${zs(z)}) = \\,?`,
          answer: ans,
          answerLatex: `${cell(z)}: \\; P(Z < ${zs(z)}) = ${f4(ans)}`,
          placeholder: 'e.g. 0.9222',
          tolerance: AREA_TOL,
          hint: HINT_AREA,
          // the right tail, the row without its column, the next column
          distractors: probs(1 - ans, zTable(rowOnly), zTable(z + 0.01), zTable(z - 0.1)),
        }
      },
    },
    {
      id: 'right',
      generate() {
        const z = someZ(-3.2, 3.2)
        const e = zTable(z)
        const ans = 1 - e
        return {
          ask: ASK,
          latex: `P(Z ${Math.random() < 0.25 ? '\\ge' : '>'} ${zs(z)}) = \\,?`,
          answer: ans,
          answerLatex: `${cell(z)}: \\; 1 - ${f4(e)} = ${f4(ans)}`,
          placeholder: 'e.g. 0.3050',
          tolerance: AREA_TOL,
          hint: HINT_AREA,
          // forgot the 1 −, the next column, half the tail
          distractors: probs(e, 1 - zTable(z + 0.01), 1 - zTable(z - 0.1), 0.5 - e),
        }
      },
    },
    {
      id: 'between',
      generate() {
        let a
        let b
        do {
          a = someZ(-3, 2.5)
          b = someZ(-2.5, 3)
        } while (b - a < 0.2)
        const ea = zTable(a)
        const eb = zTable(b)
        const ans = eb - ea
        return {
          ask: ASK,
          latex: `P(${zs(a)} < Z < ${zs(b)}) = \\,?`,
          size: 'small',
          answer: ans,
          answerLatex: `P(Z < ${zs(b)}) - P(Z < ${zs(a)}) = ${f4(eb)} - ${f4(ea)} = ${f4(ans)}`,
          placeholder: 'e.g. 0.5435',
          tolerance: AREA_TOL,
          hint: HINT_AREA,
          // added the entries, read a's entry for |a|, the outside
          distractors: probs(eb + ea, eb - zTable(Math.abs(a)), 1 - ans, eb - (1 - ea)),
        }
      },
    },
    {
      id: 'tails',
      generate() {
        const c = someZ(0.3, 3)
        const e = zTable(-c)
        const ans = 2 * e
        const abs = Math.random() < 0.35
        return {
          ask: ASK,
          latex: abs ? `P(|Z| > ${zs(c)}) = \\,?` : `P(Z < -${zs(c)} \\text{ or } Z > ${zs(c)}) = \\,?`,
          size: abs ? undefined : 'small',
          answer: ans,
          answerLatex: `\\text{two equal tails: } 2P(Z < -${zs(c)}) = 2(${f4(e)}) = ${f4(ans)}`,
          placeholder: 'e.g. 0.1336',
          tolerance: AREA_TOL,
          hint: {
            latex: 'P(|Z| > c) = P(Z < -c) + P(Z > c) = 2P(Z < -c)',
            text: 'The curve is symmetric, so the two tails are equal. Look up P(Z < −c) and double it (or take 1 − the middle).',
          },
          // one tail, the middle, the left area at c
          distractors: probs(e, 1 - ans, 1 - e, 2 * (1 - e)),
        }
      },
    },
    {
      id: 'z-one-side',
      generate() {
        for (;;) {
          const right = Math.random() < 0.5
          let area
          if (Math.random() < 0.7) {
            const e = zTable(someZ(-2.5, 2.5))
            area = Number(f4(right ? 1 - e : e))
          } else area = choice([0.01, 0.025, 0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.9, 0.95, 0.975, 0.99])
          const left = right ? 1 - area : area
          const r = zForLeftArea(left)
          if (!usable(r)) continue
          const shown = area4(area)
          return {
            ask: ASK_Z,
            latex: `P(Z ${right ? '>' : '<'} z_0) = ${shown}`,
            answer: r.z,
            answerLatex: `${right ? `P(Z < z_0) = 1 - ${shown} = ${dec(Number(left.toFixed(5)))}: \\; ` : ''}${readBack(left, r)}, \\; z_0 = ${num(r.z)}`,
            placeholder: 'e.g. -0.70',
            tolerance: zTol(r),
            hint: HINT_Z,
            // the area used on the wrong side, or read from a table of areas from 0 to z
            distractors: zWrong(r, zOf(right ? area : 1 - area), zOf(0.5 + area)),
          }
        }
      },
    },
    {
      id: 'z-middle',
      generate() {
        for (;;) {
          const sym = Math.random() < 0.5
          if (sym) {
            // P(−z0 < Z < z0) = A
            let A
            if (Math.random() < 0.7) {
              const z = someZ(0.1, 2.5)
              A = Number(f4(zTable(z) - zTable(-z)))
            } else A = choice([0.5, 0.6, 0.68, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99])
            const left = (1 + A) / 2
            const r = zForLeftArea(left)
            if (!usable(r) || r.z <= 0) continue
            const shown = area4(A)
            return {
              ask: ASK_Z,
              latex: `P(-z_0 < Z < z_0) = ${shown}`,
              size: 'small',
              answer: r.z,
              answerLatex: `P(Z < z_0) = \\tfrac{1 + ${shown}}{2} = ${dec(Number(left.toFixed(5)))}: \\; ${readBack(left, r)}, \\; z_0 = ${num(r.z)}`,
              placeholder: 'e.g. 1.645',
              tolerance: zTol(r),
              hint: {
                latex: 'P(-z_0 < Z < z_0) = A \\;\\Rightarrow\\; P(Z < z_0) = \\frac{1 + A}{2}',
                text: 'The middle area A leaves (1 − A)/2 in each tail. So the area to the left of z0 is A plus one tail: (1 + A)/2.',
              },
              // A used as the left area, the tail doubled instead of halved
              distractors: zWrong(r, zOf(A), zOf(2 * A - 1)),
            }
          }
          // P(a < Z < z0) = A
          let a
          let A
          if (Math.random() < 0.7) {
            a = someZ(-2.5, 1)
            const z0 = someZ(a + 0.3, 2.5)
            A = Number(f4(zTable(z0) - zTable(a)))
          } else {
            a = choice([-1.28, -1.5, -1, -0.5, -2, -1.96, -0.84])
            A = choice([0.5, 0.6, 0.7, 0.74, 0.75, 0.8, 0.85])
          }
          const ea = zTable(a)
          const left = A + ea
          if (left >= 0.9999) continue
          const r = zForLeftArea(left)
          if (!usable(r) || r.z <= a) continue
          const shown = area4(A)
          return {
            ask: ASK_Z,
            latex: `P(${zs(a)} < Z < z_0) = ${shown}`,
            size: 'small',
            answer: r.z,
            answerLatex: `P(Z < z_0) = ${shown} + P(Z < ${zs(a)}) = ${shown} + ${f4(ea)} = ${dec(Number(left.toFixed(5)))}: \\; ${readBack(left, r)}, \\; z_0 = ${num(r.z)}`,
            placeholder: 'e.g. 1.00',
            tolerance: zTol(r),
            hint: {
              latex: 'P(a < Z < z_0) = P(Z < z_0) - P(Z < a) \\;\\Rightarrow\\; P(Z < z_0) = A + P(Z < a)',
              text: 'The area left of z0 is the given area plus everything left of a. Add the entry for a, then read the table backwards.',
            },
            // forgot to add P(Z < a), subtracted it instead, added the area right of a
            distractors: zWrong(r, zOf(A), zOf(A - ea), zOf(A + 1 - ea)),
          }
        }
      },
    },
    {
      id: 'z-r',
      generate() {
        const r = Math.random() < 0.75 ? choice([0.005, 0.01, 0.025, 0.05, 0.1]) : choice([0.2, 0.25, 0.3, 0.75, 0.8, 0.9, 0.95, 0.975, 0.99])
        const left = 1 - r
        const res = zForLeftArea(left)
        const s = Math.min(r, 1 - r)
        const sign = r < 0.5 ? 1 : -1
        return {
          ask: ASK,
          latex: `z_{${r}} = \\,?`,
          answer: res.z,
          answerLatex: `P(Z < z_{${r}}) = 1 - ${r} = ${dec(left)}: \\; ${readBack(left, res)}, \\; z_{${r}} = ${num(res.z)}`,
          placeholder: 'e.g. 1.96',
          tolerance: zTol(res),
          hint: {
            latex: 'P(Z > z_r) = r \\;\\Rightarrow\\; P(Z < z_r) = 1 - r',
            text: 'z_r has area r to its RIGHT. The table lists left areas, so look for 1 − r. z_0.05 = 1.645, z_0.025 = 1.96, z_0.01 = 2.33.',
          },
          // with s the small tail: s split over two tails, s doubled (r itself as a
          // left area is the sign flip, which zWrong adds)
          distractors: zWrong(res, sign * zOf(1 - s / 2), sign * zOf(1 - 2 * s)),
        }
      },
    },
  ],
}
