/**
 * Transaction Storage Utility
 * Provides consistent access to transactions across all pages
 * PHASE 3: Parallel Read Strategy - Try Supabase first, fallback to localStorage
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
 * Get transactions from storage - PARALLEL READ STRATEGY
 * 1. Try Supabase API first (if feature flag enabled)
 * 2. Fallback to localStorage if Supabase fails or returns empty
 * 3. Try legacy localStorage locations as last resort
 */
export async function getTransactionsFromStorage(): Promise<Transaction[]> {
  if (typeof window === 'undefined') return []

  // STEP 1: Try Supabase if feature flag enabled
  if (isSupabaseStorageEnabled()) {
    try {
      console.log('[transaction-storage] Trying Supabase API...')
      const response = await fetch('/api/transactions', { cache: 'no-store' })

      if (response.ok) {
        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('[transaction-storage] ✅ Loaded from Supabase:', data.length, 'transactions')
          logTransactionTypes(data)
          return data
        }
      }
    } catch (err) {
      console.warn('[transaction-storage] Supabase API failed, falling back to localStorage:', err)
    }
  }

  // STEP 2: Fallback to localStorage (standard key)
  let stored = localStorage.getItem(STANDARD_KEY)

  // STEP 3: Try legacy 'transactions' key
  if (!stored) {
    stored = localStorage.getItem('transactions')
  }

  // STEP 4: Try v0.dev chat storage format
  if (!stored) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat:ls:')) {
        const chatData = localStorage.getItem(key)
        if (chatData) {
          try {
            const parsed = JSON.parse(chatData)
            const transactionsEntry = parsed.find((item: any) =>
              Array.isArray(item) && item[0] === 'transactions'
            )
            if (transactionsEntry && transactionsEntry[1]) {
              stored = transactionsEntry[1]
              console.log('[transaction-storage] Found transactions in v0 chat storage')
              break
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
    }
  }

  if (!stored) {
    console.log('[transaction-storage] No transactions found anywhere')
    return []
  }

  try {
    const transactions = JSON.parse(stored)
    console.log('[transaction-storage] ✅ Loaded from localStorage:', transactions.length, 'transactions')
    logTransactionTypes(transactions)
    return transactions
  } catch (e) {
    console.error('[transaction-storage] Error parsing transactions:', e)
    return []
  }
}

/**
 * Save transactions to storage - SAVE TO BOTH
 * 1. Save to Supabase if feature flag enabled
 * 2. Always save to localStorage as backup
 */
export async function saveTransactionsToStorage(transactions: Transaction[]): Promise<boolean> {
  if (typeof window === 'undefined') return false

  let savedToSupabase = false
  let savedToLocalStorage = false

  // STEP 1: Try to save to Supabase if enabled
  if (isSupabaseStorageEnabled()) {
    try {
      console.log('[transaction-storage] Saving to Supabase...')
      const lastTransaction = transactions[transactions.length - 1]
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastTransaction),
      })

      if (response.ok) {
        console.log('[transaction-storage] ✅ Saved to Supabase')
        savedToSupabase = true
      } else {
        console.warn('[transaction-storage] Supabase save failed:', response.status)
      }
    } catch (err) {
      console.warn('[transaction-storage] Supabase save error (non-critical, using localStorage):', err)
    }
  }

  // STEP 2: Always save to localStorage as backup
  try {
    const data = JSON.stringify(transactions)
    localStorage.setItem(STANDARD_KEY, data)
    localStorage.setItem('transactions', data)
    console.log('[transaction-storage] ✅ Saved to localStorage:', transactions.length, 'items')
    savedToLocalStorage = true
    clearAllCaches()
  } catch (err) {
    console.error('[transaction-storage] localStorage save error:', err)
    return false
  }

  return savedToLocalStorage || savedToSupabase
}

/**
 * Clear transactions from storage
 */
export function clearTransactionsFromStorage(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(STANDARD_KEY)
  localStorage.removeItem('transactions')
  clearAllCaches()

  console.log('[transaction-storage] Cleared transactions from storage')
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

