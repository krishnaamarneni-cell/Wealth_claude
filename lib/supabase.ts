import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ─── Client-side (browser) ───────────────────────────────────────────────────
// Use this in 'use client' components
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Server-side ─────────────────────────────────────────────────────────────
// Use this in Server Components, Route Handlers, Server Actions
// cookieStore is the already-resolved value from `await cookies()`
export function createServerSideClient(
  cookieStore: { getAll(): { name: string; value: string }[]; set(name: string, value: string, options?: Record<string, unknown>): void }
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()           // ← no inner await (already resolved)
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}