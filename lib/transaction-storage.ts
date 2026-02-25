/**
 * Transaction Storage Utility - PHASE 3 MIGRATION
 * NOW: Reads ONLY from Supabase API
 * NO fallback to localStorage to prevent data conflicts during migration
 */

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

/**
 * Get transactions from storage
 * PHASE 3: Only reads from Supabase API - NO localStorage fallback
 * This prevents mixing old (712 items) with new data during migration
 */
export async function getTransactionsFromStorage(): Promise<Transaction[]> {
  if (typeof window === 'undefined') return []

  try {
    console.log('[transaction-storage] Fetching from Supabase API...')
    const response = await fetch('/api/transactions', { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!Array.isArray(data)) {
      console.error('[transaction-storage] Invalid API response format')
      return []
    }

    console.log('[transaction-storage] ✅ Loaded from Supabase:', data.length, 'transactions')
    logTransactionTypes(data)
    return data
  } catch (err) {
    console.error('[transaction-storage] Error fetching from Supabase:', err)
    // Return empty array instead of falling back to localStorage
    return []
  }
}

/**
 * Save transactions to storage
 * PHASE 3: Saves to Supabase API
 * Also updates localStorage cache for offline support
 */
export async function saveTransactionsToStorage(transactions: Transaction[]): Promise<boolean> {
  if (typeof window === 'undefined') return false

  let savedToSupabase = false

  // SAVE TO SUPABASE
  try {
    console.log('[transaction-storage] Saving to Supabase...')
    const lastTransaction = transactions[transactions.length - 1]
    
    if (!lastTransaction) {
      console.error('[transaction-storage] No transaction to save')
      return false
    }

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastTransaction),
    })

    if (response.ok) {
      console.log('[transaction-storage] ✅ Saved to Supabase')
      savedToSupabase = true
      clearAllCaches()
    } else {
      console.error('[transaction-storage] Supabase save failed:', response.status)
    }
  } catch (err) {
    console.error('[transaction-storage] Supabase save error:', err)
    return false
  }

  return savedToSupabase
}

/**
 * Delete transaction from storage
 * PHASE 3: Deletes from Supabase only
 */
export async function deleteTransactionFromStorage(transactionId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    console.log('[transaction-storage] Deleting transaction from Supabase:', transactionId)
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      console.log('[transaction-storage] ✅ Deleted from Supabase')
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

/**
 * Clear transactions - clears Supabase data only
 */
export function clearTransactionsFromStorage(): void {
  if (typeof window === 'undefined') return

  console.log('[transaction-storage] Clearing cache (Supabase data remains)')
  clearAllCaches()
}

/**
 * Clear all page caches when transactions change
 */
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

/**
 * Helper: Log transaction types for debugging
 */
function logTransactionTypes(transactions: Transaction[]): void {
  const types: Record<string, number> = {}
  transactions.forEach((t) => {
    types[t.type] = (types[t.type] || 0) + 1
  })
  console.log('[transaction-storage] Transaction types:', types)
}

