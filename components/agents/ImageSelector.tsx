'use client';

// ============================================
// Image Selector Component
// components/agents/ImageSelector.tsx
// ============================================

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  Check,
  X,
  Sparkles,
  Camera,
  Palette,
} from 'lucide-react';

interface ImageSelectorProps {
  imageUrl: string | null;
  topic: string;
  onImageChange: (newUrl: string) => void;
  disabled?: boolean;
}

const IMAGE_PROVIDERS = [
  { id: 'ai', name: 'AI Generated', icon: Sparkles, description: 'Fal.ai / Pollinations' },
  { id: 'unsplash', name: 'Unsplash', icon: Camera, description: 'Stock photos' },
  { id: 'pexels', name: 'Pexels', icon: Palette, description: 'Stock photos' },
];

export default function ImageSelector({
  imageUrl,
  topic,
  onImageChange,
  disabled = false,
}: ImageSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('ai');
  const [error, setError] = useState<string | null>(null);
  const [showProviders, setShowProviders] = useState(false);

  const regenerateImage = async (provider?: string) => {
    if (!topic) {
      setError('No topic provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          provider: provider || selectedProvider,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        onImageChange(data.url);
        setShowProviders(false);
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">Post Image</label>
        {imageUrl && (
          <button
            onClick={() => setShowProviders(!showProviders)}
            disabled={disabled || loading}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Change Image
          </button>
        )}
      </div>

      {/* Image Preview */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <span className="text-sm text-zinc-400">Generating image...</span>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <button
                  onClick={() => regenerateImage()}
                  disabled={disabled}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={() => setShowProviders(true)}
                  disabled={disabled}
                  className="py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <ImageIcon className="w-10 h-10 text-zinc-600" />
            <span className="text-sm text-zinc-500">No image generated</span>
            <button
              onClick={() => regenerateImage()}
              disabled={disabled || !topic}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate Image
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Provider Selector */}
      {showProviders && (
        <div className="p-3 bg-zinc-900/80 border border-zinc-700 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Select Source</span>
            <button
              onClick={() => setShowProviders(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-2">
            {IMAGE_PROVIDERS.map(provider => {
              const Icon = provider.icon;
              const isSelected = selectedProvider === provider.id;

              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    regenerateImage(provider.id);
                  }}
                  disabled={loading}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                    ${isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-emerald-500/20' : 'bg-zinc-700'}
                  `}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {provider.name}
                    </p>
                    <p className="text-xs text-zinc-500">{provider.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
