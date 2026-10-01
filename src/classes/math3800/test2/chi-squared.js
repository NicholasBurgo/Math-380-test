import { randInt, choice } from '../../../engine/rand.js'
import { CHI2_LEFT, chi2Table } from '../dist.js'
import { dec } from './util.js'

// §4.3: reading the chi-squared table both ways. The columns are the area to
// the LEFT of the entry, and χ²_r has area r to the RIGHT, so χ²_r sits in
// column 1 − r. Every value answer is a table entry (what the Tables panel
// shows) and every area answer is built from column headings.

const ASK = 'Use the chi-squared table (Tables button).'
const ASK_C = 'Find c. Use the chi-squared table (Tables button).'
const AREA_TOL = 0.0005

// an entry as the Tables panel prints it: 3 significant figures, zeros kept
function shown(v) {
  const mag = Math.floor(Math.log10(Math.abs(v)))
  return v.toFixed(Math.max(0, 2 - mag))
}
// a value read off the table: ±1 in its last printed digit
const valueTol = v => 10 ** (Math.floor(Math.log10(Math.abs(v))) - 2) * 1.001
const colIndex = a => CHI2_LEFT.findIndex(c => Math.abs(c - a) < 1e-9)
const other = a => CHI2_LEFT[colIndex(1 - a)] // the column for 1 − a
const near = (i, step) => CHI2_LEFT[Math.min(CHI2_LEFT.length - 1, Math.max(0, i + step))]
const otherRow = df => (df === 30 ? 29 : df + 1)
const dfText = df => `X is chi-squared with γ = ${df} degree${df === 1 ? '' : 's'} of freedom.`
// small right areas are what tests ask about most
const someR = () => (Math.random() < 0.6 ? choice([0.005, 0.01, 0.025, 0.05, 0.1]) : choice(CHI2_LEFT))

const HINT_VALUE = {
  latex: 'P(\\chi^2 > \\chi^2_r) = r \\;\\Rightarrow\\; \\text{read column } 1 - r',
  text: 'The columns are areas to the LEFT. A right area r means column 1 − r, in the row for γ. χ²_0.05 with γ = 10 is in column 0.95: 18.3.',
}
const HINT_AREA = {
  latex: 'P(\\chi^2 < \\text{entry}) = \\text{column}, \\quad P(\\chi^2 > \\text{entry}) = 1 - \\text{column}',
  text: 'Find the value in the row for γ. Its column heading is the area to its LEFT. For "greater than", subtract that area from 1.',
}

export default {
  id: 'chi-squared',
  name: 'Chi-squared table',
  description: '§4.3: chi-squared values from areas, and areas from values.',
  learn: {
    formulas: [
      { label: 'Chi-squared with γ degrees of freedom', latex: '\\text{gamma with } \\alpha = \\tfrac{\\gamma}{2},\\; \\beta = 2' },
      { label: 'Mean and variance', latex: 'E[\\chi^2] = \\gamma, \\quad \\operatorname{Var}\\chi^2 = 2\\gamma' },
      { label: 'Each column is the area to the LEFT', latex: 'P(\\chi^2 < \\text{entry}) = \\text{column}' },
      { label: 'χ²_r has area r to the RIGHT', latex: '\\begin{gathered} P(\\chi^2 > \\chi^2_r) = r \\\\ \\Rightarrow \\text{ read column } 1 - r \\end{gathered}' },
      { label: 'Greater than an entry', latex: 'P(\\chi^2 > c) = 1 - \\text{column}' },
      { label: 'Between two entries', latex: 'P(c_1 < \\chi^2 < c_2) = \\text{col}_2 - \\text{col}_1' },
    ],
    how: [
      'Rows are the degrees of freedom γ. Column headings are the area to the LEFT of the entry.',
      'χ²_r has area r to its RIGHT, so read column 1 − r. For γ = 14: χ²_0.005 is in column 0.995 (31.3) and χ²_0.995 is in column 0.005 (4.07).',
      'Value from a left area: that area is the column. From a right area r: column 1 − r.',
      'Area from a value: find the value in the row for γ. Its column is P(χ² < value); P(χ² > value) is 1 − column.',
      'Between two entries: the larger column minus the smaller one (in row 13, P(4.11 < χ² < 27.7) = 0.99 − 0.01 = 0.98).',
      'χ² is continuous, so < and ≤ give the same area.',
    ],
  },
  templates: [
    {
      id: 'critical',
      generate() {
        const df = randInt(1, 30)
        const r = someR()
        const left = other(r)
        const ans = chi2Table(left, df)
        const tail = Math.random() < 0.35
        const i = colIndex(left)
        const name = tail ? 'c' : `\\chi^2_{${r}}`
        return {
          ask: tail ? ASK_C : ASK,
          text: dfText(df),
          latex: tail ? `P(\\chi^2 > c) = ${r}` : `\\chi^2_{${r}} = \\,?`,
          answer: ans,
          answerLatex: `\\text{right area } ${r} \\Rightarrow \\text{column } 1 - ${r} = ${left}, \\text{ row } ${df}: \\; ${name} = ${shown(ans)}`,
          placeholder: 'e.g. 23.7',
          tolerance: valueTol(ans),
          hint: HINT_VALUE,
          // column r instead of 1 − r, the next row, a neighboring column
          distractors: [chi2Table(r, df), chi2Table(left, otherRow(df)), chi2Table(near(i, 1), df), chi2Table(near(i, -1), df)],
        }
      },
    },
    {
      id: 'left-value',
      generate() {
        const df = randInt(1, 30)
        const a = choice(CHI2_LEFT)
        const ans = chi2Table(a, df)
        const i = colIndex(a)
        return {
          ask: ASK_C,
          text: dfText(df),
          latex: `P(\\chi^2 ${Math.random() < 0.5 ? '\\le' : '<'} c) = ${a}`,
          answer: ans,
          answerLatex: `\\text{left area } ${a} \\text{ is the column}, \\text{ row } ${df}: \\; c = ${shown(ans)}`,
          placeholder: 'e.g. 5.23',
          tolerance: valueTol(ans),
          hint: {
            latex: 'P(\\chi^2 \\le c) = \\text{column heading}',
            text: 'A left area is exactly what the columns list: go to row γ and that column. (Only a right area needs the 1 − r switch.)',
          },
          distractors: [chi2Table(other(a), df), chi2Table(a, otherRow(df)), chi2Table(near(i, 1), df), chi2Table(near(i, -1), df)],
        }
      },
    },
    {
      id: 'right-area',
      generate() {
        const df = randInt(1, 30)
        const a = choice(CHI2_LEFT)
        const i = colIndex(a)
        const c = chi2Table(a, df)
        const ans = 1 - a
        return {
          ask: ASK,
          text: dfText(df),
          latex: `P(\\chi^2 > ${shown(c)}) = \\,?`,
          size: shown(c).length > 5 ? 'small' : undefined,
          answer: ans,
          answerLatex: `${shown(c)} \\text{ is in row } ${df}, \\text{ column } ${a}: \\; 1 - ${a} = ${dec(ans)}`,
          placeholder: 'e.g. 0.05',
          tolerance: AREA_TOL,
          hint: HINT_AREA,
          // forgot the 1 −, or read a neighboring column
          distractors: [a, 1 - near(i, 1), 1 - near(i, -1), near(i, 1)],
        }
      },
    },
    {
      id: 'left-area',
      generate() {
        const df = randInt(1, 30)
        const a = choice(CHI2_LEFT)
        const i = colIndex(a)
        const c = chi2Table(a, df)
        return {
          ask: ASK,
          text: dfText(df),
          latex: `P(\\chi^2 ${Math.random() < 0.5 ? '\\le' : '<'} ${shown(c)}) = \\,?`,
          size: shown(c).length > 5 ? 'small' : undefined,
          answer: a,
          answerLatex: `${shown(c)} \\text{ is in row } ${df}, \\text{ column } ${a}: \\; P = ${a}`,
          placeholder: 'e.g. 0.95',
          tolerance: AREA_TOL,
          hint: HINT_AREA,
          distractors: [1 - a, near(i, 1), near(i, -1), 1 - near(i, 1)],
        }
      },
    },
    {
      id: 'between',
      generate() {
        const df = randInt(1, 30)
        let i
        let j
        do {
          i = randInt(0, CHI2_LEFT.length - 1)
          j = randInt(0, CHI2_LEFT.length - 1)
        } while (j - i < 2)
        const a1 = CHI2_LEFT[i]
        const a2 = CHI2_LEFT[j]
        const ans = a2 - a1
        return {
          ask: ASK,
          text: dfText(df),
          latex: `P(${shown(chi2Table(a1, df))} < \\chi^2 < ${shown(chi2Table(a2, df))}) = \\,?`,
          size: 'small',
          answer: ans,
          answerLatex: `\\text{row } ${df}: \\text{ columns } ${a2} \\text{ and } ${a1}, \\; ${a2} - ${a1} = ${dec(ans)}`,
          placeholder: 'e.g. 0.9',
          tolerance: AREA_TOL,
          hint: {
            latex: 'P(c_1 < \\chi^2 < c_2) = P(\\chi^2 < c_2) - P(\\chi^2 < c_1)',
            text: 'Both columns are left areas. The area between is the larger column minus the smaller one.',
          },
          // the outside, one end only, a sum
          distractors: [1 - ans, a2, 1 - a1, a1 + a2].filter(v => v > 0 && v < 1),
        }
      },
    },
    {
      id: 'mean-var',
      generate() {
        const hint = {
          latex: '\\chi^2_\\gamma:\\; \\alpha = \\tfrac{\\gamma}{2},\\; \\beta = 2 \\;\\Rightarrow\\; \\mu = \\gamma, \\quad \\sigma^2 = 2\\gamma',
          text: 'Chi-squared with γ degrees of freedom is gamma with α = γ/2 and β = 2, so μ = αβ = γ and σ² = αβ² = 2γ. Given the variance, γ is half of it.',
        }
        const kind = choice(['moment', 'moment', 'df', 'table', 'table'])
        if (kind === 'moment') {
          const df = randInt(1, 30)
          const ask = choice([
            { latex: 'E[X] = \\,?', v: df, shown: `\\mu = \\gamma = ${df}`, wrong: [2 * df, df / 2, df - 2] },
            { latex: '\\operatorname{Var}X = \\,?', v: 2 * df, shown: `\\sigma^2 = 2\\gamma = 2(${df}) = ${2 * df}`, wrong: [df, 4 * df, df * df] },
            {
              latex: '\\sigma_X = \\,?',
              v: Math.sqrt(2 * df),
              shown: `\\sigma = \\sqrt{2\\gamma} = \\sqrt{${2 * df}} = ${dec(Number(Math.sqrt(2 * df).toFixed(4)))}`,
              wrong: [2 * df, Math.sqrt(df), df],
            },
          ])
          return {
            ask: 'Chi-squared mean and variance.',
            text: dfText(df),
            latex: ask.latex,
            answer: ask.v,
            answerLatex: ask.shown,
            placeholder: 'e.g. 12',
            tolerance: Math.max(0.001, ask.v * 0.002),
            hint,
            distractors: ask.wrong.filter(w => w > 0 && Math.abs(w - ask.v) > 1e-9),
          }
        }
        if (kind === 'df') {
          const df = randInt(1, 30)
          const bySd = [2, 8, 18].includes(df) && Math.random() < 0.5
          const given = bySd ? `standard deviation ${Math.sqrt(2 * df)}` : `variance ${2 * df}`
          return {
            ask: 'Find the degrees of freedom from the variance.',
            text: `X is chi-squared with ${given}.`,
            latex: '\\gamma = \\,?',
            answer: df,
            answerLatex: `${bySd ? `\\sigma^2 = ${Math.sqrt(2 * df)}^2 = ${2 * df}, \\; ` : ''}2\\gamma = ${2 * df} \\;\\Rightarrow\\; \\gamma = ${df}`,
            placeholder: 'e.g. 9',
            tolerance: 0.001,
            hint,
            // the variance (or σ) read as γ, twice it, one off
            distractors: [2 * df, bySd ? Math.sqrt(2 * df) : 4 * df, Math.max(1, df - 1), df + 1],
          }
        }
        // find γ from a moment, then read the table
        const df = randInt(2, 30)
        const byVar = Math.random() < 0.6
        const r = someR()
        const left = other(r)
        const ans = chi2Table(left, df)
        return {
          ask: 'Find γ first, then use the chi-squared table (Tables button).',
          text: `X is chi-squared with ${byVar ? `variance ${2 * df}` : `mean ${df}`}.`,
          latex: `\\chi^2_{${r}} = \\,?`,
          answer: ans,
          answerLatex: `${byVar ? `2\\gamma = ${2 * df} \\Rightarrow ` : ''}\\gamma = ${df}, \\text{ column } 1 - ${r} = ${left}: \\; \\chi^2_{${r}} = ${shown(ans)}`,
          placeholder: 'e.g. 18.3',
          tolerance: valueTol(ans),
          hint,
          // the variance read as γ, column r for 1 − r, the next row
          distractors: [byVar && 2 * df <= 30 ? chi2Table(left, 2 * df) : chi2Table(left, df - 1), chi2Table(r, df), chi2Table(left, otherRow(df))],
        }
      },
    },
  ],
}
