export function getMsUntilNextMarketClose(): number {
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = nowET.getDay() // 0=Sun, 6=Sat
  const secs = nowET.getHours() * 3600 + nowET.getMinutes() * 60 + nowET.getSeconds()
  const closeSecs = 16 * 3600 // 4:00 PM ET

  // Weekday before 4 PM → cache until today's close
  if (day >= 1 && day <= 5 && secs < closeSecs) {
    return (closeSecs - secs) * 1000
  }

  // Days until next weekday at 4 PM
  let daysToAdd: number
  if (day === 0) daysToAdd = 1 // Sun  → Mon
  else if (day === 6) daysToAdd = 2 // Sat  → Mon
  else if (day === 5) daysToAdd = 3 // Fri after close → Mon
  else daysToAdd = 1 // Mon–Thu after close → tomorrow

  const secsUntilClose = daysToAdd * 86400 + (closeSecs - secs)
  return Math.max(secsUntilClose * 1000, 60_000)
}

export function getFearGreedLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

// Convert VIX to 0–100 fear/greed score (inverse relationship)
export function vixToScore(vix: number): number {
  return Math.max(0, Math.min(100, Math.round(115 - vix * 3.2)))
}
