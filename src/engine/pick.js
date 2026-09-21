import { getSkill, heatOf } from './stats.js'

// Mixed sets feed cold topics the most.
const WEIGHT = { cold: 4, warm: 2, hot: 1, mastered: 0.5 }

export function randomTemplate(topic) {
  return topic.templates[Math.floor(Math.random() * topic.templates.length)]
}

// Identity of a question as the student sees it. Lettered options count only
// through the correct one, so reshuffled or swapped distractors are still the
// same question.
export function problemKey(p) {
  const right = p.options ? p.options['abcdefgh'.indexOf(p.answer)] : null
  const rightKey = right == null ? '' : typeof right === 'string' ? right : right.latex
  return [p.ask, p.text ?? '', p.latex, rightKey].join('##')
}

// Picker for one drill session: returns a problem the session has not shown
// yet. Small word banks do run dry; then the question shown longest ago comes
// back instead of a random repeat.
export function createFreshPicker(tries = 10) {
  const seen = new Map() // question key -> draw number
  let draws = 0
  return function fresh(topic) {
    let oldest = null
    for (let i = 0; i < tries; i++) {
      const p = randomTemplate(topic).generate()
      const key = problemKey(p)
      if (!seen.has(key)) {
        seen.set(key, draws++)
        return p
      }
      if (!oldest || seen.get(key) < seen.get(oldest.key)) oldest = { p, key }
    }
    seen.set(oldest.key, draws++)
    return oldest.p
  }
}

export function pickWeightedTopic(classId, topics) {
  const weights = topics.map(t => WEIGHT[heatOf(getSkill(classId, t.id))])
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < topics.length; i++) {
    r -= weights[i]
    if (r <= 0) return topics[i]
  }
  return topics[topics.length - 1]
}
