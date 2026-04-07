import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

/**
 * Server-side admin auth guard for page components.
 * Redirects if not logged in, returns 404 if not admin.
 */
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = await createServerSideClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    notFound()
  }

  return user
}
