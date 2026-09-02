const KEY = 'mathreps.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // storage full or blocked - stats just don't persist
  }
}

function clsOf(db, classId) {
  db[classId] ??= { skills: {}, pages: [] }
  return db[classId]
}

export function getSkill(classId, topicId) {
  return load()[classId]?.skills?.[topicId] ?? null
}

export function recordAnswer(classId, topicId, correct) {
  const db = load()
  const c = clsOf(db, classId)
  const s = (c.skills[topicId] ??= {
    attempts: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    last: null,
  })
  s.attempts += 1
  if (correct) {
    s.correct += 1
    s.streak += 1
    s.bestStreak = Math.max(s.bestStreak, s.streak)
  } else {
    s.streak = 0
  }
  s.last = new Date().toISOString()
  save(db)
}

export function recordPage(classId, page) {
  const db = load()
  const c = clsOf(db, classId)
  c.pages.unshift(page)
  c.pages = c.pages.slice(0, 50)
  save(db)
}

export function getPages(classId) {
  return load()[classId]?.pages ?? []
}

// Temperature of a skill, driven by the current streak on it.
export function heatOf(skill) {
  if (!skill || skill.attempts < 3) return 'cold'
  if (skill.streak >= 10) return 'mastered'
  if (skill.streak >= 5) return 'hot'
  if (skill.streak >= 2) return 'warm'
  return 'cold'
}

// Mastered but untouched for 3+ days - time for a warm-up.
export function reviewDue(skill) {
  if (!skill || heatOf(skill) !== 'mastered' || !skill.last) return false
  return Date.now() - Date.parse(skill.last) > 3 * 24 * 60 * 60 * 1000
}
