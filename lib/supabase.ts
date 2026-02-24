import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Client-side Supabase client
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side Supabase client (for Route Handlers and Server Actions)
export function createServerSideClient(
  cookieStore: Awaited<ReturnType<typeof import('next/headers').cookies>>
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}
