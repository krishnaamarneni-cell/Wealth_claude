// ============================================
// X (Twitter) API - OAuth & Posting
// lib/agents/x.ts
// ============================================

export interface XPostResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

/**
 * Post text content to X
 */
export async function postToX(
  accessToken: string,
  refreshToken: string,
  content: string
): Promise<XPostResult> {
  try {
    console.log(`[X] Posting text (${content.length} chars)`);

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[X] API error:', JSON.stringify(errorData));

      // Check for specific errors
      if (errorData.title === 'Unauthorized') {
        return { success: false, error: 'X token expired. Please reconnect your account.' };
      }
      if (errorData.title === 'CreditsDepleted') {
        return { success: false, error: 'X API credits depleted. Wait for monthly reset or upgrade plan.' };
      }

      return {
        success: false,
        error: errorData.detail || errorData.title || `X API error: ${response.status}`,
      };
    }

    const result = await response.json();
    const tweetId = result.data?.id;

    return {
      success: true,
      id: tweetId,
      url: `https://twitter.com/i/web/status/${tweetId}`,
    };

  } catch (error: any) {
    console.error('[X] Post error:', error);
    return {
      success: false,
      error: error.message || 'Failed to post to X',
    };
  }
}

/**
 * Post with media to X
 * Note: X API v2 requires uploading media first via v1.1 endpoint
 */
export async function postToXWithMedia(
  accessToken: string,
  refreshToken: string,
  content: string,
  imageUrl: string
): Promise<XPostResult> {
  try {
    console.log(`[X] Posting with image: ${imageUrl.substring(0, 50)}...`);

    // For now, just post text - media upload requires OAuth 1.0a
    // TODO: Implement media upload with OAuth 1.0a
    console.log('[X] Media upload not implemented yet, posting text only');

    return postToX(accessToken, refreshToken, content);

  } catch (error: any) {
    console.error('[X] Post with media error:', error);
    // Fallback to text-only
    return postToX(accessToken, refreshToken, content);
  }
}

/**
 * Verify X access token
 */
export async function verifyXToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get X user profile
 */
export async function getXProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
} | null> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
    };

  } catch (error) {
    console.error('[X] Profile error:', error);
    return null;
  }
}

/**
 * Refresh X access token
 */
export async function refreshXToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  try {
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[X] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };

  } catch (error) {
    console.error('[X] Token refresh error:', error);
    return null;
  }
}