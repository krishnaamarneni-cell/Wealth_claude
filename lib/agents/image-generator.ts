// ============================================
// Image Generation Service with Fallback Chain
// lib/agents/image-generator.ts
// ============================================

import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';

export interface ImageResult {
  success: boolean;
  url?: string;
  provider?: string;
  error?: string;
}

// ============================================
// Main Function - Fallback Chain
// ============================================

/**
 * Generate image with automatic fallback chain:
 * 1. Fal.ai (Flux Schnell) - Best quality
 * 2. Pollinations.ai - Free, no key
 * 3. Hugging Face - Free tier
 * 4. Unsplash - Stock photos
 * 5. Pexels - Stock photos
 * 6. Pixabay - Stock photos (unlimited)
 */
export async function generateImage(
  userId: string,
  prompt: string,
  options?: {
    preferStock?: boolean;
    skipAI?: boolean;
  }
): Promise<ImageResult> {
  console.log(`[ImageGen] Starting generation for: "${prompt.substring(0, 50)}..."`);

  // If preferStock or skipAI, go straight to stock photos
  if (options?.preferStock || options?.skipAI) {
    return await tryStockPhotos(prompt);
  }

  // Try AI generators first
  const aiProviders = [
    { name: 'fal.ai', fn: () => tryFalAI(userId, prompt) },
    { name: 'pollinations', fn: () => tryPollinations(prompt) },
    { name: 'huggingface', fn: () => tryHuggingFace(userId, prompt) },
  ];

  for (const provider of aiProviders) {
    console.log(`[ImageGen] Trying ${provider.name}...`);
    const result = await provider.fn();
    if (result.success) {
      console.log(`[ImageGen] ✅ Success with ${provider.name}`);
      return result;
    }
    console.log(`[ImageGen] ❌ ${provider.name} failed: ${result.error}`);
  }

  // Fallback to stock photos
  console.log('[ImageGen] AI generators failed, trying stock photos...');
  return await tryStockPhotos(prompt);
}

// ============================================
// AI Image Generators
// ============================================

/**
 * Fal.ai - Flux Schnell (Primary)
 */
async function tryFalAI(userId: string, prompt: string): Promise<ImageResult> {
  try {
    const apiKey = await getApiKey(userId, 'fal_ai');
    if (!apiKey) {
      return { success: false, error: 'No Fal.ai API key configured' };
    }

    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancePrompt(prompt),
        image_size: 'landscape_16_9',
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Fal.ai error: ${error}` };
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      return { success: false, error: 'No image returned from Fal.ai' };
    }

    return { success: true, url: imageUrl, provider: 'fal.ai' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pollinations.ai - 100% Free, no API key
 */
async function tryPollinations(prompt: string): Promise<ImageResult> {
  try {
    const enhancedPrompt = enhancePrompt(prompt);
    const encodedPrompt = encodeURIComponent(enhancedPrompt);

    // Pollinations generates image on-the-fly via URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=675&nologo=true`;

    // Verify the image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });

    if (!response.ok) {
      return { success: false, error: 'Pollinations image generation failed' };
    }

    return { success: true, url: imageUrl, provider: 'pollinations.ai' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Hugging Face - Inference API (Free tier)
 */
async function tryHuggingFace(userId: string, prompt: string): Promise<ImageResult> {
  try {
    const apiKey = await getApiKey(userId, 'huggingface');
    if (!apiKey) {
      // Try without API key (limited)
      return await tryHuggingFaceFree(prompt);
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancePrompt(prompt),
          parameters: {
            width: 1200,
            height: 675,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HuggingFace error: ${error}` };
    }

    // Response is binary image data
    const blob = await response.blob();

    // Upload to Cloudinary or return as base64
    const base64 = await blobToBase64(blob);
    const cloudinaryUrl = await uploadToCloudinary(userId, base64);

    if (cloudinaryUrl) {
      return { success: true, url: cloudinaryUrl, provider: 'huggingface' };
    }

    return { success: false, error: 'Failed to upload HuggingFace image' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Hugging Face - Free tier without API key
 */
async function tryHuggingFaceFree(prompt: string): Promise<ImageResult> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancePrompt(prompt),
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: 'HuggingFace free tier rate limited' };
    }

    const blob = await response.blob();
    const base64 = `data:image/jpeg;base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;

    // For free tier, return base64 directly (no Cloudinary upload)
    return { success: true, url: base64, provider: 'huggingface-free' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Stock Photo Providers
// ============================================

/**
 * Try all stock photo providers in order
 */
async function tryStockPhotos(query: string): Promise<ImageResult> {
  const stockProviders = [
    { name: 'unsplash', fn: () => tryUnsplash(query) },
    { name: 'pexels', fn: () => tryPexels(query) },
    { name: 'pixabay', fn: () => tryPixabay(query) },
  ];

  for (const provider of stockProviders) {
    console.log(`[ImageGen] Trying stock: ${provider.name}...`);
    const result = await provider.fn();
    if (result.success) {
      console.log(`[ImageGen] ✅ Success with ${provider.name}`);
      return result;
    }
    console.log(`[ImageGen] ❌ ${provider.name} failed: ${result.error}`);
  }

  return { success: false, error: 'All image providers failed' };
}

/**
 * Unsplash - 50 requests/hour free
 */
async function tryUnsplash(query: string): Promise<ImageResult> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return { success: false, error: 'No Unsplash API key configured' };
    }

    const searchQuery = extractKeywords(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: 'Unsplash API error' };
    }

    const data = await response.json();
    const photo = data.results?.[0];

    if (!photo) {
      return { success: false, error: 'No Unsplash results found' };
    }

    return {
      success: true,
      url: photo.urls.regular,
      provider: 'unsplash'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pexels - 200 requests/hour free
 */
async function tryPexels(query: string): Promise<ImageResult> {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'No Pexels API key configured' };
    }

    const searchQuery = extractKeywords(query);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: 'Pexels API error' };
    }

    const data = await response.json();
    const photo = data.photos?.[0];

    if (!photo) {
      return { success: false, error: 'No Pexels results found' };
    }

    return {
      success: true,
      url: photo.src.large,
      provider: 'pexels'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pixabay - Unlimited free
 */
async function tryPixabay(query: string): Promise<ImageResult> {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'No Pixabay API key configured' };
    }

    const searchQuery = extractKeywords(query);
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&per_page=3&orientation=horizontal&image_type=photo`
    );

    if (!response.ok) {
      return { success: false, error: 'Pixabay API error' };
    }

    const data = await response.json();
    const photo = data.hits?.[0];

    if (!photo) {
      return { success: false, error: 'No Pixabay results found' };
    }

    return {
      success: true,
      url: photo.largeImageURL,
      provider: 'pixabay'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get API key from database
 */
async function getApiKey(userId: string, keyType: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data } = await supabase
      .from('api_keys')
      .select('encrypted_value')
      .eq('user_id', userId)
      .eq('key_type', keyType)
      .single();

    if (!data?.encrypted_value) return null;

    return decrypt(data.encrypted_value);
  } catch {
    return null;
  }
}

/**
 * Enhance prompt for better AI image results
 */
function enhancePrompt(prompt: string): string {
  const style = 'professional, high quality, detailed, modern design, clean composition';
  return `${prompt}, ${style}`;
}

/**
 * Extract keywords for stock photo search
 */
function extractKeywords(text: string): string {
  // Remove common words and keep meaningful keywords
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'];

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  return words.slice(0, 5).join(' ');
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Upload base64 image to Cloudinary
 */
async function uploadToCloudinary(userId: string, base64: string): Promise<string | null> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || await getApiKey(userId, 'cloudinary_cloud_name');
    const apiKey = process.env.CLOUDINARY_API_KEY || await getApiKey(userId, 'cloudinary_api_key');
    const apiSecret = process.env.CLOUDINARY_API_SECRET || await getApiKey(userId, 'cloudinary_api_secret');

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = require('crypto')
      .createHash('sha1')
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.secure_url;
  } catch {
    return null;
  }
}

// ============================================
// Test Function
// ============================================

export async function testImageProviders(userId: string): Promise<{
  provider: string;
  status: 'ok' | 'error';
  message: string;
}[]> {
  const results = [];

  // Test Fal.ai
  const falKey = await getApiKey(userId, 'fal_ai');
  results.push({
    provider: 'Fal.ai',
    status: falKey ? 'ok' : 'error',
    message: falKey ? 'API key configured' : 'No API key',
  });

  // Test Pollinations (always available)
  results.push({
    provider: 'Pollinations.ai',
    status: 'ok',
    message: 'Free, no API key needed',
  });

  // Test HuggingFace
  const hfKey = await getApiKey(userId, 'huggingface');
  results.push({
    provider: 'Hugging Face',
    status: 'ok',
    message: hfKey ? 'API key configured' : 'Using free tier',
  });

  // Test Unsplash
  results.push({
    provider: 'Unsplash',
    status: process.env.UNSPLASH_ACCESS_KEY ? 'ok' : 'error',
    message: process.env.UNSPLASH_ACCESS_KEY ? 'Configured' : 'Add UNSPLASH_ACCESS_KEY to env',
  });

  // Test Pexels
  results.push({
    provider: 'Pexels',
    status: process.env.PEXELS_API_KEY ? 'ok' : 'error',
    message: process.env.PEXELS_API_KEY ? 'Configured' : 'Add PEXELS_API_KEY to env',
  });

  // Test Pixabay
  results.push({
    provider: 'Pixabay',
    status: process.env.PIXABAY_API_KEY ? 'ok' : 'error',
    message: process.env.PIXABAY_API_KEY ? 'Configured' : 'Add PIXABAY_API_KEY to env',
  });

  return results;
}