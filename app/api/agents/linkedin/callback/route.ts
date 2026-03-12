// ============================================
// LinkedIn OAuth Callback - Personal + Company Pages
// app/api/agents/linkedin/callback/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const LINKEDIN_API = 'https://api.linkedin.com';

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
    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData) {
      return NextResponse.redirect(new URL('/agents?tab=settings&error=token_exchange_failed', request.url));
    }

    console.log('[LinkedIn Callback] Token obtained, fetching accounts...');

    // Fetch personal profile
    const personalProfile = await fetchPersonalProfile(tokenData.access_token);

    // Fetch company pages where user is admin
    const companyPages = await fetchCompanyPages(tokenData.access_token);

    console.log('[LinkedIn Callback] Personal:', personalProfile?.name);
    console.log('[LinkedIn Callback] Company pages:', companyPages.length);

    // Store personal account
    if (personalProfile) {
      await supabase
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'linkedin',
          account_id: personalProfile.id,
          account_name: personalProfile.name,
          account_handle: personalProfile.email || personalProfile.id,
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

      console.log('[LinkedIn Callback] Saved personal account');
    }

    // Store each company page as separate account
    for (const company of companyPages) {
      await supabase
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'linkedin',
          account_id: company.id,
          account_name: company.name,
          account_handle: company.vanityName || company.id,
          account_type: 'organization',
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

      console.log(`[LinkedIn Callback] Saved company page: ${company.name}`);
    }

    // Clear state cookie
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

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
} | null> {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
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

    if (!response.ok) {
      const error = await response.text();
      console.error('[LinkedIn] Token exchange error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[LinkedIn] Token exchange error:', error);
    return null;
  }
}

/**
 * Fetch personal profile using userinfo endpoint
 */
async function fetchPersonalProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
} | null> {
  try {
    const response = await fetch(`${LINKEDIN_API}/v2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[LinkedIn] Profile fetch failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      id: data.sub,
      name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
      email: data.email,
    };
  } catch (error) {
    console.error('[LinkedIn] Profile fetch error:', error);
    return null;
  }
}

/**
 * Fetch company pages where user is an admin
 */
async function fetchCompanyPages(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  vanityName?: string;
}>> {
  try {
    // Get organization ACLs - lists orgs where user has admin access
    const aclResponse = await fetch(
      `${LINKEDIN_API}/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName)))`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202504',
        },
      }
    );

    if (!aclResponse.ok) {
      const error = await aclResponse.text();
      console.error('[LinkedIn] Organization ACLs fetch failed:', error);

      // Try alternative endpoint
      return await fetchCompanyPagesAlternative(accessToken);
    }

    const aclData = await aclResponse.json();
    const companies: Array<{ id: string; name: string; vanityName?: string }> = [];

    for (const element of aclData.elements || []) {
      const org = element['organization~'];
      if (org) {
        // Extract org ID from URN (urn:li:organization:12345 -> 12345)
        const orgUrn = element.organization || '';
        const orgId = orgUrn.replace('urn:li:organization:', '');

        companies.push({
          id: orgId,
          name: org.localizedName || 'Unknown Company',
          vanityName: org.vanityName,
        });
      }
    }

    return companies;

  } catch (error) {
    console.error('[LinkedIn] Company pages fetch error:', error);
    return [];
  }
}

/**
 * Alternative method to fetch company pages
 */
async function fetchCompanyPagesAlternative(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  vanityName?: string;
}>> {
  try {
    // Try the REST API version
    const response = await fetch(
      `${LINKEDIN_API}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202504',
        },
      }
    );

    if (!response.ok) {
      console.error('[LinkedIn] Alt organization fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    const companies: Array<{ id: string; name: string; vanityName?: string }> = [];

    for (const element of data.elements || []) {
      const orgUrn = element.organization || '';
      const orgId = orgUrn.replace('urn:li:organization:', '');

      if (orgId) {
        // Fetch organization details
        const orgDetails = await fetchOrganizationDetails(accessToken, orgId);
        companies.push({
          id: orgId,
          name: orgDetails?.name || `Organization ${orgId}`,
          vanityName: orgDetails?.vanityName,
        });
      }
    }

    return companies;

  } catch (error) {
    console.error('[LinkedIn] Alt company fetch error:', error);
    return [];
  }
}

/**
 * Fetch single organization details
 */
async function fetchOrganizationDetails(accessToken: string, orgId: string): Promise<{
  name: string;
  vanityName?: string;
} | null> {
  try {
    const response = await fetch(
      `${LINKEDIN_API}/rest/organizations/${orgId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202504',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      name: data.localizedName || data.name,
      vanityName: data.vanityName,
    };

  } catch (error) {
    return null;
  }
}