import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Update the session and check if user is authenticated
    const response = await updateSession(request)
    
    // If updateSession redirects (user not authenticated), use that response
    if (response.status !== 200) {
      return response
    }
    
    return response
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
