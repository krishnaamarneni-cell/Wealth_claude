// ============================================
// Fal.ai Service - Image Generation (Flux)
// ============================================

import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';

export interface ImageGenerationResult {
  imageUrl: string;
  seed: number;
  prompt: string;
}

/**
 * Get Fal.ai API key for user (global or agent-specific)
 */
export async function getFalKey(userId: string, agentId?: string): Promise<string | null> {
  const supabase = await createClient();

  // Try agent-specific key first
  if (agentId) {
    const { data: agentKey } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_name', 'fal_ai')
      .eq('agent_id', agentId)
      .single();

    if (agentKey) {
      return decryptApiKey(agentKey.key_value);
    }
  }

  // Fall back to global key
  const { data: globalKey } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('user_id', userId)
    .eq('key_name', 'fal_ai')
    .is('agent_id', null)
    .single();

  if (globalKey) {
    return decryptApiKey(globalKey.key_value);
  }

  return null;
}

/**
 * Generate image using Fal.ai Flux
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    numImages?: number;
  }
): Promise<ImageGenerationResult> {
  const { aspectRatio = '1:1', numImages = 1 } = options || {};

  // Map aspect ratio to image size
  const sizeMap: Record<string, string> = {
    '1:1': 'square_hd',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3',
  };

  const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: sizeMap[aspectRatio] || 'square_hd',
      num_inference_steps: 4, // Schnell is optimized for 4 steps
      num_images: numImages,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fal.ai API error: ${error}`);
  }

  const data = await response.json();

  if (!data.images || data.images.length === 0) {
    throw new Error('No images generated');
  }

  return {
    imageUrl: data.images[0].url,
    seed: data.seed || 0,
    prompt,
  };
}

/**
 * Generate image with Flux Pro (higher quality, slower)
 */
export async function generateImagePro(
  apiKey: string,
  prompt: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    guidanceScale?: number;
  }
): Promise<ImageGenerationResult> {
  const { aspectRatio = '1:1', guidanceScale = 3.5 } = options || {};

  const sizeMap: Record<string, string> = {
    '1:1': 'square_hd',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3',
  };

  const response = await fetch('https://fal.run/fal-ai/flux-pro', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: sizeMap[aspectRatio] || 'square_hd',
      num_inference_steps: 28,
      guidance_scale: guidanceScale,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fal.ai API error: ${error}`);
  }

  const data = await response.json();

  if (!data.images || data.images.length === 0) {
    throw new Error('No images generated');
  }

  return {
    imageUrl: data.images[0].url,
    seed: data.seed || 0,
    prompt,
  };
}

/**
 * Upload image to Cloudinary for permanent hosting
 */
export async function uploadToCloudinary(
  imageUrl: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  folder?: string
): Promise<string> {
  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = folder
    ? `folder=${folder}&timestamp=${timestamp}`
    : `timestamp=${timestamp}`;

  // Create signature using crypto
  const crypto = require('crypto');
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  if (folder) formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload error: ${error}`);
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Get Cloudinary credentials for user
 */
export async function getCloudinaryCredentials(userId: string): Promise<{
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null> {
  const supabase = await createClient();

  const { data: keys } = await supabase
    .from('api_keys')
    .select('key_name, key_value')
    .eq('user_id', userId)
    .in('key_name', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'])
    .is('agent_id', null);

  if (!keys || keys.length < 3) {
    return null;
  }

  const keyMap: Record<string, string> = {};
  for (const key of keys) {
    keyMap[key.key_name] = decryptApiKey(key.key_value);
  }

  if (!keyMap.cloudinary_cloud_name || !keyMap.cloudinary_api_key || !keyMap.cloudinary_api_secret) {
    return null;
  }

  return {
    cloudName: keyMap.cloudinary_cloud_name,
    apiKey: keyMap.cloudinary_api_key,
    apiSecret: keyMap.cloudinary_api_secret,
  };
}