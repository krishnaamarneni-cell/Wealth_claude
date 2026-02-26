import { isSupabaseStorageEnabled } from './feature-flags'

export interface Transaction {
  id: string
  date: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST'
  shares: number
  price: number
  total: number
  broker?: string
  fileId?: string
  fees?: number
  source?: 'manual' | 'csv' | 'broker'
}

const STANDARD_KEY = 'portfolio-transactions'

// ── In-memory cache ──────────────────────────────────────────
// Survives page navigation (context stays mounted), cleared on mutations
let memoryCache: Transaction[] | null = null
let memoryCacheTime: number = 0
const MEMORY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function invalidateTransactionCache(): void {
  memoryCache = null
  memoryCacheTime = 0
  console.log('[transaction-storage] 🗑️ In-memory cache invalidated')
}

export async function getTransactionsFromStorage(): Promise<Transaction[]> {
  if (typeof window === 'undefined') return []

  // Return in-memory cache if fresh
  if (memoryCache && (Date.now() - memoryCacheTime) < MEMORY_CACHE_TTL) {
    console.log('[transaction-storage] ⚡ Using in-memory cache:', memoryCache.length, 'transactions')
    return memoryCache
  }

  try {
    console.log('[transaction-storage] Fetching from Supabase API...')
    const response = await fetch('/api/transactions')

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('[transaction-storage] Invalid API response format')
      return []
    }

    // Store in memory cache
    memoryCache = data
    memoryCacheTime = Date.now()

    console.log('[transaction-storage] ✅ Loaded from Supabase:', data.length, 'transactions')
    logTransactionTypes(data)
    return data
  } catch (err) {
    console.error('[transaction-storage] Error fetching from Supabase:', err)
    return memoryCache || [] // Fall back to stale cache if available
  }
}

export async function saveTransactionsToStorage(transactions: Transaction[]): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    console.log('[transaction-storage] Saving to Supabase...')
    const lastTransaction = transactions[transactions.length - 1]
    if (!lastTransaction) return false

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastTransaction),
    })

    if (response.ok) {
      console.log('[transaction-storage] ✅ Saved to Supabase')
      invalidateTransactionCache()
      clearAllCaches()
      return true
    } else {
      console.error('[transaction-storage] Supabase save failed:', response.status)
      return false
    }
  } catch (err) {
    console.error('[transaction-storage] Supabase save error:', err)
    return false
  }
}

export async function deleteTransactionFromStorage(transactionId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      console.log('[transaction-storage] ✅ Deleted from Supabase')
      invalidateTransactionCache()
      clearAllCaches()
      return true
    } else {
      console.error('[transaction-storage] Delete failed:', response.status)
      return false
    }
  } catch (err) {
    console.error('[transaction-storage] Delete error:', err)
    return false
  }
}

export function clearTransactionsFromStorage(): void {
  if (typeof window === 'undefined') return
  invalidateTransactionCache()
  clearAllCaches()
}

export function clearAllCaches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('holdingsPageCache')
    localStorage.removeItem('dataInspectorCache')
    localStorage.removeItem('allocationPageCache')
    localStorage.removeItem('performancePageCache')
    localStorage.removeItem('priceCache')
    console.log('[transaction-storage] All caches cleared')
  } catch (error) {
    console.error('[transaction-storage] Failed to clear caches:', error)
  }
}

function logTransactionTypes(transactions: Transaction[]): void {
  const types: Record<string, number> = {}
  transactions.forEach(t => { types[t.type] = (types[t.type] || 0) + 1 })
  console.log('[transaction-storage] Transaction types:', types)
}