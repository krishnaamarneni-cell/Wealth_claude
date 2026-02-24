import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

/**
 * Server component that protects routes requiring authentication
 * Redirects to /auth if user is not logged in
 */
export async function DashboardAuthGuard() {
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/auth?message=login_required')
  }

  return user
}
