// ============================================
// LinkedIn OAuth - Start
// app/api/agents/linkedin/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/linkedin/callback`;

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    // Store state in cookie for verification
    const response = NextResponse.redirect(buildAuthUrl(clientId, redirectUri, state));
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;

  } catch (error: any) {
    console.error('[LinkedIn OAuth] Error:', error);
    return NextResponse.redirect(new URL('/agents?error=oauth_failed', request.url));
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
    'rw_organization_admin',     // Manage company pages
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}