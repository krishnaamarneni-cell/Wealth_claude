import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

/**
 * Server-side admin auth guard
 * Redirects if not logged in, returns 404 if not admin
 * Usage: await requireAdmin()
 */
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = await createServerSideClient(cookieStore)

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if user is admin
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    notFound()
  }

  return user
}

/**
 * Check if email is admin (for client-side checks)
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
}
