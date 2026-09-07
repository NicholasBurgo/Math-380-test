import part21 from './hw-2-1.js'
import part22 from './hw-2-2.js'
import part23 from './hw-2-3.js'

// One drill topic for all assigned Chapter 2 textbook exercises. Each part
// file holds the generators for one book section; this merges them so a set
// of 20 reps cycles through the whole assignment.
const parts = [part21, part22, part23]
const seen = new Set()

export default {
  id: 'hw-ch2',
  name: 'Chapter 2 exercises',
  description:
    'Textbook problems 2, 7, 6, 8, 12(c), 17, 42, 19, 30, 23, 32, 33 with fresh numbers.',
  learn: {
    formulas: parts
      .flatMap(p => p.learn.formulas)
      .filter(f => !seen.has(f.label) && seen.add(f.label)),
    how: parts.flatMap(p => p.learn.how),
  },
  templates: parts.flatMap(p => p.templates),
}
