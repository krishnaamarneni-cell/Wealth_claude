import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if this is a NEW user (no existing transactions)
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1)

      const isNewUser = !existingTx || existingTx.length === 0

      if (isNewUser) {
        // Seed demo data for new users
        console.log('[auth/callback] New user detected, seeding demo data...')
        
        try {
          // Call the seed-demo-data API
          const seedResponse = await fetch(`${origin}/api/seed-demo-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Forward the cookies for authentication
              'Cookie': cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
            },
          })

          if (seedResponse.ok) {
            console.log('[auth/callback] ✅ Demo data seeded successfully')
          } else {
            console.warn('[auth/callback] Failed to seed demo data:', await seedResponse.text())
          }
        } catch (seedError) {
          console.error('[auth/callback] Error seeding demo data:', seedError)
          // Don't block the auth flow if seeding fails
        }

        // Redirect new users to dashboard with flag
        return NextResponse.redirect(`${origin}/dashboard?welcome=true`)
      }
    }
  }

  // Redirect to dashboard for existing users
  return NextResponse.redirect(`${origin}/dashboard`)
}
