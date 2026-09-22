import describe from './describe.js'
import subsets from './subsets.js'
import setOps from './set-ops.js'
import indexed from './indexed.js'
import partitions from './partitions.js'
import cartesian from './cartesian.js'
import statements from './statements.js'
import negation from './negation.js'
import connectives from './connectives.js'
import implications from './implications.js'
import biconditionals from './biconditionals.js'
import tautologies from './tautologies.js'
import equivalence from './equivalence.js'
import quantifiers from './quantifiers.js'
import review from './review.js'

export default {
  id: 'math223',
  name: 'Math 223',
  term: 'Sets, Logic & Proofs',
  units: [
    {
      id: 'test1',
      name: 'Test 1',
      detail: 'Chapter 1 (sets) and Chapter 2 (logic)',
      topics: [
        describe,
        subsets,
        setOps,
        indexed,
        partitions,
        cartesian,
        statements,
        negation,
        connectives,
        implications,
        biconditionals,
        tautologies,
        equivalence,
        quantifiers,
        review,
      ],
    },
  ],
}
