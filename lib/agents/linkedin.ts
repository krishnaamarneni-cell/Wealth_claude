// ============================================
// LinkedIn Service - OAuth + Posting (Updated)
// Supports Personal Profile + Company Pages
// lib/agents/linkedin.ts
// ============================================

import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';

// ============================================
// OAuth Functions
// ============================================

/**
 * Generate OAuth 2.0 authorization URL
 * Updated scopes to include organization access
 */
export function getLinkedInAuthUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    // Updated scopes: personal + organization posting
    scope: 'openid profile w_member_social w_organization_social r_organization_social rw_organization_admin',
    state: state,
  });

  return `${LINKEDIN_OAUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Exchange code for tokens
 */
export async function exchangeLinkedInCode(code: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/linkedin/callback`;

  const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

  const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh LinkedIn token');
  }

  return response.json();
}

/**
 * Get authenticated user info
 */
export async function getLinkedInUser(accessToken: string): Promise<{
  sub: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user');
  }

  return response.json();
}

/**
 * Get user's administered company pages
 */
export async function getLinkedInOrganizations(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  logo_url?: string;
}>> {
  try {
    // Get organizations where user is admin
    const response = await fetch(
      `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch LinkedIn organizations:', await response.text());
      return [];
    }

    const data = await response.json();

    return (data.elements || []).map((el: any) => {
      const org = el['organization~'];
      const orgId = org?.id || el.organization?.split(':').pop();

      return {
        id: orgId,
        name: org?.localizedName || 'Unknown Organization',
        logo_url: org?.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
    });
  } catch (error) {
    console.error('Error fetching LinkedIn organizations:', error);
    return [];
  }
}

// ============================================
// Posting Functions
// ============================================

export type LinkedInAuthorType = 'person' | 'organization';

/**
 * Post to LinkedIn (Personal or Company Page)
 */
export async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string,
  imageUrl?: string,
  authorType: LinkedInAuthorType = 'person'
): Promise<{ id: string }> {
  const authorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  const postBody: any = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // If image, upload first then attach
  if (imageUrl) {
    const asset = await uploadLinkedInImage(accessToken, authorId, imageUrl, authorType);
    postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
      status: 'READY',
      media: asset,
    }];
  }

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post to LinkedIn: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Upload image to LinkedIn
 */
async function uploadLinkedInImage(
  accessToken: string,
  authorId: string,
  imageUrl: string,
  authorType: LinkedInAuthorType = 'person'
): Promise<string> {
  const ownerUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  // Step 1: Register upload
  const registerResponse = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: ownerUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerResponse.ok) {
    throw new Error('Failed to register LinkedIn image upload');
  }

  const registerData = await registerResponse.json();
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Download image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  // Step 3: Upload to LinkedIn
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to LinkedIn');
  }

  return asset;
}

// ============================================
// Comment Functions
// ============================================

/**
 * Get comments on a post
 */
export async function getLinkedInComments(
  accessToken: string,
  postId: string
): Promise<Array<{
  id: string;
  text: string;
  author: string;
  created_at: number;
}>> {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/comments`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.elements || []).map((c: any) => ({
    id: c['$URN'],
    text: c.message?.text || '',
    author: c.actor,
    created_at: c.created?.time || Date.now(),
  }));
}

/**
 * Reply to a comment
 */
export async function replyToLinkedInComment(
  accessToken: string,
  postId: string,
  commentId: string,
  text: string,
  authorId: string,
  authorType: LinkedInAuthorType = 'person'
): Promise<{ id: string }> {
  const actorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  const response = await fetch(
    `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actor: actorUrn,
        message: { text },
        parentComment: commentId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reply: ${error}`);
  }

  const data = await response.json();
  return { id: data['$URN'] };
}

// ============================================
// Helper: Get valid access token
// ============================================

export async function getValidLinkedInToken(userId: string, accountId: string): Promise<{
  token: string;
  authorId: string;
  authorType: LinkedInAuthorType;
} | null> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  const { data: account } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', accountId)
    .eq('platform', 'linkedin')
    .single();

  if (!account) return null;

  // Check if token is expired
  const expiresAt = new Date(account.token_expires_at);
  const now = new Date();

  if (expiresAt <= now && account.refresh_token) {
    try {
      const tokens = await refreshLinkedInToken(account.refresh_token);

      await supabase
        .from('social_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || account.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', accountId);

      return {
        token: tokens.access_token,
        authorId: account.account_id,
        authorType: account.account_type || 'person',
      };
    } catch {
      return null;
    }
  }

  return {
    token: account.access_token,
    authorId: account.account_id,
    authorType: account.account_type || 'person',
  };
}