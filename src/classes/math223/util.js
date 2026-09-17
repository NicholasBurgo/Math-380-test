import { randInt, shuffle } from '../../engine/rand.js'

export const LETTERS = 'abcdefgh'

const cmp = (a, b) =>
  typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
export const sortEls = arr => [...arr].sort(cmp)

// Roster notation for display: setStr -> "{1, 3, 9}", setLatex -> "\{1, 3, 9\}".
export const setStr = s => (s.length ? `{${s.join(', ')}}` : '∅')
export const setLatex = s => (s.length ? `\\{${s.join(', ')}\\}` : '\\varnothing')

export function randSubset(pool, min, max) {
  const size = randInt(min, Math.min(max, pool.length))
  return sortEls(shuffle(pool).slice(0, size))
}

export const tf = b => (b ? 'true' : 'false')
export const tfLatex = b => `\\text{${b ? 'true' : 'false'}}`
export const yn = b => (b ? 'yes' : 'no')
export const ynLatex = b => `\\text{${b ? 'yes' : 'no'}}`

// ---------- typed set answers ----------

// Split on top-level commas, ignoring commas nested in () or {}. A single
// token with inner spaces and no nesting is treated as space-separated.
function splitTop(s) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(' || ch === '{') depth++
    if (ch === ')' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  const parts = out.map(x => x.trim()).filter(Boolean)
  if (parts.length === 1 && !/[({]/.test(parts[0]) && /\s/.test(parts[0])) return parts[0].split(/\s+/)
  return parts
}

const EMPTY = /^(∅|\{\s*\}|\\?(emptyset|varnothing)|empty ?set|empty|null ?set|void)$/i

// One element in canonical form: numbers as numbers, letters lowercase,
// pairs "(a,b)", nested sets "{a,b}" with sorted members, empty set "{}".
function normEl(tok) {
  const t = tok.trim()
  if (EMPTY.test(t)) return '{}'
  if (t.startsWith('(') && t.endsWith(')')) return `(${splitTop(t.slice(1, -1)).map(normEl).join(',')})`
  if (t.startsWith('{') && t.endsWith('}'))
    return `{${[...new Set(splitTop(t.slice(1, -1)).map(normEl))].sort().join(',')}}`
  const n = Number(t.replace(/−/g, '-'))
  if (t !== '' && Number.isFinite(n)) return String(n)
  return t.toLowerCase()
}

// "{1, 3, 9}", "1,3,9", "{(x,1), (y,2)}", "∅", "{}" -> sorted canonical
// elements, or null when unreadable.
export function parseSetInput(raw) {
  let t = String(raw).trim().replace(/−/g, '-')
  if (EMPTY.test(t)) return []
  if (t.startsWith('{') && t.endsWith('}')) t = t.slice(1, -1)
  else if (t.startsWith('{') || t.endsWith('}')) return null
  if (t.trim() === '') return null
  return [...new Set(splitTop(t).map(normEl))].sort()
}

export const normSet = arr => [...new Set(arr.map(x => normEl(String(x))))].sort()

export function acceptSet(expected) {
  const want = normSet(expected).join('|')
  return raw => {
    const got = parseSetInput(raw)
    return got !== null && got.join('|') === want
  }
}

// ---------- truth-table columns ----------

export const acceptColumn = col => raw =>
  String(raw).toUpperCase().replace(/1/g, 'T').replace(/0/g, 'F').replace(/[^TF]/g, '') === col

// ---------- intervals ----------

export function normInterval(s) {
  let t = String(s)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/−/g, '-')
    .replace(/\\left|\\right/g, '')
  t = t.replace(/\\?(infty|infinity|inf|oo)|∞/g, 'inf')
  if (/^(∅|\{\}|\\?(emptyset|varnothing)|empty(set)?|none|nothing)$/.test(t)) return '∅'
  if (/^(r|ℝ|\\?mathbb\{r\}|reals|allreals|\(-inf,inf\)|\(-inf,\+?inf\))$/.test(t)) return 'R'
  return t
}

export const acceptInterval = expected => raw => {
  const e = normInterval(expected)
  const g = normInterval(raw)
  return g === e || (e.startsWith('{') && `{${g}}` === e)
}

// ---------- lettered options ----------

const optKey = o => (typeof o === 'string' ? o : o.latex)

// Shuffle the correct option in with up to three wrong ones; the answer is
// the letter it lands on. Wrong options equal to the right one are dropped.
export function withOptions(problem, correct, wrong) {
  const seen = new Set([optKey(correct)])
  const distinct = wrong.filter(w => !seen.has(optKey(w)) && seen.add(optKey(w))).slice(0, 3)
  const options = shuffle([correct, ...distinct])
  const letter = LETTERS[options.indexOf(correct)]
  return {
    ...problem,
    options,
    answer: letter,
    answerLatex: `\\text{(${letter})}`,
    placeholder: 'a, b, c, or d',
  }
}

// ---------- small number theory ----------

export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

export const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b)
