// Drill queue with miss recycling: a missed problem re-enters the queue 2 reps
// later and retires only after 2 clean hits in a row.
export function createSession(pickProblem) {
  let rep = 0
  let retryQ = []
  let current = null

  function next() {
    const i = retryQ.findIndex(r => r.due <= rep)
    if (i > -1) {
      current = retryQ.splice(i, 1)[0]
      current.retry = true
    } else {
      current = { problem: pickProblem(), cleanHits: 0, retry: false }
    }
    return current
  }

  function answer(correct) {
    rep += 1
    if (correct) {
      current.cleanHits += 1
      if (current.retry && current.cleanHits < 2) {
        retryQ.push({ problem: current.problem, cleanHits: current.cleanHits, due: rep + 3 })
      }
    } else {
      retryQ.push({ problem: current.problem, cleanHits: 0, due: rep + 2 })
    }
    return rep
  }

  return {
    next,
    answer,
    get rep() {
      return rep
    },
    get pending() {
      return retryQ.length
    },
  }
}
