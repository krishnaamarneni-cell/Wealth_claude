// ============================================
// API Routes: Test API Key Connection
// /api/agents/api-keys/test
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { decryptApiKey } from '@/lib/encryption';
import { ApiKeyName } from '@/types/database';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

// Test functions for each API type
const testFunctions: Record<string, (apiKey: string) => Promise<{ success: boolean; message: string }>> = {

  // Test Groq API
  groq: async (apiKey: string) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'Groq API connected successfully' };
      } else {
        const error = await response.json();
        return { success: false, message: error.error?.message || 'Invalid API key' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Groq API' };
    }
  },

  // Test Perplexity API
  perplexity: async (apiKey: string) => {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });

      if (response.ok || response.status === 400) {
        // 400 is acceptable - means API key works but request was minimal
        return { success: true, message: 'Perplexity API connected successfully' };
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid API key' };
      } else {
        return { success: false, message: 'Failed to connect to Perplexity API' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Perplexity API' };
    }
  },

  // Test Fal.ai API
  fal_ai: async (apiKey: string) => {
    try {
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          image_size: 'square_hd',
          num_inference_steps: 1,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      // We don't want to actually generate an image for testing
      // Just check if the auth works
      if (response.status === 401 || response.status === 403) {
        return { success: false, message: 'Invalid API key' };
      }

      return { success: true, message: 'Fal.ai API connected successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to Fal.ai API' };
    }
  },

  // Test Buffer API
  buffer: async (apiKey: string) => {
    try {
      const response = await fetch('https://api.bufferapp.com/1/user.json', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Buffer connected as ${data.name || 'user'}` };
      } else {
        return { success: false, message: 'Invalid Buffer access token' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Buffer API' };
    }
  },

  // Test Telegram Bot Token
  telegram_bot_token: async (apiKey: string) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`);

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Telegram bot connected: @${data.result.username}` };
      } else {
        return { success: false, message: 'Invalid Telegram bot token' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Telegram API' };
    }
  },

  // Test Cloudinary (requires all three values)
  cloudinary_cloud_name: async (cloudName: string) => {
    // For cloud name, we just validate format
    if (/^[a-z0-9-]+$/.test(cloudName)) {
      return { success: true, message: 'Cloudinary cloud name format is valid' };
    }
    return { success: false, message: 'Invalid cloud name format' };
  },

  cloudinary_api_key: async (apiKey: string) => {
    if (/^\d+$/.test(apiKey)) {
      return { success: true, message: 'Cloudinary API key format is valid' };
    }
    return { success: false, message: 'Invalid API key format' };
  },

  cloudinary_api_secret: async (apiSecret: string) => {
    if (apiSecret.length > 10) {
      return { success: true, message: 'Cloudinary API secret format is valid' };
    }
    return { success: false, message: 'Invalid API secret format' };
  },

  // Test X Bearer Token
  x_bearer_token: async (apiKey: string) => {
    try {
      const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'X (Twitter) API connected successfully' };
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid Bearer token' };
      } else if (response.status === 403) {
        return { success: false, message: 'Bearer token valid but lacks required permissions' };
      } else {
        return { success: false, message: 'Failed to connect to X API' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to X API' };
    }
  },

  // Test Calendly API
  calendly: async (apiKey: string) => {
    try {
      const response = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Calendly connected as ${data.resource.name}` };
      } else {
        return { success: false, message: 'Invalid Calendly API key' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Calendly API' };
    }
  },
};

// ============================================
// POST /api/agents/api-keys/test
// Test an API key connection
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key_name, key_value, key_id } = body as {
      key_name?: ApiKeyName;
      key_value?: string;
      key_id?: string;
    };

    let actualKeyValue = key_value;
    let actualKeyName = key_name;

    // If key_id is provided, fetch the key from database
    if (key_id && !key_value) {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_name, key_value')
        .eq('id', key_id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 });
      }

      actualKeyValue = decryptApiKey(data.key_value);
      actualKeyName = data.key_name as ApiKeyName;
    }

    if (!actualKeyName || !actualKeyValue) {
      return NextResponse.json(
        { error: 'key_name and key_value (or key_id) are required' },
        { status: 400 }
      );
    }

    // Get the test function for this key type
    const testFn = testFunctions[actualKeyName];
    if (!testFn) {
      return NextResponse.json({
        success: true,
        message: 'API key saved (no automated test available for this type)',
      });
    }

    // Run the test
    const result = await testFn(actualKeyValue);

    // Update last_used_at if test was successful and we have a key_id
    if (result.success && key_id) {
      const supabase = createServerClient();
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', key_id);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API key test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}