// A study-guide line's topics, the way its drill and the practice test see
// them. A line can narrow a topic to some of its templates with
// `only: { topicId: [templateIds] }`, so "derive the geometric cdf" drills the
// cdf steps and not every geometric derivation. Stats still count toward the
// whole topic (same id).
export function guideTopics(unit, line) {
  const byId = Object.fromEntries(unit.topics.map(t => [t.id, t]))
  return line.topics
    .map(id => byId[id])
    .filter(t => t?.templates?.length)
    .map(t => {
      const keep = line.only?.[t.id]
      if (!keep) return t
      const templates = t.templates.filter(x => keep.includes(x.id))
      return templates.length ? { ...t, templates } : null
    })
    .filter(Boolean)
}
