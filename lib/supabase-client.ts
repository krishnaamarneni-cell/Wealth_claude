'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single Supabase client instance for client-side use only
// This ensures only one GoTrueClient instance exists
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create fresh instance (won't be used with auth)
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: reuse singleton instance
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseClient
}
