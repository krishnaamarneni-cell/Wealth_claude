export interface TargetAllocation {
  symbol: string
  targetPercent: number
}

export interface RebalanceScenario {
  id: string
  name: string
  targetAllocations: TargetAllocation[]
  rebalanceThreshold: number
}

export async function getRebalanceFromStorage(): Promise<{
  scenarios: RebalanceScenario[]
  lastRebalanceDate: string
}> {
  try {
    const response = await fetch('/api/rebalance')
    if (response.ok) {
      const data = await response.json()
      // Update localStorage cache
      localStorage.setItem('rebalanceScenarios', JSON.stringify(data.scenarios))
      localStorage.setItem('lastRebalanceDate', data.lastRebalanceDate || '')
      return data
    }
  } catch (e) {
    console.warn('[rebalance-storage] Supabase failed, using localStorage')
  }

  // Fallback to localStorage
  try {
    const scenarios = localStorage.getItem('rebalanceScenarios')
    const lastRebalanceDate = localStorage.getItem('lastRebalanceDate')
    return {
      scenarios: scenarios ? JSON.parse(scenarios) : [],
      lastRebalanceDate: lastRebalanceDate || '',
    }
  } catch (e) {
    return { scenarios: [], lastRebalanceDate: '' }
  }
}

export async function saveScenarioToStorage(scenario: RebalanceScenario): Promise<boolean> {
  // Update localStorage immediately
  try {
    const existing = localStorage.getItem('rebalanceScenarios')
    const scenarios: RebalanceScenario[] = existing ? JSON.parse(existing) : []
    const index = scenarios.findIndex(s => s.id === scenario.id)
    if (index >= 0) scenarios[index] = scenario
    else scenarios.push(scenario)
    localStorage.setItem('rebalanceScenarios', JSON.stringify(scenarios))
  } catch (e) { }

  // Save to Supabase
  try {
    const response = await fetch('/api/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    return response.ok
  } catch (e) {
    console.error('[rebalance-storage] Save failed:', e)
    return false
  }
}

export async function saveLastRebalanceDateToStorage(date: string): Promise<boolean> {
  localStorage.setItem('lastRebalanceDate', date)

  try {
    const response = await fetch('/api/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastRebalanceDate: date }),
    })
    return response.ok
  } catch (e) {
    console.error('[rebalance-storage] Save date failed:', e)
    return false
  }
}

export async function deleteScenarioFromStorage(scenarioId: string): Promise<boolean> {
  // Remove from localStorage
  try {
    const existing = localStorage.getItem('rebalanceScenarios')
    if (existing) {
      const scenarios: RebalanceScenario[] = JSON.parse(existing)
      localStorage.setItem('rebalanceScenarios', JSON.stringify(
        scenarios.filter(s => s.id !== scenarioId)
      ))
    }
  } catch (e) { }

  // Delete from Supabase
  try {
    const response = await fetch('/api/rebalance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    })
    return response.ok
  } catch (e) {
    console.error('[rebalance-storage] Delete failed:', e)
    return false
  }
}