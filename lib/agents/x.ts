// ============================================
// X (Twitter) Service - OAuth + Posting
// lib/agents/x.ts
// ============================================

import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import crypto from 'crypto';

const X_API_BASE = 'https://api.twitter.com/2';
const X_OAUTH_BASE = 'https://twitter.com/i/oauth2';

// ============================================
// OAuth Functions
// ============================================

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getXAuthUrl(state: string, codeVerifier: string): string {
  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/x/callback`;

  // Generate code challenge from verifier
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${X_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange code for tokens
 */
export async function exchangeXCode(code: string, codeVerifier: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/x/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`X token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshXToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh X token');
  }

  return response.json();
}

/**
 * Get authenticated user info
 */
export async function getXUser(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}> {
  const response = await fetch(`${X_API_BASE}/users/me?user.fields=profile_image_url`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get X user');
  }

  const data = await response.json();
  return data.data;
}

// ============================================
// Posting Functions
// ============================================

/**
 * Post a tweet
 */
export async function postTweet(
  accessToken: string,
  text: string,
  mediaId?: string
): Promise<{ id: string; text: string }> {
  const body: any = { text };

  if (mediaId) {
    body.media = { media_ids: [mediaId] };
  }

  const response = await fetch(`${X_API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post tweet: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Upload media (image) to X
 */
export async function uploadXMedia(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Download image first
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Upload to X (v1.1 endpoint - still required for media)
  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      media_data: base64Image,
    }),
  });

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errorJson = await response.json();
      errorMsg = JSON.stringify(errorJson);
      console.error('[v0] X media upload error response:', errorJson);
    } catch {
      errorMsg = await response.text();
      console.error('[v0] X media upload error text:', errorMsg);
    }
    throw new Error(`Failed to upload media to X: ${errorMsg || response.statusText}`);
  }

  const data = await response.json();
  return data.media_id_string;
}

// ============================================
// Comment Functions
// ============================================

/**
 * Get replies/mentions for a tweet
 */
export async function getTweetReplies(
  accessToken: string,
  tweetId: string
): Promise<Array<{
  id: string;
  text: string;
  author_id: string;
  created_at: string;
}>> {
  const response = await fetch(
    `${X_API_BASE}/tweets/search/recent?query=conversation_id:${tweetId}&tweet.fields=author_id,created_at`,
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
  return data.data || [];
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(
  accessToken: string,
  tweetId: string,
  text: string
): Promise<{ id: string }> {
  const response = await fetch(`${X_API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      reply: { in_reply_to_tweet_id: tweetId },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reply: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================
// Helper: Get valid access token (auto-refresh)
// ============================================

export async function getValidXToken(userId: string, accountId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  const { data: account } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', accountId)
    .eq('platform', 'x')
    .single();

  if (!account) return null;

  // Check if token is expired
  const expiresAt = new Date(account.token_expires_at);
  const now = new Date();

  if (expiresAt <= now && account.refresh_token) {
    // Refresh token
    try {
      const tokens = await refreshXToken(account.refresh_token);

      await supabase
        .from('social_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', accountId);

      return tokens.access_token;
    } catch {
      return null;
    }
  }

  return account.access_token;
}
