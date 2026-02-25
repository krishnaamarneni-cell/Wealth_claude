/**
 * Feature Flag Utility
 * Controls whether to use Supabase storage or fallback to localStorage
 */

/**
 * Check if Supabase storage is enabled
 * Returns true if NEXT_PUBLIC_USE_SUPABASE_STORAGE env var is set to 'true'
 */
export function isSupabaseStorageEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NEXT_PUBLIC_USE_SUPABASE_STORAGE === 'true'
  }
  // Client-side
  return process.env.NEXT_PUBLIC_USE_SUPABASE_STORAGE === 'true'
}

/**
 * Log which storage backend is active (for debugging)
 */
export function logStorageBackend(dataType: string): void {
  const isSupabase = isSupabaseStorageEnabled()
  const backend = isSupabase ? 'SUPABASE' : 'localStorage'
  console.log(`[v0-storage] ${dataType} using backend: ${backend}`)
}
