import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * Verifies the current request is from an authenticated admin user.
 * Returns the supabase client if authorized, or a NextResponse error.
 */
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return { error: NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 }) }
  }

  return { supabase, user }
}
