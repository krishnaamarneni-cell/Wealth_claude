// ============================================
// LinkedIn OAuth - Start (Personal Only)
// app/api/agents/linkedin/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !appUrl) {
      console.error('[LinkedIn OAuth] Missing env vars');
      return NextResponse.redirect(new URL('/agents?tab=settings&error=config_error', request.url));
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const redirectUri = `${appUrl}/api/agents/linkedin/callback`;
    const state = crypto.randomUUID();

    // Personal scopes only (no org scopes - those need Community Management API approval)
    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: scopes,
      prompt: 'consent',
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;

  } catch (error: any) {
    console.error('[LinkedIn OAuth] Error:', error);
    return NextResponse.redirect(new URL('/agents?tab=settings&error=oauth_failed', request.url));
  }
}