// ============================================
// X OAuth Routes
// app/api/agents/x/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import crypto from 'crypto';

// ============================================
// GET /api/agents/x - Start OAuth flow
// ============================================
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${appUrl}/agents?error=unauthorized`);
    }

    if (!process.env.X_CLIENT_ID) {
      console.error('[v0] X_CLIENT_ID env var is missing');
      return NextResponse.redirect(`${appUrl}/agents?error=x_not_configured`);
    }

    // Generate state and code verifier
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    const authUrl = getXAuthUrl(state, codeVerifier);
    console.log('[v0] X OAuth redirect to:', authUrl);

    // Store in cookie for callback verification
    const response = NextResponse.redirect(authUrl);

    response.cookies.set('x_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    response.cookies.set('x_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;
  } catch (error: any) {
    console.error('[v0] X OAuth initiation error:', error);
    return NextResponse.redirect(`${appUrl}/agents?error=x_oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
}

// ============================================
// POST /api/agents/x - Post to X
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { account_id, text, image_url } = await request.json();

    if (!account_id || !text) {
      return NextResponse.json({ error: 'account_id and text required' }, { status: 400 });
    }

    // Get valid access token
    const accessToken = await getValidXToken(user.id, account_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'X account not connected or token expired' }, { status: 401 });
    }

    // Upload media if image provided
    let mediaId: string | undefined;
    if (image_url) {
      try {
        mediaId = await uploadXMedia(accessToken, image_url);
      } catch (e) {
        console.error('Media upload failed:', e);
        // Continue without image
      }
    }

    // Post tweet
    const tweet = await postTweet(accessToken, text, mediaId);

    return NextResponse.json({
      success: true,
      data: {
        platform: 'x',
        post_id: tweet.id,
        text: tweet.text,
      },
    });

  } catch (error: any) {
    console.error('X post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
