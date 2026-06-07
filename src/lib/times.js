export function extrairTimes(fixtures) {
  const timesMap = {}
  fixtures.forEach((f) => {
    const h = f.teams.home
    const a = f.teams.away
    timesMap[h.id] = h.name
    timesMap[a.id] = a.name
  })
  return Object.values(timesMap).sort((a, b) => a.localeCompare(b))
}
