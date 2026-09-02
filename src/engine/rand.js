export function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
