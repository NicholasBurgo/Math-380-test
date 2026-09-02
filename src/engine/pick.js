import { getSkill, heatOf } from './stats.js'

// Mixed sets feed cold topics the most.
const WEIGHT = { cold: 4, warm: 2, hot: 1, mastered: 0.5 }

export function randomTemplate(topic) {
  return topic.templates[Math.floor(Math.random() * topic.templates.length)]
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
