import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  console.log('[v0-middleware] Request:', request.nextUrl.pathname)

  // Protect /dashboard routes - redirect to auth if not logged in
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('[v0-middleware] Checking auth for /dashboard')
    const response = await updateSession(request)
    console.log('[v0-middleware] Auth check response status:', response.status)
    return response
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - sitemap.xml (SEO)
     * - robots.txt (SEO)
     * NOTE: api routes are intentionally included so session cookies are refreshed
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt).*)',
  ],
}
