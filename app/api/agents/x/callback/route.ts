// ============================================
// X OAuth Callback
// app/api/agents/x/callback/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { exchangeXCode, getXUser } from '@/lib/agents/x';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=unauthorized`);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=${error}`);
    }

    // Verify state
    const storedState = cookieStore.get('x_oauth_state')?.value;
    const codeVerifier = cookieStore.get('x_code_verifier')?.value;

    if (!code || !state || state !== storedState || !codeVerifier) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=invalid_state`);
    }

    // Exchange code for tokens
    const tokens = await exchangeXCode(code, codeVerifier);

    // Get user info
    const xUser = await getXUser(tokens.access_token);

    // Save to database
    await supabase.from('social_accounts').upsert({
      user_id: user.id,
      platform: 'x',
      account_id: xUser.id,
      account_name: xUser.name,
      account_handle: xUser.username,
      account_avatar_url: xUser.profile_image_url,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      is_active: true,
    }, {
      onConflict: 'user_id,platform,account_id',
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action_type: 'social_connected',
      action_description: `Connected X account @${xUser.username}`,
      status: 'success',
    });

    // Clear cookies and redirect
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?connected=x`);
    response.cookies.delete('x_oauth_state');
    response.cookies.delete('x_code_verifier');

    return response;

  } catch (error: any) {
    console.error('X OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=oauth_failed`);
  }
}