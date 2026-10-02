// Test 2: Chapter 3 sections 4-8 and Chapter 4 sections 1-4, built from the
// class notes (Chapter 3 part 2, Chapter 4), the Test 2 study guide, and the
// review list from the last class before the test (Thursday, Oct 1). The guide
// below is that review list, in its order.
import { printedTables } from '../dist.js'
import geometric from './geometric.js'
import geometricDerive from './geometric-derive.js'
import mgf from './mgf.js'
import binomial from './binomial.js'
import binomialTable from './binomial-table.js'
import negativeBinomial from './negative-binomial.js'
import hypergeometric from './hypergeometric.js'
import poisson from './poisson.js'
import discreteDerive from './discrete-derive.js'
import whichDiscrete from './which-discrete.js'
import continuousPdf from './continuous-pdf.js'
import continuousCdf from './continuous-cdf.js'
import uniform from './uniform.js'
import continuousExpectation from './continuous-expectation.js'
import continuousMgf from './continuous-mgf.js'
import integration from './integration.js'
import gamma from './gamma.js'
import exponential from './exponential.js'
import chiSquared from './chi-squared.js'
import normalTable from './normal-table.js'
import normalApps from './normal-apps.js'

const GEO_CDF = ['cdf-series', 'cdf-result', 'cdf-numbers']

export default {
  id: 'test2',
  name: 'Test 2',
  detail: '§3.4–3.8 and §4.1–4.4',
  topics: [
    // the skills every distribution uses
    continuousCdf,
    continuousPdf,
    geometricDerive,
    discreteDerive,
    continuousMgf,
    mgf,
    continuousExpectation,
    integration,
    // the distributions, in the review list's order
    geometric,
    binomial,
    binomialTable,
    negativeBinomial,
    hypergeometric,
    poisson,
    whichDiscrete,
    uniform,
    gamma,
    exponential,
    chiSquared,
    normalTable,
    normalApps,
  ],

  // The review list from class, each line pointing at the topics (and, with
  // `only`, the templates) that drill it.
  guide: [
    {
      text: 'Go between pdf and cdf. Discrete: F(x) = Σ f(t) over t ≤ x (the geometric cdf is the one to derive). Continuous: F(x) = ∫ f(t) dt from −∞ to x, and back with f(x) = F′(x).',
      short: 'pdf ↔ cdf',
      topics: ['continuous-cdf', 'geometric-derive'],
      only: { 'geometric-derive': GEO_CDF },
    },
    {
      text: 'Verify that a function is a pdf, or find the coefficient that makes it one.',
      short: 'Verify a pdf, or find the constant',
      topics: ['continuous-pdf', 'gamma', 'geometric-derive', 'discrete-derive'],
      only: {
        'continuous-pdf': ['is-pdf', 'find-c', 'find-c-prob'],
        gamma: ['constant'],
        'geometric-derive': ['show-pdf'],
        'discrete-derive': ['binom-sum', 'poisson-sum'],
      },
    },
    {
      text: 'Derive the binomial, negative binomial and hypergeometric pdfs. They may be on the formula sheet, but be able to derive them all.',
      short: 'Derive the discrete pdfs',
      topics: ['discrete-derive'],
      only: {
        'discrete-derive': ['binom-order', 'binom-count', 'binom-result', 'negbin-split', 'negbin-result', 'hyper-count', 'hyper-result', 'why', 'numbers'],
      },
    },
    {
      text: 'Negative binomial: X is the number of trials needed for r successes, and the last trial is a success, so f(x) = P(r − 1 successes in x − 1 trials) · p = C(x − 1, r − 1)pʳqˣ⁻ʳ.',
      short: 'Derive the negative binomial pdf',
      topics: ['discrete-derive'],
      only: { 'discrete-derive': ['negbin-split', 'negbin-result'] },
    },
    {
      text: 'Geometric: derive the cdf.',
      short: 'Geometric cdf',
      topics: ['geometric-derive', 'geometric'],
      only: { 'geometric-derive': GEO_CDF, geometric: ['cdf'] },
    },
    {
      text: 'Geometric: find the MGF.',
      short: 'Geometric MGF',
      topics: ['geometric-derive'],
      only: { 'geometric-derive': ['mgf-sum', 'mgf-factor', 'mgf-series', 'mgf-result', 'mgf-domain', 'mgf-numbers'] },
    },
    {
      text: 'Geometric: derive the pdf.',
      short: 'Geometric pdf',
      topics: ['geometric-derive'],
      only: { 'geometric-derive': ['pdf-box', 'show-pdf', 'why'] },
    },
    {
      text: 'MGFs: find m_X(t) = E(e^(tX)) from a pdf, Σ e^(tx) f(x) or ∫ e^(tx) f(x) dx (like the 9/10 example; it will not be awful or binomial).',
      short: 'Find an MGF from a pdf',
      topics: ['continuous-mgf'],
    },
    {
      text: 'Find the mean and variance from a given MGF: E(Xⁿ) = dⁿ/dtⁿ m_X(t) at t = 0.',
      short: 'Mean and variance from an MGF',
      topics: ['mgf'],
    },
    {
      text: 'Find the mean and variance from a pdf: E(X) = Σ x f(x) or ∫ x f(x) dx, then Var X = E(X²) − μ².',
      short: 'Mean and variance from a pdf',
      topics: ['continuous-expectation', 'uniform'],
      only: { uniform: ['mean'] },
    },
    {
      text: 'Integration by parts, once: ∫ x eˣ dx (not ∫ x²eˣ dx). ∫₀^∞ x⁴e^(−x) dx is not by parts: it is gamma, Γ(5) = 4!.',
      short: 'Integration by parts, gamma integrals',
      topics: ['integration', 'gamma'],
      only: { gamma: ['factorial', 'integral'] },
    },
    {
      text: 'Calculate discrete probabilities: P(1) + P(2) + P(3) or similar, from the pdf.',
      short: 'Discrete probabilities',
      topics: ['geometric', 'binomial', 'negative-binomial', 'hypergeometric', 'poisson'],
      only: {
        geometric: ['pmf', 'cdf'],
        binomial: ['exactly', 'cumulative'],
        'negative-binomial': ['exactly', 'cumulative'],
        hypergeometric: ['exactly', 'tail'],
        poisson: ['pmf', 'tail'],
      },
    },
    {
      text: 'Calculate continuous probabilities: ∫ from a to b of f(x) dx.',
      short: 'Continuous probabilities',
      topics: ['continuous-pdf', 'uniform', 'exponential'],
      only: { 'continuous-pdf': ['prob', 'find-c-prob'], uniform: ['prob'], exponential: ['at-most', 'more-than', 'between', 'units'] },
    },
    { text: 'Use the binomial table (the n = 19 and n = 20 tables are given).', short: 'Binomial table', topics: ['binomial-table'] },
    { text: 'Use the chi-squared table: χ² value ↔ probability.', short: 'Chi-squared table', topics: ['chi-squared'] },
    { text: 'Use the normal table.', short: 'Normal table', topics: ['normal-table'] },
    {
      text: 'Given a scenario, identify it as binomial, negative binomial, hypergeometric or Poisson.',
      short: 'Which distribution?',
      topics: ['which-discrete'],
      only: { 'which-discrete': ['label', 'spot'] },
    },
    {
      text: 'Identify the parameters (p, r, n, N, k) and the possible values of X, as in HW 6.',
      short: 'Parameters and possible values',
      topics: ['which-discrete', 'hypergeometric', 'negative-binomial', 'poisson'],
      only: { 'which-discrete': ['params', 'values'], hypergeometric: ['values'], 'negative-binomial': ['possible'], poisson: ['find-k'] },
    },
    {
      text: 'Uniform: f(x) = 1/(B − A) for A ≤ x ≤ B, 0 otherwise. Find the pdf given A and B (the rectangle has area 1).',
      short: 'Uniform pdf',
      topics: ['uniform'],
      only: { uniform: ['derive', 'height'] },
    },
    {
      text: 'Time of the first event in a Poisson process with rate λ: f(x) = λe^(−λx).',
      short: 'First event (exponential)',
      topics: ['exponential'],
    },
    {
      text: 'Normal word problems: x ↔ z = (x − μ)/σ ↔ normal table ↔ left area ↔ probability. A percentile is a left area: an IQ of 139 is the 99.53rd percentile, and the middle 95% is μ ± 1.96σ.',
      short: 'Normal word problems',
      topics: ['normal-apps'],
    },
  ],

  // What the test hands out: the formula sheet and these tables.
  tables: ['binomial19', 'binomial', 'normal', 'chi2'],
  printedTables,
  sheet: {
    given: [
      { label: 'Geometric series', latex: '\\sum_{k=1}^{\\infty} ar^{k-1} = \\frac{a}{1-r}' },
      { label: 'Finite geometric series', latex: '\\sum_{k=1}^{n} ar^{k-1} = \\frac{a(1-r^n)}{1-r}' },
      { label: 'Poisson', latex: 'f(x) = \\frac{e^{-k}k^x}{x!}' },
      { label: 'Normal', latex: 'f(x) = \\frac{1}{\\sqrt{2\\pi}\\,\\sigma}e^{-(x-\\mu)^2/2\\sigma^2}' },
      { label: 'Gamma function', latex: '\\Gamma(\\alpha) = \\int_0^{\\infty} z^{\\alpha-1}e^{-z}\\,dz' },
      { label: 'Gamma function, integers', latex: '\\Gamma(n+1) = n!' },
      { label: 'Gamma', latex: 'f(x) = \\frac{1}{\\Gamma(\\alpha)\\beta^{\\alpha}}x^{\\alpha-1}e^{-x/\\beta}' },
      { label: 'Exponential', latex: 'f(x) = \\frac{1}{\\beta}e^{-x/\\beta}' },
    ],
    // the review list: maybe on the sheet, but be able to derive them all
    maybe: [
      { label: 'Geometric', latex: 'f(x) = (1-p)^{x-1}p' },
      { label: 'Binomial', latex: 'f(x) = \\binom{n}{x}p^x(1-p)^{n-x}' },
      { label: 'Negative binomial', latex: 'f(x) = \\binom{x-1}{r-1}(1-p)^{x-r}p^r' },
      { label: 'Hypergeometric', latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}' },
    ],
    // not on the sheet: what the notes expect you to know or derive
    know: [
      { label: 'A pdf', latex: 'f(x) \\ge 0, \\quad \\sum f(x) = 1 \\;\\text{ or }\\; \\int_{-\\infty}^{\\infty} f(x)\\,dx = 1' },
      { label: 'cdf and pdf', latex: 'F(x) = \\sum_{t \\le x} f(t) \\;\\text{ or }\\; \\int_{-\\infty}^{x} f(t)\\,dt, \\qquad f(x) = F\'(x)' },
      { label: 'Uniform on [A, B]', latex: 'f(x) = \\frac{1}{B-A}' },
      { label: 'Mean and variance', latex: 'E(X) = \\sum x f(x) \\;\\text{ or }\\; \\int x f(x)\\,dx, \\qquad \\operatorname{Var}X = E(X^2) - (E(X))^2' },
      { label: 'MGF', latex: 'm_X(t) = E(e^{tX}), \\qquad E(X^n) = \\frac{d^n}{dt^n}m_X(t)\\Big|_{t=0}' },
      { label: 'Integration by parts', latex: '\\int u\\,dv = uv - \\int v\\,du, \\qquad \\int xe^{ax}\\,dx = \\frac{x}{a}e^{ax} - \\frac{e^{ax}}{a^2} + C' },
      { label: 'Geometric', latex: 'F(x) = 1 - q^x,\\; E[X] = \\frac{1}{p},\\; \\operatorname{Var}X = \\frac{q}{p^2},\\; m_X(t) = \\frac{pe^t}{1-qe^t}' },
      { label: 'Negative binomial', latex: 'f(x) = P(r-1 \\text{ successes in } x-1 \\text{ trials}) \\cdot p = \\binom{x-1}{r-1}p^rq^{x-r}' },
      { label: 'Binomial', latex: 'E[X] = np,\\; \\operatorname{Var}X = npq' },
      { label: 'Binomial theorem', latex: '(a+b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^k b^{n-k}' },
      { label: 'Poisson', latex: 'k = \\lambda s, \\qquad E[X] = \\operatorname{Var}X = k' },
      { label: 'Maclaurin series', latex: 'e^z = \\sum_{k=0}^{\\infty} \\frac{z^k}{k!}' },
      { label: 'Gamma', latex: '\\mu = \\alpha\\beta,\\; \\sigma^2 = \\alpha\\beta^2,\\; m_X(t) = (1 - \\beta t)^{-\\alpha}' },
      { label: 'First event, rate λ (exponential)', latex: 'f(x) = \\lambda e^{-\\lambda x},\\; \\beta = \\tfrac{1}{\\lambda},\\; \\mu = \\beta,\\; \\sigma^2 = \\beta^2' },
      { label: 'Chi-squared', latex: '\\alpha = \\tfrac{\\gamma}{2},\\; \\beta = 2:\\; \\mu = \\gamma,\\; \\sigma^2 = 2\\gamma' },
      { label: 'Normal', latex: 'Z = \\frac{X - \\mu}{\\sigma}, \\qquad \\text{percentile} = \\text{left area}, \\qquad m_X(t) = e^{\\mu t + \\sigma^2 t^2/2}' },
    ],
  },
}
