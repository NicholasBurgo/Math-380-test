// Test 2: Chapter 3 sections 4-8 and Chapter 4 sections 1-4, built from the
// class notes (Chapter 3 part 2, Chapter 4) and the Test 2 study guide.
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
import gamma from './gamma.js'
import exponential from './exponential.js'
import chiSquared from './chi-squared.js'
import normalTable from './normal-table.js'
import normalApps from './normal-apps.js'

export default {
  id: 'test2',
  name: 'Test 2',
  detail: '§3.4–3.8 and §4.1–4.4',
  topics: [
    geometric,
    geometricDerive,
    mgf,
    binomial,
    binomialTable,
    negativeBinomial,
    hypergeometric,
    poisson,
    discreteDerive,
    whichDiscrete,
    continuousPdf,
    continuousCdf,
    uniform,
    continuousExpectation,
    continuousMgf,
    gamma,
    exponential,
    chiSquared,
    normalTable,
    normalApps,
  ],

  // The study guide's "Be able to" list, each line pointing at the topics that drill it.
  guide: [
    {
      text: 'Derive the pdf for a geometric, binomial, negative binomial, or hypergeometric distribution.',
      short: 'Derive the discrete pdfs',
      topics: ['geometric-derive', 'discrete-derive'],
    },
    {
      text: 'Show that a given function is a pdf (discrete or continuous).',
      short: 'Show it is a pdf',
      topics: ['geometric-derive', 'discrete-derive', 'continuous-pdf'],
    },
    { text: 'Derive the cdf for a geometric experiment.', short: 'Geometric cdf', topics: ['geometric-derive', 'geometric'] },
    { text: 'Derive the moment-generating function for a geometric distribution.', short: 'Geometric MGF', topics: ['geometric-derive'] },
    {
      text: 'Find the mean or variance of a distribution given the moment generating function (discrete or continuous).',
      short: 'Mean and variance from an MGF',
      topics: ['mgf'],
    },
    {
      text: 'Find probabilities using the pdf for a binomial, negative binomial, hypergeometric, or Poisson distribution.',
      short: 'Discrete probabilities',
      topics: ['binomial', 'negative-binomial', 'hypergeometric', 'poisson'],
    },
    { text: 'Use the binomial table to find probabilities.', short: 'Binomial table', topics: ['binomial-table'] },
    {
      text: 'Label scenarios as binomial, negative binomial, hypergeometric, or Poisson processes.',
      short: 'Which distribution?',
      topics: ['which-discrete'],
    },
    {
      text: 'Find the coefficient that makes a given function a continuous pdf.',
      short: 'Find the constant',
      topics: ['continuous-pdf', 'gamma'],
    },
    { text: 'Find probabilities given a continuous pdf.', short: 'Continuous probabilities', topics: ['continuous-pdf', 'uniform'] },
    { text: 'Derive the cdf for a continuous distribution.', short: 'Continuous cdf', topics: ['continuous-cdf'] },
    { text: 'Find the pdf for a continuous distribution given the cdf.', short: 'pdf from cdf', topics: ['continuous-cdf'] },
    { text: 'Derive the pdf for a uniform distribution.', short: 'Uniform pdf', topics: ['uniform'] },
    {
      text: 'Find the mean or variance for a continuous random variable.',
      short: 'Continuous mean and variance',
      topics: ['continuous-expectation'],
    },
    {
      text: 'Derive the moment-generating function for a continuous distribution.',
      short: 'Continuous MGFs',
      topics: ['continuous-mgf'],
    },
    {
      text: 'Solve problems involving the time of occurrence of the first event in a Poisson process.',
      short: 'First event (exponential)',
      topics: ['exponential'],
    },
    {
      text: 'Use the chi-squared table to find probabilities given chi-squared values, or chi-squared values given probabilities.',
      short: 'Chi-squared table',
      topics: ['chi-squared'],
    },
    {
      text: 'Use the normal table to find probabilities given z-scores, or z-scores given probabilities.',
      short: 'Normal table',
      topics: ['normal-table'],
    },
    { text: 'Find z-scores from x-values using the formula.', short: 'z-scores', topics: ['normal-apps'] },
    {
      text: 'Solve word problems using the standard normal distribution: x ↔ z ↔ left area ↔ probability.',
      short: 'Normal word problems',
      topics: ['normal-apps'],
    },
  ],

  // What the test hands out: the formula sheet and these tables.
  tables: ['binomial', 'normal', 'chi2'],
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
    maybe: [
      { label: 'Geometric', latex: 'f(x) = (1-p)^{x-1}p' },
      { label: 'Binomial', latex: 'f(x) = \\binom{n}{x}p^x(1-p)^{n-x}' },
      { label: 'Negative binomial', latex: 'f(x) = \\binom{x-1}{r-1}(1-p)^{x-r}p^r' },
      { label: 'Hypergeometric', latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}' },
    ],
    // not on the sheet: what the notes expect you to know or derive
    know: [
      { label: 'A pdf', latex: 'f(x) \\ge 0, \\quad \\sum f(x) = 1 \\;\\text{ or }\\; \\int_{-\\infty}^{\\infty} f(x)\\,dx = 1' },
      { label: 'cdf and pdf', latex: 'F(x) = \\int_{-\\infty}^{x} f(t)\\,dt, \\qquad f(x) = F\'(x)' },
      { label: 'Uniform on [a, b]', latex: 'f(x) = \\frac{1}{b-a}' },
      { label: 'Expectation', latex: 'E[H(X)] = \\int H(x)f(x)\\,dx, \\qquad \\operatorname{Var}X = E[X^2] - (E[X])^2' },
      { label: 'MGF', latex: 'm_X(t) = E[e^{tX}], \\qquad E[X^k] = m_X^{(k)}(0)' },
      { label: 'Geometric', latex: 'F(x) = 1 - q^x,\\; E[X] = \\frac{1}{p},\\; \\operatorname{Var}X = \\frac{q}{p^2},\\; m_X(t) = \\frac{pe^t}{1-qe^t}' },
      { label: 'Binomial', latex: 'E[X] = np,\\; \\operatorname{Var}X = npq,\\; m_X(t) = (q + pe^t)^n' },
      { label: 'Binomial theorem', latex: '(a+b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^k b^{n-k}' },
      { label: 'Poisson', latex: 'k = \\lambda s, \\qquad E[X] = \\operatorname{Var}X = k' },
      { label: 'Maclaurin series', latex: 'e^z = \\sum_{k=0}^{\\infty} \\frac{z^k}{k!}' },
      { label: 'Gamma', latex: '\\mu = \\alpha\\beta,\\; \\sigma^2 = \\alpha\\beta^2,\\; m_X(t) = (1 - \\beta t)^{-\\alpha}' },
      { label: 'Exponential', latex: '\\alpha = 1:\\; \\mu = \\beta,\\; \\sigma^2 = \\beta^2;\\; \\text{first event at rate } \\lambda \\Rightarrow \\beta = \\tfrac{1}{\\lambda}' },
      { label: 'Chi-squared', latex: '\\alpha = \\tfrac{\\gamma}{2},\\; \\beta = 2:\\; \\mu = \\gamma,\\; \\sigma^2 = 2\\gamma' },
      { label: 'Normal', latex: 'Z = \\frac{X - \\mu}{\\sigma}, \\qquad m_X(t) = e^{\\mu t + \\sigma^2 t^2/2}' },
    ],
  },
}
