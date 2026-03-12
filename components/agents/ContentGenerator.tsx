'use client';

// ============================================
// Content Generator Component
// components/agents/ContentGenerator.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Loader2,
  TrendingUp,
  Send,
  Image as ImageIcon,
  X,
  Check,
  Zap,
  FileText,
  Wand2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import ImageSelector from './ImageSelector';

interface Agent {
  id: string;
  name: string;
  niche: string;
}

interface GeneratedPost {
  id?: string;
  topic: string;
  x_content: string;
  linkedin_content: string;
  instagram_content?: string;
  image_url: string | null;
  image_prompt?: string;
  research_summary?: string;
}

interface Trend {
  topic: string;
  relevance_score: number;
  source: string;
}

export default function ContentGenerator() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Image options
  const [includeImage, setIncludeImage] = useState(true); // Toggle BEFORE generate
  const [showImageEditor, setShowImageEditor] = useState(false); // Show AFTER generate

  // Load agents on mount
  useEffect(() => {
    fetchAgents();
    // Load trends from localStorage
    const savedTrends = localStorage.getItem('wealthclaude_trends');
    if (savedTrends) {
      try {
        setTrends(JSON.parse(savedTrends));
      } catch { }
    }
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data || []);
        if (data.data?.length > 0) {
          setSelectedAgent(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const discoverTrends = async () => {
    if (!selectedAgent) {
      setError('Please select an agent first');
      return;
    }

    setLoadingTrends(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          action: 'discover_trends',
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.trends) {
        const newTrends = data.data.trends.map((topic: string, index: number) => ({
          topic,
          relevance_score: 100 - index * 10,
          source: 'Perplexity AI',
        }));
        setTrends(newTrends);
        localStorage.setItem('wealthclaude_trends', JSON.stringify(newTrends));
      } else {
        setError(data.error || 'Failed to discover trends');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to discover trends');
    } finally {
      setLoadingTrends(false);
    }
  };

  const generateContent = async () => {
    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPost(null);
    setShowImageEditor(false);

    try {
      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          topic: topic.trim(),
          action: 'generate',
          includeImage, // Pass the toggle value
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setGeneratedPost(data.data);
        setSuccess('Content generated successfully!');
      } else {
        setError(data.error || 'Failed to generate content');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (newImageUrl: string) => {
    if (generatedPost) {
      setGeneratedPost({ ...generatedPost, image_url: newImageUrl });

      // Update in database if post has ID
      if (generatedPost.id) {
        fetch('/api/agents/posts/regenerate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: generatedPost.id,
            image_url: newImageUrl,
          }),
        }).catch(console.error);
      }
    }
  };

  const addToQueue = async () => {
    if (!generatedPost) return;

    setSuccess('Post added to queue!');
    setGeneratedPost(null);
    setTopic('');
  };

  const selectTrend = (trend: Trend) => {
    setTopic(trend.topic);
  };

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Select Agent
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">Select an agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} - {agent.niche}
            </option>
          ))}
        </select>
      </div>

      {/* Trending Topics */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-medium text-white">Trending Topics</h3>
          </div>
          <button
            onClick={discoverTrends}
            disabled={loadingTrends || !selectedAgent}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sm text-zinc-300 rounded-lg flex items-center gap-1.5 transition-all"
          >
            {loadingTrends ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {trends.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trends.map((trend, index) => (
              <button
                key={index}
                onClick={() => selectTrend(trend)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-zinc-700 rounded-full text-sm text-zinc-300 hover:text-emerald-400 transition-all"
              >
                {trend.topic}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">
            Click "Refresh" to discover trending topics
          </p>
        )}
      </div>

      {/* Content Generation */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-medium text-white">Generate Content</h3>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic or select from trending..."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {/* Include Image Toggle (BEFORE generate) */}
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-300">Include AI Image</p>
              <p className="text-xs text-zinc-500">Generate image with content (slower)</p>
            </div>
          </div>
          <button
            onClick={() => setIncludeImage(!includeImage)}
            className="relative"
          >
            {includeImage ? (
              <ToggleRight className="w-10 h-10 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-zinc-500" />
            )}
          </button>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateContent}
          disabled={loading || !selectedAgent || !topic.trim()}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating{includeImage ? ' with image' : ''}...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {includeImage ? 'with Image' : 'Text Only'}
            </>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <X className="w-5 h-5 text-red-400" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300">{success}</p>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedPost && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Generated Content
            </h3>
            <button
              onClick={addToQueue}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" />
              Add to Queue
            </button>
          </div>

          {/* Image Section (AFTER generate) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Post Image</label>
              {!showImageEditor && (
                <button
                  onClick={() => setShowImageEditor(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {generatedPost.image_url ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Change Image
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3" />
                      Add Image
                    </>
                  )}
                </button>
              )}
            </div>

            {showImageEditor ? (
              <div className="space-y-2">
                <ImageSelector
                  imageUrl={generatedPost.image_url}
                  topic={generatedPost.topic}
                  onImageChange={handleImageChange}
                />
                <button
                  onClick={() => setShowImageEditor(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ← Done editing
                </button>
              </div>
            ) : generatedPost.image_url ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 group">
                <img
                  src={generatedPost.image_url}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setShowImageEditor(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowImageEditor(true)}
                className="w-full py-8 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-emerald-500" />
                <span className="text-sm text-zinc-500 group-hover:text-emerald-400">
                  Click to add image
                </span>
              </button>
            )}
          </div>

          {/* X Content */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">𝕏</span>
              <span className="text-sm font-medium text-zinc-300">Twitter/X</span>
              <span className="text-xs text-zinc-500">
                ({generatedPost.x_content?.length || 0}/280)
              </span>
            </div>
            <div className="p-3 bg-zinc-800 rounded-lg">
              <p className="text-zinc-200 text-sm whitespace-pre-wrap">
                {generatedPost.x_content}
              </p>
            </div>
          </div>

          {/* LinkedIn Content */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💼</span>
              <span className="text-sm font-medium text-zinc-300">LinkedIn</span>
            </div>
            <div className="p-3 bg-zinc-800 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-zinc-200 text-sm whitespace-pre-wrap">
                {generatedPost.linkedin_content}
              </p>
            </div>
          </div>

          {/* Research Summary (collapsible) */}
          {generatedPost.research_summary && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                View Research Summary
              </summary>
              <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-zinc-400 text-xs whitespace-pre-wrap">
                  {generatedPost.research_summary}
                </p>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
