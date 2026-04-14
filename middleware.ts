import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase'

function applySecurityHeaders(response: Response) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none';")
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

export async function middleware(request: NextRequest) {
  // Protect /dashboard routes - redirect to auth if not logged in
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const response = await updateSession(request)
    return applySecurityHeaders(response)
  }

  const response = await updateSession(request)
  return applySecurityHeaders(response)
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
