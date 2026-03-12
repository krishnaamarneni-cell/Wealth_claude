// ============================================
// LinkedIn OAuth - Start (DEBUG VERSION)
// app/api/agents/linkedin/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('[LinkedIn OAuth] ========== START ==========');

  try {
    // Check env vars first
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    console.log('[LinkedIn OAuth] LINKEDIN_CLIENT_ID exists:', !!clientId);
    console.log('[LinkedIn OAuth] NEXT_PUBLIC_APP_URL:', appUrl);

    if (!clientId) {
      console.error('[LinkedIn OAuth] MISSING LINKEDIN_CLIENT_ID');
      return NextResponse.redirect(new URL('/agents?tab=settings&error=missing_client_id', request.url));
    }

    if (!appUrl) {
      console.error('[LinkedIn OAuth] MISSING NEXT_PUBLIC_APP_URL');
      return NextResponse.redirect(new URL('/agents?tab=settings&error=missing_app_url', request.url));
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    console.log('[LinkedIn OAuth] Checking auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[LinkedIn OAuth] Auth result - user:', user?.id, 'error:', authError?.message);

    if (authError || !user) {
      console.error('[LinkedIn OAuth] Not authenticated, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('[LinkedIn OAuth] User authenticated:', user.email);

    const redirectUri = `${appUrl}/api/agents/linkedin/callback`;
    console.log('[LinkedIn OAuth] Redirect URI:', redirectUri);

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    console.log('[LinkedIn OAuth] Generated state:', state);

    // Build auth URL
    const authUrl = buildAuthUrl(clientId, redirectUri, state);
    console.log('[LinkedIn OAuth] Auth URL:', authUrl);

    // Store state in cookie for verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    console.log('[LinkedIn OAuth] Redirecting to LinkedIn...');
    return response;

  } catch (error: any) {
    console.error('[LinkedIn OAuth] CAUGHT ERROR:', error);
    return NextResponse.redirect(new URL('/agents?tab=settings&error=oauth_failed', request.url));
  }
}

function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = [
    'openid',
    'profile',
    'email',
    'w_member_social',           // Post as personal
    'w_organization_social',     // Post as company page
    'r_organization_social',     // Read company comments
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
    prompt: 'consent',  // Force consent screen
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}