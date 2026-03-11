// ============================================
// LinkedIn OAuth Routes
// app/api/agents/linkedin/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { getLinkedInAuthUrl, postToLinkedIn, getValidLinkedInToken } from '@/lib/agents/linkedin';
import crypto from 'crypto';

// ============================================
// GET /api/agents/linkedin - Start OAuth flow
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

    if (!process.env.LINKEDIN_CLIENT_ID) {
      console.error('[v0] LINKEDIN_CLIENT_ID env var is missing');
      return NextResponse.redirect(`${appUrl}/agents?error=linkedin_not_configured`);
    }

    // Generate state
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = getLinkedInAuthUrl(state);
    console.log('[v0] LinkedIn OAuth redirect to:', authUrl);

    // Store in cookie for callback verification
    const response = NextResponse.redirect(authUrl);

    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;
  } catch (error: any) {
    console.error('[v0] LinkedIn OAuth initiation error:', error);
    return NextResponse.redirect(`${appUrl}/agents?error=linkedin_oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
}

// ============================================
// POST /api/agents/linkedin - Post to LinkedIn
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
    const tokenData = await getValidLinkedInToken(user.id, account_id);
    if (!tokenData) {
      return NextResponse.json({ error: 'LinkedIn account not connected or token expired' }, { status: 401 });
    }

    // Post to LinkedIn
    const post = await postToLinkedIn(
      tokenData.token,
      tokenData.authorId,
      text,
      image_url
    );

    return NextResponse.json({
      success: true,
      data: {
        platform: 'linkedin',
        post_id: post.id,
      },
    });

  } catch (error: any) {
    console.error('LinkedIn post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
