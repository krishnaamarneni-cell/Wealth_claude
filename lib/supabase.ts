import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { NextRequest, NextResponse } from 'next/server'
import { NextResponse } from 'next/server'

// Global singleton instance - initialized only once
let supabaseInstance: ReturnType<typeof createBrowserClient> | undefined

// Get or create Supabase client (singleton pattern)
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() can only be called client-side')
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    )
  }

  return supabaseInstance
}

// Client-side Supabase client (always returns the same instance)
export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side during SSR - return a temporary instance silently
    // This is expected behavior - SSR renders client components on the server first
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    )
  }

  return getSupabaseClient()
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



