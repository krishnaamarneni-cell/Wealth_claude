import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = await cookies()

  if (code) {
    const supabase = await createServerSideClient(cookieStore)
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Handle password recovery
  const type = requestUrl.searchParams.get('type')
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }
  ```

Then update the Supabase email template button URL back to:
```
  { { .ConfirmationURL } }
  ```

And in **Supabase → URL Configuration → Redirect URLs** make sure this is added:
```
  https://www.wealthclaude.com/auth/callback

  const supabase = await createServerSideClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single()

  if (!profile) {
    // Profile doesn't exist - redirect to setup
    return NextResponse.redirect(new URL('/profile/setup', request.url))
  }

  // Profile exists - go to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

