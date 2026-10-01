// Independent checkers for the Test 2 'continuous-expectation' topic. See ../../verify.mjs.
//
// Every moment is a numerical integral of H(x)·f(x) for the displayed f. Whether
// a moment exists is decided by watching the far tail of |x|^k f(x) grow.
import { integrate } from './_lib.mjs'
import { afterCases, area, densityOf, near, supportOf, texFn, validPdf } from './continuous-pdf.mjs'

// The displayed pdf: a cases block, or "f(x) = ..., \quad -\infty < x < \infty".
function shownDensity(latex) {
  if (latex.includes('\\begin{cases}')) return densityOf(latex)
  const m = latex.match(/f\(x\) = (.+?), \\quad (.+?) \\\\/)
  if (!m) throw new Error(`no density in ${latex}`)
  const [lo, hi] = supportOf(m[2].trim())
  const g = texFn(m[1])
  return { lo, hi, g, f: x => (x < lo || x > hi ? 0 : g(x)) }
}

const pdfChecked = latex => validPdf(shownDensity(latex))

// E[H(X)] = ∫ H(x) f(x) dx over the support. An integrand like (1/x)·f(x) can
// be 0/0-ish at x = 0; evaluate just inside instead.
function expect(d, H) {
  const fn = x => H(x) * d.g(x)
  const safe = x => {
    const v = fn(x)
    return Number.isFinite(v) ? v : fn(x + 1e-12)
  }
  return area(safe, d.lo, d.hi)
}

// Is ∫ |x|^k f(x) dx finite? Integrate the tails between 10^6 and 10^12 on a
// log scale: a finite integral has (almost) nothing left there.
function finiteMoment(d, k) {
  const g = x => Math.abs(x) ** k * d.g(x)
  const far = h => integrate(s => h(Math.exp(s)) * Math.exp(s), Math.log(1e6), Math.log(1e12), 4000)
  const right = d.hi === Infinity ? far(g) : 0
  const left = d.lo === -Infinity ? far(x => g(-x)) : 0
  return right + left < 1e-3
}

export const derive = {
  'continuous-expectation/mean'(p) {
    return near(expect(pdfChecked(p.latex), x => x), p)
  },
  'continuous-expectation/second-moment'(p) {
    return near(expect(pdfChecked(p.latex), x => x * x), p)
  },
  'continuous-expectation/variance'(p) {
    const d = pdfChecked(p.latex)
    const v = expect(d, x => x * x) - expect(d, x => x) ** 2
    const asked = afterCases(p.latex)
    if (asked.includes('\\operatorname{Var}')) return near(v, p)
    if (/\\\\ \\sigma = /.test(asked)) return near(Math.sqrt(v), p)
    throw new Error(`unrecognized ask ${asked}`)
  },
  'continuous-expectation/function'(p) {
    const d = pdfChecked(p.latex)
    const m = p.latex.match(/E\\!\\left\[(.+?)\\right\]/)
    if (!m) throw new Error('no E[H(X)] asked')
    const H = texFn(m[1].replaceAll('X', 'x'))
    return near(expect(d, H), p)
  },
  'continuous-expectation/exists'(p) {
    const d = pdfChecked(p.latex)
    const asked = p.latex.slice(p.latex.lastIndexOf('\\\\'))
    const k = asked.includes('E[X^2]') ? 2 : asked.includes('E[X]') ? 1 : null
    if (!k) throw new Error(`unrecognized moment ${asked}`)
    return finiteMoment(d, k) ? 'yes' : 'no'
  },
}

export const SAMPLES = {
  'continuous-expectation/mean': 400,
  'continuous-expectation/second-moment': 400,
  'continuous-expectation/variance': 400,
  'continuous-expectation/function': 400,
  'continuous-expectation/exists': 400,
}
