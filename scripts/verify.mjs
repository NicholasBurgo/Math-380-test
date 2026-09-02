// Independent audit of every Math 3800 generator.
//
// For each generated problem, the checker re-derives the answer FROM THE
// DISPLAYED QUESTION (text/latex/ask) using separate math - brute-force
// enumeration where feasible - and compares it to the generator's stored
// answer. It also parses answerLatex (the solution shown on a miss) and
// confirms it equals the checked answer. A mismatch in either place means
// the app would drill something wrong.
//
// Run: npm run verify

import cls from '../src/classes/math3800/index.js'

const failures = []
const results = []

function pcts(s) {
  return [...s.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => parseFloat(m[1]) / 100)
}
function decimals(s) {
  return [...s.matchAll(/\d*\.\d+/g)].map(Number)
}
function ints(s) {
  return [...s.matchAll(/-?\d+/g)].map(Number)
}

// --- independent counting math (no factorial-division reuse) ---
function permCount(n, r) {
  let p = 1
  for (let i = 0; i < r; i++) p *= n - i
  return p
}
const combMemo = new Map()
function combCount(n, r) {
  if (r === 0 || r === n) return 1
  if (r < 0 || r > n) return 0
  const key = n + ',' + r
  if (!combMemo.has(key)) combMemo.set(key, combCount(n - 1, r - 1) + combCount(n - 1, r))
  return combMemo.get(key)
}
function enumerateCodes(m, k, norep) {
  let count = 0
  const stack = [[]]
  while (stack.length) {
    const cur = stack.pop()
    if (cur.length === k) {
      count++
      continue
    }
    for (let c = 0; c < m; c++) {
      if (norep && cur.includes(c)) continue
      stack.push([...cur, c])
    }
  }
  return count
}
function enumerateMultisetOrders(counts) {
  // distinct arrangements via DFS with counts - independent of the formula
  let total = 0
  const n = counts.reduce((a, b) => a + b, 0)
  function go(depth, c) {
    if (depth === n) {
      total++
      return
    }
    for (let i = 0; i < c.length; i++) {
      if (c[i] > 0) {
        c[i]--
        go(depth + 1, c)
        c[i]++
      }
    }
  }
  go(0, [...counts])
  return total
}

function parseSets(text) {
  const sets = [...text.matchAll(/\{([^}]*)\}/g)].map(m =>
    m[1].split(',').map(s => parseInt(s.trim(), 10)),
  )
  return { S: sets[0], A: sets[1], B: sets[2] }
}

function parseTable(latex) {
  const body = latex.replace(/\\begin\{array\}\{[^}]*\}/, '').replace(/\\end\{array\}/, '')
  const rows = body.split('\\\\')
  const xs = rows[0].split('&').slice(1).map(s => parseFloat(s))
  const ps = rows[1]
    .replace('\\hline', '')
    .split('&')
    .slice(1)
    .map(s => (s.trim() === '?' ? null : parseFloat(s)))
  return { xs, ps }
}

function latexValue(al) {
  if (typeof al !== 'string') return null
  const frac = al.match(/\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}/)
  if (frac) return parseFloat(frac[1]) / parseFloat(frac[2])
  const eq = al.match(/= (-?[\d.]+)\s*$/)
  if (eq) return parseFloat(eq[1])
  const lone = al.match(/^(-?[\d.]+)$/)
  if (lone) return parseFloat(lone[1])
  return null
}

// --- one independent re-derivation per template, keyed topic/template ---
const derive = {
  'counting/permutation'(p) {
    const [n, r] = ints(p.latex.includes('P_') ? p.latex : '')
    if (p.latex.includes('P_')) return permCount(n, r)
    const [rr, nn] = ints(p.text) // "r of n students"
    return permCount(nn, rr)
  },
  'counting/combination'(p) {
    if (p.latex.includes('binom')) {
      const [n, r] = ints(p.latex)
      return combCount(n, r)
    }
    const [r, n] = ints(p.text) // "group of r ... class of n"
    return combCount(n, r)
  },
  'counting/codes'(p) {
    const k = ints(p.text)[0]
    const m = p.text.includes('digits 0–9') ? 10 : p.text.includes('A–E') ? 5 : 4
    const norep = p.text.includes('cannot repeat')
    return enumerateCodes(m, k, norep)
  },
  'counting/indistinguishable'(p) {
    const [n, n1, n2, n3] = ints(p.text)
    if (n1 + n2 + n3 !== n) throw new Error(`stoplight counts ${n1}+${n2}+${n3} != ${n}`)
    return enumerateMultisetOrders([n1, n2, n3])
  },
  'events/set-count'(p) {
    const { S, A, B } = parseSets(p.text)
    const comp = X => S.filter(x => !X.includes(x))
    const union = (X, Y) => S.filter(x => X.includes(x) || Y.includes(x))
    const inter = (X, Y) => S.filter(x => X.includes(x) && Y.includes(x))
    if (p.latex.includes("A' \\cup B")) return union(comp(A), B).length
    if (p.latex.includes("B'")) return inter(A, comp(B)).length
    if (p.latex.includes("A')")) return comp(A).length
    if (p.latex.includes('\\cap')) return inter(A, B).length
    return union(A, B).length
  },
  'events/mutually-exclusive'(p) {
    const { A, B } = parseSets(p.text)
    return A.every(x => !B.includes(x)) ? 'yes' : 'no'
  },
  'prob-rules/category-sum'(p) {
    const [a, b, ab, o] = pcts(p.text)
    if (Math.abs(a + b + ab + o - 1) > 1e-9) throw new Error('categories do not sum to 1')
    if (p.latex.includes('not type O')) return 1 - o
    if (p.latex.includes('A, B, or AB')) return a + b + ab
    if (p.latex.includes('A or O')) return a + o
    return b + ab
  },
  'prob-rules/addition-rule'(p) {
    const v = pcts(p.text)
    if (p.latex.includes('only ')) return v[0] - v[1]
    if (p.latex.includes(' and ')) return v[1] + v[2] - v[0] // given union, pa, pb
    return v[0] + v[1] - v[2] // given pa, pb, both
  },
  'prob-rules/at-least-one'(p) {
    const [each, both] = decimals(p.text)
    return each + each - both
  },
  'conditional/formula'(p) {
    const [pa, both] = pcts(p.text)
    if (both >= pa) throw new Error('P(both) >= P(A)')
    return both / pa
  },
  'conditional/multiply'(p) {
    const [pa, cond] = decimals(p.text)
    return pa * cond
  },
  'independence/all-work'(p) {
    const n = ints(p.text)[0]
    const rel = pcts(p.text)[0]
    return Math.pow(rel, n)
  },
  'independence/indep-check'(p) {
    const [pa, pb, pab] = decimals(p.text)
    return Math.abs(pa * pb - pab) < 1e-9 ? 'yes' : 'no'
  },
  'independence/at-least-one-indep'(p) {
    const n = ints(p.text)[0]
    const prob = decimals(p.text)[0]
    return 1 - Math.pow(1 - prob, n)
  },
  'bayes/two-event'(p) {
    const [prior, hit, fp] = pcts(p.text)
    return (hit * prior) / (hit * prior + fp * (1 - prior))
  },
  'discrete-pdf/missing-value'(p) {
    const { ps } = parseTable(p.latex)
    const shown = ps.filter(v => v !== null)
    if (shown.length !== ps.length - 1) throw new Error('expected exactly one hidden cell')
    return 1 - shown.reduce((a, b) => a + b, 0)
  },
  'discrete-pdf/table-prob'(p) {
    const { ps } = parseTable(p.latex)
    if (Math.abs(ps.reduce((a, b) => a + b, 0) - 1) > 1e-9) throw new Error('pdf does not sum to 1')
    let m
    if ((m = p.ask.match(/P\(X ≤ (\d)\)/))) return ps.slice(0, +m[1] + 1).reduce((a, b) => a + b, 0)
    if ((m = p.ask.match(/P\(X ≥ (\d)\)/))) return ps.slice(+m[1]).reduce((a, b) => a + b, 0)
    if ((m = p.ask.match(/P\((\d) ≤ X ≤ (\d)\)/)))
      return ps.slice(+m[1], +m[2] + 1).reduce((a, b) => a + b, 0)
    throw new Error(`unrecognized ask: ${p.ask}`)
  },
  'discrete-pdf/geometric'(p) {
    // pdf f(y) = (1/2)^y per the notes; sum the series independently
    let m
    if ((m = p.latex.match(/\\ge (\d)/))) {
      let s = 0
      for (let y = +m[1]; y < 200; y++) s += Math.pow(0.5, y)
      return s
    }
    m = p.latex.match(/P\(Y = (\d)\)/)
    return Math.pow(0.5, +m[1])
  },
  'expectation/mean-table'(p) {
    const { xs, ps } = parseTable(p.latex)
    if (Math.abs(ps.reduce((a, b) => a + b, 0) - 1) > 1e-9) throw new Error('pdf does not sum to 1')
    return xs.reduce((s, x, i) => s + x * ps[i], 0)
  },
  'expectation/linearity'(p) {
    const [a, b] = ints(p.text)
    const m = p.latex.match(/E\[(\d+)X - (\d+)Y(?: ([+-]) (\d+))?\]/)
    const e = m[3] ? (m[3] === '+' ? +m[4] : -m[4]) : 0
    return +m[1] * a - +m[2] * b + e
  },
  'expectation/var-rules'(p) {
    const [vX, vY] = ints(p.text)
    const m = p.latex.match(/Var\}\[(\d+)X - (\d+)Y(?: [+-] \d+)?\]/)
    return m[1] * m[1] * vX + m[2] * m[2] * vY
  },
  'expectation/var-table'(p) {
    const { xs, ps } = parseTable(p.latex)
    const mean = xs.reduce((s, x, i) => s + x * ps[i], 0)
    const ex2 = xs.reduce((s, x, i) => s + x * x * ps[i], 0)
    return ex2 - mean * mean
  },
  'expectation/std-dev'(p) {
    return Math.sqrt(ints(p.text)[0])
  },
}

const SAMPLES = { 'counting/codes': 300, 'counting/indistinguishable': 300 }

for (const topic of cls.units.flatMap(u => u.topics)) {
  for (const t of topic.templates) {
    const key = `${topic.id}/${t.id}`
    const checker = derive[key]
    if (!checker) {
      failures.push(`${key}: NO INDEPENDENT CHECKER - not audited`)
      continue
    }
    const n = SAMPLES[key] ?? 2000
    let bad = 0
    for (let i = 0; i < n; i++) {
      const p = t.generate()
      let expected
      try {
        expected = checker(p)
      } catch (e) {
        bad++
        if (bad <= 3) failures.push(`${key}: checker error "${e.message}" :: ${p.text ?? p.latex}`)
        continue
      }
      const ok =
        typeof expected === 'string'
          ? expected === p.answer
          : Number.isInteger(expected) && Number.isInteger(p.answer)
            ? expected === p.answer
            : Math.abs(expected - p.answer) < 1e-9
      if (!ok) {
        bad++
        if (bad <= 3)
          failures.push(
            `${key}: expected ${expected}, generator says ${p.answer} :: ${p.text ?? ''} :: ${p.latex}`,
          )
      }
      // answerLatex (the solution shown on a miss) must equal the answer
      const shown = latexValue(p.answerLatex)
      if (shown !== null && typeof p.answer === 'number') {
        const tol = Math.max(1e-6, Math.abs(p.answer) * 1e-3)
        if (Math.abs(shown - p.answer) > tol) {
          bad++
          if (bad <= 3)
            failures.push(`${key}: answerLatex shows ${shown} but answer is ${p.answer}`)
        }
      }
    }
    results.push({ key, samples: n, mismatches: bad })
  }
}

for (const r of results) {
  console.log(`${r.mismatches === 0 ? 'PASS' : 'FAIL'}  ${r.key}  (${r.samples} samples, ${r.mismatches} mismatches)`)
}
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log('  - ' + f)
  process.exit(1)
}
console.log(`\nAll ${results.length} templates verified against independent re-derivation.`)
