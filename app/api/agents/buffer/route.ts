// ============================================
// API Routes: Buffer Integration
// /api/agents/buffer/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';

// ============================================
// GET /api/agents/buffer
// Fetch connected Buffer profiles
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stored Buffer accounts from database
    const { data: storedAccounts, error: dbError } = await supabase
      .from('buffer_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('platform');

    if (dbError) {
      console.error('Error fetching buffer accounts:', dbError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Also try to fetch fresh data from Buffer API if we have a token
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', user.id)
      .eq('key_name', 'buffer')
      .is('agent_id', null)
      .single();

    let freshProfiles: any[] = [];

    if (apiKey) {
      try {
        const decryptedToken = decryptApiKey(apiKey.key_value);
        const bufferResponse = await fetch('https://api.bufferapp.com/1/profiles.json', {
          headers: {
            'Authorization': `Bearer ${decryptedToken}`,
          },
        });

        if (bufferResponse.ok) {
          freshProfiles = await bufferResponse.json();

          // Sync profiles to database
          for (const profile of freshProfiles) {
            await supabase
              .from('buffer_accounts')
              .upsert({
                user_id: user.id,
                buffer_profile_id: profile.id,
                platform: mapBufferService(profile.service),
                account_name: profile.formatted_username || profile.service_username,
                account_handle: profile.service_username,
                account_avatar_url: profile.avatar_https,
                is_connected: true,
                last_synced_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,buffer_profile_id',
              });
          }
        }
      } catch (err) {
        console.error('Error fetching from Buffer API:', err);
        // Continue with stored accounts if API fails
      }
    }

    // Fetch updated accounts
    const { data: accounts } = await supabase
      .from('buffer_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('platform');

    return NextResponse.json({
      success: true,
      data: accounts || [],
      synced: freshProfiles.length > 0,
    });

  } catch (error) {
    console.error('Buffer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/agents/buffer
// Test Buffer connection and sync profiles
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Buffer API key
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', user.id)
      .eq('key_name', 'buffer')
      .is('agent_id', null)
      .single();

    if (!apiKey) {
      return NextResponse.json({
        error: 'Buffer API key not found. Please add it in API Connections.'
      }, { status: 400 });
    }

    const decryptedToken = decryptApiKey(apiKey.key_value);

    // Fetch profiles from Buffer
    const bufferResponse = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: {
        'Authorization': `Bearer ${decryptedToken}`,
      },
    });

    if (!bufferResponse.ok) {
      const error = await bufferResponse.text();
      return NextResponse.json({
        error: 'Failed to connect to Buffer. Check your API key.',
        details: error,
      }, { status: 400 });
    }

    const profiles = await bufferResponse.json();

    // Sync all profiles to database
    const syncedAccounts = [];
    for (const profile of profiles) {
      const { data, error } = await supabase
        .from('buffer_accounts')
        .upsert({
          user_id: user.id,
          buffer_profile_id: profile.id,
          platform: mapBufferService(profile.service),
          account_name: profile.formatted_username || profile.service_username,
          account_handle: profile.service_username,
          account_avatar_url: profile.avatar_https,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,buffer_profile_id',
        })
        .select()
        .single();

      if (data) {
        syncedAccounts.push(data);
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action_type: 'buffer_connected',
      action_description: `Synced ${syncedAccounts.length} Buffer profile(s)`,
      status: 'success',
      metadata: { profile_count: syncedAccounts.length },
    });

    return NextResponse.json({
      success: true,
      data: syncedAccounts,
      message: `Successfully synced ${syncedAccounts.length} profile(s)`,
    });

  } catch (error) {
    console.error('Buffer POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/agents/buffer
// Disconnect a Buffer profile
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('buffer_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('buffer_profile_id', profileId);

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile disconnected',
    });

  } catch (error) {
    console.error('Buffer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// Helper: Map Buffer service name to our platform enum
// ============================================
function mapBufferService(service: string): 'x' | 'linkedin' | 'instagram' {
  const mapping: Record<string, 'x' | 'linkedin' | 'instagram'> = {
    'twitter': 'x',
    'x': 'x',
    'linkedin': 'linkedin',
    'instagram': 'instagram',
  };
  return mapping[service.toLowerCase()] || 'x';
}