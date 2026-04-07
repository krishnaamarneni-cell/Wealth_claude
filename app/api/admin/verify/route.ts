import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/verify
 * Returns whether the current user is an authenticated admin.
 * Used by client components that need to check admin status
 * without exposing the admin email in the client bundle.
 */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  return NextResponse.json({ admin: true })
}
