// Test 2 checkers, one module per topic. See ../math3800.mjs and ../../verify.mjs.

import * as geometric from './geometric.mjs'
import * as geometricDerive from './geometric-derive.mjs'
import * as binomial from './binomial.mjs'
import * as mgf from './mgf.mjs'
import * as hypergeometric from './hypergeometric.mjs'
import * as poisson from './poisson.mjs'
import * as discreteDerive from './discrete-derive.mjs'
import * as continuousPdf from './continuous-pdf.mjs'
import * as exponential from './exponential.mjs'
import * as gamma from './gamma.mjs'

const MODULES = [geometric, geometricDerive, binomial, mgf, hypergeometric, poisson, discreteDerive, continuousPdf, exponential, gamma]

export const derive = Object.assign({}, ...MODULES.map(m => m.derive))
export const SAMPLES = Object.assign({}, ...MODULES.map(m => m.SAMPLES ?? {}))
