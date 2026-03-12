// ============================================
// LinkedIn OAuth Callback (Updated)
// Fetches both personal profile + company pages
// app/api/agents/linkedin/callback/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';

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
    const storedState = cookieStore.get('linkedin_oauth_state')?.value;

    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=invalid_state`);
    }

    // Exchange code for tokens
    const tokens = await exchangeLinkedInCode(code);

    // Get user info (personal profile)
    const linkedInUser = await getLinkedInUser(tokens.access_token);

    // Save personal profile account
    await supabase.from('social_accounts').upsert({
      user_id: user.id,
      platform: 'linkedin',
      account_id: linkedInUser.sub,
      account_name: linkedInUser.name,
      account_handle: linkedInUser.name,
      account_avatar_url: linkedInUser.picture,
      account_type: 'person',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scopes: ['openid', 'profile', 'w_member_social', 'w_organization_social', 'r_organization_social'],
      is_active: true,
    }, {
      onConflict: 'user_id,platform,account_id',
    });

    // Fetch company pages where user is admin
    const organizations = await getLinkedInOrganizations(tokens.access_token);

    // Save each company page as a separate account
    for (const org of organizations) {
      await supabase.from('social_accounts').upsert({
        user_id: user.id,
        platform: 'linkedin',
        account_id: org.id,
        account_name: org.name,
        account_handle: org.name,
        account_avatar_url: org.logo_url,
        account_type: 'organization',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: ['w_organization_social', 'r_organization_social', 'rw_organization_admin'],
        is_active: true,
      }, {
        onConflict: 'user_id,platform,account_id',
      });
    }

    // Log activity
    const accountCount = 1 + organizations.length;
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action_type: 'social_connected',
      action_description: `Connected ${accountCount} LinkedIn account(s): ${linkedInUser.name}${organizations.length > 0 ? ` + ${organizations.map(o => o.name).join(', ')}` : ''}`,
      status: 'success',
    });

    // Clear cookies and redirect
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?connected=linkedin&accounts=${accountCount}`);
    response.cookies.delete('linkedin_oauth_state');

    return response;

  } catch (error: any) {
    console.error('LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agents?error=oauth_failed`);
  }
}
