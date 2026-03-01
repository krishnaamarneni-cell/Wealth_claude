import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { NextRequest, NextResponse } from 'next/server'
import { NextResponse } from 'next/server'

// Singleton browser client instance - only for client-side
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null

// Client-side Supabase client (singleton to avoid multiple GoTrueClient instances)
export function createClient() {
  // Only use singleton on client-side to prevent multiple instances
  if (typeof window === 'undefined') {
    // Server-side - create a temporary instance (SSR only, not cached)
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Client-side - always reuse the same singleton instance
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return browserClientInstance
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

// Middleware helper for session updates and auth checks
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if accessing protected routes without auth
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(
      new URL('/auth?message=login_required', request.url)
    )
  }

  return response
}


