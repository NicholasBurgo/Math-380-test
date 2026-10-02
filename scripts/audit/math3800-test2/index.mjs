// Test 2 checkers, one module per topic. See ../math3800.mjs and ../../verify.mjs.

import * as geometric from './geometric.mjs'
import * as geometricDerive from './geometric-derive.mjs'
import * as mgf from './mgf.mjs'
import * as binomial from './binomial.mjs'
import * as binomialTable from './binomial-table.mjs'
import * as negativeBinomial from './negative-binomial.mjs'
import * as hypergeometric from './hypergeometric.mjs'
import * as poisson from './poisson.mjs'
import * as discreteDerive from './discrete-derive.mjs'
import * as whichDiscrete from './which-discrete.mjs'
import * as continuousPdf from './continuous-pdf.mjs'
import * as continuousCdf from './continuous-cdf.mjs'
import * as uniform from './uniform.mjs'
import * as continuousExpectation from './continuous-expectation.mjs'
import * as continuousMgf from './continuous-mgf.mjs'
import * as gamma from './gamma.mjs'
import * as exponential from './exponential.mjs'
import * as integration from './integration.mjs'
import * as chiSquared from './chi-squared.mjs'
import * as normalTable from './normal-table.mjs'
import * as normalApps from './normal-apps.mjs'

const MODULES = [geometric, geometricDerive, mgf, binomial, binomialTable, negativeBinomial, hypergeometric, poisson, discreteDerive, whichDiscrete, continuousPdf, continuousCdf, uniform, continuousExpectation, continuousMgf, gamma, exponential, integration, chiSquared, normalTable, normalApps]

export const derive = Object.assign({}, ...MODULES.map(m => m.derive))
export const SAMPLES = Object.assign({}, ...MODULES.map(m => m.SAMPLES ?? {}))
