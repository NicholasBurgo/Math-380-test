// Shared pieces for the Test 2 checkers: reading numbers back out of the
// displayed problem, and confirming a formula answer against brute force.
import { parseExpr, evalExpr } from '../../../src/engine/expr.js'

export const decimals = s => [...String(s).matchAll(/-?\d*\.\d+|-?\d+/g)].map(Number)
export const ints = s => [...String(s).matchAll(/-?\d+/g)].map(Number)

// Pascal's triangle, independent of any factorial formula.
const pascal = [[1]]
export function choose(n, k) {
  if (k < 0 || k > n) return 0
  for (let i = pascal.length; i <= n; i++) {
    const row = [1]
    for (let j = 1; j < i; j++) row.push(pascal[i - 1][j - 1] + pascal[i - 1][j])
    row.push(1)
    pascal.push(row)
  }
  return pascal[n][k]
}

// Probability of each count of successes in n independent trials, by building
// the distribution one trial at a time (no binomial formula).
export function successCounts(n, p) {
  let dist = [1]
  for (let t = 0; t < n; t++) {
    const next = new Array(dist.length + 1).fill(0)
    dist.forEach((w, k) => {
      next[k] += w * (1 - p)
      next[k + 1] += w * p
    })
    dist = next
  }
  return dist
}

// Simpson's rule on [a, b].
export function integrate(f, a, b, n = 4000) {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

// The standard normal cdf by integrating the density (independent of the app's series).
export function phi(z) {
  const dens = x => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)
  if (z >= 0) return 0.5 + integrate(dens, 0, z, 2000)
  return 0.5 - integrate(dens, z, 0, 2000)
}

const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b))

// A formula answer is right when it matches `reference(env)` (computed by brute
// force) at every point, and every wrong choice must miss somewhere.
export function confirmFormula(p, reference, points, tol = 1e-6) {
  const vars = p.expr.vars
  const ast = parseExpr(p.answer, vars)
  for (const env of points) {
    const want = reference(env)
    const got = evalExpr(ast, env)
    if (!close(want, got, tol)) return `MISMATCH: ${p.answer} = ${got}, brute force ${want} at ${JSON.stringify(env)}`
  }
  for (const c of p.choices ?? []) {
    const wrong = parseExpr(c, vars)
    if (points.every(env => close(reference(env), evalExpr(wrong, env), tol))) {
      throw new Error(`wrong choice "${c}" equals the answer`)
    }
  }
  return p.answer
}
