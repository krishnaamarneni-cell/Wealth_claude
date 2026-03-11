// ============================================
// API Routes: API Keys Management
// /api/agents/api-keys
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { encryptApiKey, decryptApiKey, maskApiKey, getApiKeyDisplayName } from '@/lib/encryption';
import { ApiKey, ApiKeyInsert, ApiKeyName } from '@/types/database';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

// ============================================
// GET /api/agents/api-keys
// List all API keys for the user (masked)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');

    // Build query
    let query = supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('key_name');

    // Filter by agent if specified
    if (agentId) {
      query = query.or(`agent_id.eq.${agentId},agent_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    // Mask the key values for security
    const maskedKeys = data?.map((key) => ({
      ...key,
      key_value: maskApiKey(decryptApiKey(key.key_value)),
      display_name: getApiKeyDisplayName(key.key_name),
    })) || [];

    return NextResponse.json({
      success: true,
      data: maskedKeys,
    });

  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/agents/api-keys
// Add a new API key
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key_name, key_value, agent_id } = body as {
      key_name: ApiKeyName;
      key_value: string;
      agent_id?: string | null;
    };

    // Validate required fields
    if (!key_name || !key_value) {
      return NextResponse.json(
        { error: 'key_name and key_value are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    // Check if key already exists for this user/agent combination
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('key_name', key_name)
      .is('agent_id', agent_id || null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'API key already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Encrypt the key value
    const encryptedValue = encryptApiKey(key_value);

    // Insert the new key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_name,
        key_value: encryptedValue,
        agent_id: agent_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return masked key
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        key_value: maskApiKey(key_value),
        display_name: getApiKeyDisplayName(key_name),
      },
      message: 'API key added successfully',
    });

  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT /api/agents/api-keys
// Update an existing API key
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, key_value, is_active } = body as {
      id: string;
      key_value?: string;
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    // Verify ownership
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (key_value !== undefined) {
      updates.key_value = encryptApiKey(key_value);
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Update the key
    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        key_value: key_value ? maskApiKey(key_value) : '****',
        display_name: getApiKeyDisplayName(data.key_name),
      },
      message: 'API key updated successfully',
    });

  } catch (error) {
    console.error('API keys PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/agents/api-keys
// Delete an API key
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    // Verify ownership
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Delete the key
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });

  } catch (error) {
    console.error('API keys DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
