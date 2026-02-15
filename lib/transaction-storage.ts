/**
 * Transaction Storage Utility
 * Provides consistent access to transactions across all pages
 * Handles multiple storage locations for v0.dev compatibility
 */

export interface Transaction {
  id: string
  date: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST'  // ✅ FIXED
  shares: number
  price: number
  total: number
  broker?: string
  fileId?: string
  fees?: number  // ✅ ADDED
}

const STANDARD_KEY = 'portfolio-transactions'

/**
 * Get transactions from storage
 * Tries multiple locations for compatibility:
 * 1. Standard localStorage key (primary)
 * 2. Legacy 'transactions' key (fallback)
 * 3. v0.dev chat storage format (fallback)
 */
export function getTransactionsFromStorage(): Transaction[] {
  if (typeof window === 'undefined') return []

  // Try standard key first
  let stored = localStorage.getItem(STANDARD_KEY)

  // Fallback to legacy 'transactions' key
  if (!stored) {
    stored = localStorage.getItem('transactions')
  }

  // Fallback to v0.dev chat storage format
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
              console.log('[v0] Found transactions in v0 chat storage')
              break
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
    }
  }

  if (!stored) return []

  try {
    const transactions = JSON.parse(stored)
    
    // ✅ NEW: Log transaction types for debugging
    const types: Record<string, number> = {}
    transactions.forEach((t: any) => {
      types[t.type] = (types[t.type] || 0) + 1
    })
    
    console.log('[v0] Loaded transactions from storage:', transactions.length, 'items')
    console.log('[v0] Transaction types:', types)
    
    return transactions
  } catch (e) {
    console.error('[v0] Error parsing transactions:', e)
    return []
  }
}

/**
 * Save transactions to storage
 * Saves to both standard key and legacy locations for maximum compatibility
 * ✅ NEW: Clears all page caches when transactions change
 */
export function saveTransactionsToStorage(transactions: Transaction[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    const data = JSON.stringify(transactions)

    // Save to standard key (primary)
    localStorage.setItem(STANDARD_KEY, data)

    // Also save to legacy 'transactions' key for backward compatibility
    localStorage.setItem('transactions', data)

    // ✅ NEW: Clear all page caches when transactions change
    clearAllCaches()

    console.log('[v0] Saved transactions to storage:', transactions.length, 'items')
    return true
  } catch (e) {
    console.error('[v0] Error saving transactions:', e)
    return false
  }
}

/**
 * Clear transactions from storage
 * ✅ NEW: Also clears all page caches
 */
export function clearTransactionsFromStorage(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STANDARD_KEY)
  localStorage.removeItem('transactions')
  
  // ✅ NEW: Clear all page caches when transactions deleted
  clearAllCaches()
  
  console.log('[v0] Cleared transactions from storage')
}

/**
 * ✅ NEW FUNCTION: Clear all page caches
 * Called whenever transactions are added, updated, or deleted
 */
export function clearAllCaches(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('holdingsPageCache')
    localStorage.removeItem('dataInspectorCache')
    localStorage.removeItem('allocationPageCache')
    localStorage.removeItem('performancePageCache')
    localStorage.removeItem('priceCache')
    console.log('✓ All caches cleared')
  } catch (error) {
    console.error('Failed to clear caches:', error)
  }
}
