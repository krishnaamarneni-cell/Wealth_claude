// ============================================
// Social Accounts API
// app/api/agents/social/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';

// ============================================
// GET /api/agents/social - List connected accounts
// ============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('id, platform, account_id, account_name, account_handle, account_avatar_url, is_active, token_expires_at')
      .eq('user_id', user.id)
      .order('platform');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: accounts || [],
    });

  } catch (error) {
    console.error('Social GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/agents/social - Disconnect account
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action_type: 'social_disconnected',
      action_description: 'Disconnected social account',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Account disconnected',
    });

  } catch (error) {
    console.error('Social DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}