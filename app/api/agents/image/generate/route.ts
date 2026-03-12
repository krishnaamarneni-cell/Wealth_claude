// ============================================
// Image Generation API with Provider Selection
// app/api/agents/image/generate/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';

// ============================================
// POST - Generate image with specific provider
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, provider = 'ai' } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    let imageUrl: string | null = null;
    let usedProvider: string = provider;

    const enhancedPrompt = `Professional visual for: ${topic}. High quality, modern design, suitable for social media.`;

    switch (provider) {
      case 'ai':
        // Try Fal.ai first, then Pollinations
        imageUrl = await tryFalAi(user.id, enhancedPrompt, supabase);
        if (!imageUrl) {
          imageUrl = await tryPollinations(enhancedPrompt);
          usedProvider = 'pollinations';
        }
        break;

      case 'unsplash':
        imageUrl = await tryUnsplash(topic);
        break;

      case 'pexels':
        imageUrl = await tryPexels(topic);
        break;

      default:
        // Default to AI
        imageUrl = await tryPollinations(enhancedPrompt);
        usedProvider = 'pollinations';
    }

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate image from all providers'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      provider: usedProvider,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// Provider Functions
// ============================================

async function tryFalAi(userId: string, prompt: string, supabase: any): Promise<string | null> {
  try {
    // Get Fal.ai key from database
    const { data } = await supabase
      .from('api_keys')
      .select('encrypted_value')
      .eq('user_id', userId)
      .eq('key_type', 'fal_ai')
      .single();

    if (!data?.encrypted_value) return null;

    const { decrypt } = await import('@/lib/encryption');
    const apiKey = decrypt(data.encrypted_value);

    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_images: 1,
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.images?.[0]?.url || null;
  } catch {
    return null;
  }
}

async function tryPollinations(prompt: string): Promise<string | null> {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=675&nologo=true`;

    // Verify image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) return null;

    return imageUrl;
  } catch {
    return null;
  }
}

async function tryUnsplash(query: string): Promise<string | null> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    const searchQuery = extractKeywords(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: { 'Authorization': `Client-ID ${accessKey}` },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

async function tryPexels(query: string): Promise<string | null> {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const searchQuery = extractKeywords(query);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: { 'Authorization': apiKey },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

function extractKeywords(text: string): string {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'about', 'create', 'post', 'generate'];

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  return words.slice(0, 5).join(' ');
}