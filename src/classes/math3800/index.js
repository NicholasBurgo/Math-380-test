import counting from './counting.js'
import events from './events.js'
import probRules from './prob-rules.js'
import hw21 from './hw-2-1.js'
import hw22 from './hw-2-2.js'
import conditional from './conditional.js'
import independence from './independence.js'
import bayes from './bayes.js'
import discretePdf from './discrete-pdf.js'
import expectation from './expectation.js'

export default {
  id: 'math3800',
  name: 'Math 3800',
  term: 'Probability & Statistics',
  units: [
    {
      id: 'test1',
      name: 'Test 1',
      detail: 'Chapters 1–3 (part 1)',
      topics: [
        counting,
        events,
        probRules,
        hw21,
        conditional,
        hw22,
        independence,
        bayes,
        discretePdf,
        expectation,
      ],
    },
  ],
}
