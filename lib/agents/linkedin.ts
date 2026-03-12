// ============================================
// LinkedIn API - OAuth & Posting
// lib/agents/linkedin.ts
// ============================================

const LINKEDIN_API_URL = 'https://api.linkedin.com';

export interface LinkedInPostResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

/**
 * Post text content to LinkedIn (new Posts API - 2025)
 */
export async function postToLinkedIn(
  accessToken: string,
  platformUserId: string,
  content: string,
  accountType: 'person' | 'organization' = 'person'
): Promise<LinkedInPostResult> {
  try {
    // Build the author URN correctly
    const authorUrn = buildAuthorUrn(platformUserId, accountType);

    console.log(`[LinkedIn] Posting as ${accountType}: ${authorUrn}`);
    console.log(`[LinkedIn] Content length: ${content.length}`);

    const postBody = {
      author: authorUrn,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    console.log(`[LinkedIn] Request body:`, JSON.stringify(postBody, null, 2));

    const response = await fetch(`${LINKEDIN_API_URL}/rest/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202504',
      },
      body: JSON.stringify(postBody),
    });

    // LinkedIn returns 201 for success with x-restli-id header
    if (response.status === 201) {
      const postId = response.headers.get('x-restli-id') || '';
      // Extract the share ID from the URN
      const shareId = postId.replace('urn:li:share:', '');

      return {
        success: true,
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postId}`,
      };
    }

    const errorData = await response.json().catch(() => ({}));
    console.error('[LinkedIn] API error:', JSON.stringify(errorData, null, 2));

    return {
      success: false,
      error: errorData.message || `LinkedIn API error: ${response.status}`,
    };

  } catch (error: any) {
    console.error('[LinkedIn] Post error:', error);
    return {
      success: false,
      error: error.message || 'Failed to post to LinkedIn',
    };
  }
}

/**
 * Post with image to LinkedIn
 */
export async function postToLinkedInWithImage(
  accessToken: string,
  platformUserId: string,
  content: string,
  imageUrl: string,
  accountType: 'person' | 'organization' = 'person'
): Promise<LinkedInPostResult> {
  try {
    const authorUrn = buildAuthorUrn(platformUserId, accountType);

    console.log(`[LinkedIn] Posting with image as ${accountType}: ${authorUrn}`);

    // Step 1: Initialize image upload
    const initResponse = await fetch(`${LINKEDIN_API_URL}/rest/images?action=initializeUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202504',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: authorUrn,
        },
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.json().catch(() => ({}));
      console.error('[LinkedIn] Image init error:', error);
      // Fall back to text-only post
      return postToLinkedIn(accessToken, platformUserId, content, accountType);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value?.uploadUrl;
    const imageUrn = initData.value?.image;

    if (!uploadUrl || !imageUrn) {
      console.error('[LinkedIn] No upload URL returned');
      return postToLinkedIn(accessToken, platformUserId, content, accountType);
    }

    // Step 2: Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('[LinkedIn] Failed to fetch image');
      return postToLinkedIn(accessToken, platformUserId, content, accountType);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload image to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      console.error('[LinkedIn] Image upload failed');
      return postToLinkedIn(accessToken, platformUserId, content, accountType);
    }

    // Step 4: Create post with image
    const postBody = {
      author: authorUrn,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          title: 'Image',
          id: imageUrn,
        },
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const response = await fetch(`${LINKEDIN_API_URL}/rest/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202504',
      },
      body: JSON.stringify(postBody),
    });

    if (response.status === 201) {
      const postId = response.headers.get('x-restli-id') || '';
      return {
        success: true,
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postId}`,
      };
    }

    const errorData = await response.json().catch(() => ({}));
    console.error('[LinkedIn] Post with image error:', errorData);

    return {
      success: false,
      error: errorData.message || `LinkedIn API error: ${response.status}`,
    };

  } catch (error: any) {
    console.error('[LinkedIn] Post with image error:', error);
    // Fall back to text-only
    return postToLinkedIn(accessToken, platformUserId, content, accountType);
  }
}

/**
 * Build the correct author URN
 */
function buildAuthorUrn(platformUserId: string, accountType: 'person' | 'organization'): string {
  // If already a full URN, return as-is
  if (platformUserId.startsWith('urn:li:')) {
    return platformUserId;
  }

  // Build URN based on account type
  if (accountType === 'organization') {
    return `urn:li:organization:${platformUserId}`;
  }

  return `urn:li:person:${platformUserId}`;
}

/**
 * Get LinkedIn user profile
 */
export async function getLinkedInProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
} | null> {
  try {
    const response = await fetch(`${LINKEDIN_API_URL}/v2/userinfo`, {
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
    console.error('[LinkedIn] Profile error:', error);
    return null;
  }
}

/**
 * Refresh LinkedIn access token
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error('[LinkedIn] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };

  } catch (error) {
    console.error('[LinkedIn] Token refresh error:', error);
    return null;
  }
}

/**
 * Verify LinkedIn access token is valid
 */
export async function verifyLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${LINKEDIN_API_URL}/v2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}