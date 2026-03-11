// ============================================
// Encryption Utilities for API Keys
// ============================================

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 */
const getEncryptionKey = (): string => {
  const key = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is not set');
  }
  return key;
};

/**
 * Derive a key from the secret using PBKDF2
 */
const deriveKey = (secret: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt an API key
 * Returns a string in format: salt:iv:tag:encrypted
 */
export const encryptApiKey = (plaintext: string): string => {
  const secret = getEncryptionKey();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret
  const key = deriveKey(secret, salt);

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Combine all parts
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
};

/**
 * Decrypt an API key
 */
export const decryptApiKey = (encryptedData: string): string => {
  const secret = getEncryptionKey();

  // Split the encrypted data
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [saltHex, ivHex, tagHex, encryptedHex] = parts;

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  // Derive key from secret
  const key = deriveKey(secret, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
export const maskApiKey = (key: string): string => {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
};

/**
 * Validate API key format for different services
 */
export const validateApiKeyFormat = (keyName: string, keyValue: string): boolean => {
  const patterns: Record<string, RegExp> = {
    groq: /^gsk_[a-zA-Z0-9]{48,}$/,
    perplexity: /^pplx-[a-zA-Z0-9]{48,}$/,
    fal_ai: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:[a-zA-Z0-9]+$/,
    buffer: /^[0-9]\/[a-f0-9]+$/,
    telegram_bot_token: /^\d+:[A-Za-z0-9_-]+$/,
    cloudinary_cloud_name: /^[a-z0-9-]+$/,
    cloudinary_api_key: /^\d+$/,
    cloudinary_api_secret: /^[a-zA-Z0-9_-]+$/,
    x_bearer_token: /^[A-Za-z0-9%]+$/,
  };

  // If we have a pattern for this key type, validate it
  if (patterns[keyName]) {
    return patterns[keyName].test(keyValue);
  }

  // For unknown key types, just check it's not empty
  return keyValue.length > 0;
};

/**
 * Get display name for API key types
 */
export const getApiKeyDisplayName = (keyName: string): string => {
  const displayNames: Record<string, string> = {
    groq: 'Groq API',
    perplexity: 'Perplexity API',
    fal_ai: 'Fal.ai (Flux)',
    buffer: 'Buffer',
    telegram_bot_token: 'Telegram Bot Token',
    cloudinary_cloud_name: 'Cloudinary Cloud Name',
    cloudinary_api_key: 'Cloudinary API Key',
    cloudinary_api_secret: 'Cloudinary API Secret',
    google_drive: 'Google Drive',
    gmail: 'Gmail',
    calendly: 'Calendly',
    x_bearer_token: 'X (Twitter) Bearer Token',
  };

  return displayNames[keyName] || keyName;
};

/**
 * Get all supported API key types with metadata
 */
export const getApiKeyTypes = () => [
  {
    name: 'groq',
    displayName: 'Groq API',
    description: 'For AI content generation',
    required: true,
    placeholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity API',
    description: 'For web research and trend analysis',
    required: true,
    placeholder: 'pplx-...',
    helpUrl: 'https://www.perplexity.ai/settings/api',
  },
  {
    name: 'fal_ai',
    displayName: 'Fal.ai (Flux)',
    description: 'For image generation',
    required: true,
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxx',
    helpUrl: 'https://fal.ai/dashboard/keys',
  },
  {
    name: 'buffer',
    displayName: 'Buffer Access Token',
    description: 'For social media posting',
    required: true,
    placeholder: '1/xxxxxxxxxx',
    helpUrl: 'https://buffer.com/developers/api',
  },
  {
    name: 'telegram_bot_token',
    displayName: 'Telegram Bot Token',
    description: 'For Telegram bot commands',
    required: false,
    placeholder: '123456789:ABCdef...',
    helpUrl: 'https://core.telegram.org/bots#botfather',
  },
  {
    name: 'cloudinary_cloud_name',
    displayName: 'Cloudinary Cloud Name',
    description: 'For image hosting',
    required: true,
    placeholder: 'your-cloud-name',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'cloudinary_api_key',
    displayName: 'Cloudinary API Key',
    description: 'For image hosting',
    required: true,
    placeholder: '123456789012345',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'cloudinary_api_secret',
    displayName: 'Cloudinary API Secret',
    description: 'For image hosting',
    required: true,
    placeholder: 'xxxxxxxxxxxxxx',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'google_drive',
    displayName: 'Google Drive',
    description: 'For winning content RAG',
    required: false,
    placeholder: 'OAuth token (use connect button)',
    helpUrl: null,
    isOAuth: true,
  },
  {
    name: 'gmail',
    displayName: 'Gmail',
    description: 'For email management',
    required: false,
    placeholder: 'OAuth token (use connect button)',
    helpUrl: null,
    isOAuth: true,
  },
  {
    name: 'calendly',
    displayName: 'Calendly',
    description: 'For meeting scheduling',
    required: false,
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    helpUrl: 'https://calendly.com/integrations/api_webhooks',
  },
  {
    name: 'x_bearer_token',
    displayName: 'X (Twitter) Bearer Token',
    description: 'For trending topics API',
    required: false,
    placeholder: 'AAAAAAAAAAAAAAAAAAAAAx...',
    helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
];