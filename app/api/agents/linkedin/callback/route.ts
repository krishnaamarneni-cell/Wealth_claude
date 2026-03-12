// ============================================
// LinkedIn OAuth Callback - Personal Only
// app/api/agents/linkedin/callback/route.ts
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

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('[LinkedIn Callback] OAuth error:', error);
      return NextResponse.redirect(new URL(`/agents?tab=settings&error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/agents?tab=settings&error=no_code', request.url));
    }

    // Verify state
    const savedState = cookieStore.get('linkedin_oauth_state')?.value;
    if (state !== savedState) {
      console.error('[LinkedIn Callback] State mismatch');
      return NextResponse.redirect(new URL('/agents?tab=settings&error=state_mismatch', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('[LinkedIn Callback] Token error:', tokenError);
      return NextResponse.redirect(new URL('/agents?tab=settings&error=token_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('[LinkedIn Callback] Token obtained');

    // Fetch personal profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('[LinkedIn Callback] Profile fetch failed');
      return NextResponse.redirect(new URL('/agents?tab=settings&error=profile_failed', request.url));
    }

    const profile = await profileResponse.json();
    console.log('[LinkedIn Callback] Profile:', profile.name);

    // Save to database
    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform: 'linkedin',
        account_id: profile.sub,
        account_name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        account_handle: profile.email || profile.sub,
        account_type: 'person',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform,account_id',
      });

    if (dbError) {
      console.error('[LinkedIn Callback] DB error:', dbError);
      return NextResponse.redirect(new URL('/agents?tab=settings&error=db_failed', request.url));
    }

    console.log('[LinkedIn Callback] Account saved successfully');

    // Clear state cookie and redirect
    const response = NextResponse.redirect(
      new URL('/agents?tab=settings&success=linkedin_connected', request.url)
    );
    response.cookies.delete('linkedin_oauth_state');

    return response;

  } catch (error: any) {
    console.error('[LinkedIn Callback] Error:', error);
    return NextResponse.redirect(new URL('/agents?tab=settings&error=callback_failed', request.url));
  }
}