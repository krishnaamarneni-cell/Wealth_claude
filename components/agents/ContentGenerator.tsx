'use client';

// ============================================
// Content Generator Component - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  Send,
  RefreshCw,
  Zap,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  niche: string | null;
}

interface GeneratedPost {
  id: string;
  topic: string;
  x_content: string;
  linkedin_content: string;
  instagram_content: string;
  image_url: string | null;
}

interface ContentGeneratorProps {
  onPostCreated?: () => void;
}

export default function ContentGenerator({ onPostCreated }: ContentGeneratorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [trends, setTrends] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);



  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
        if (data.data.length > 0) {
          setSelectedAgent(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const discoverTrends = async () => {
    if (!selectedAgent) return;

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

      if (data.success) {
        setTrends(data.data.trends || []);
      } else {
        setError(data.error || 'Failed to discover trends');
      }
    } catch (err) {
      setError('Failed to discover trends');
    } finally {
      setLoadingTrends(false);
    }
  };

  const generateContent = async (topicToUse?: string) => {
    const finalTopic = topicToUse || topic;
    if (!selectedAgent || !finalTopic) return;

    setGenerating(true);
    setError(null);
    setGeneratedPost(null);

    try {
      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          topic: finalTopic,
          action: 'generate',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPost(data.data.post);
        setTopic('');
        onPostCreated?.();
      } else {
        setError(data.error || 'Failed to generate content');
      }
    } catch (err) {
      setError('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Select Agent
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Choose an agent...</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name} {agent.niche ? `(${agent.niche})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Trending Topics */}
      {selectedAgent && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-300">Trending Now</span>
            </div>
            <button
              onClick={discoverTrends}
              disabled={loadingTrends}
              className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
            >
              {loadingTrends ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </button>
          </div>

          {loadingTrends ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : trends.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trends.map((trend, i) => (
                <button
                  key={i}
                  onClick={() => generateContent(trend)}
                  disabled={generating}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 text-amber-400" />
                  )}
                  {trend}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 text-center py-4">
              Click refresh to discover trending topics
            </p>
          )}
        </div>
      )}

      {/* Custom Topic */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Or enter a custom topic
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., AAPL earnings beat expectations"
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && topic) {
                generateContent();
              }
            }}
          />
          <button
            onClick={() => generateContent()}
            disabled={generating || !topic || !selectedAgent}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Generation Failed</p>
            <p className="text-sm text-red-300/70">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Post Preview */}
      {generatedPost && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">Post Generated!</span>
          </div>

          <div className="flex gap-4">
            {generatedPost.image_url && (
              <img
                src={generatedPost.image_url}
                alt=""
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white mb-1">{generatedPost.topic}</p>
              <p className="text-sm text-zinc-400 line-clamp-2">
                {generatedPost.x_content}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setGeneratedPost(null)}
              className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all text-sm"
            >
              Dismiss
            </button>
            <a
              href={`/agents/posts/${generatedPost.id}`}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              View & Publish
            </a>
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {generating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-zinc-700 rounded-full" />
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <div>
              <p className="font-medium text-white">Generating Content...</p>
              <p className="text-sm text-zinc-500">
                Researching → Writing → Creating Image
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Step label="Researching topic with Perplexity" done />
            <Step label="Generating platform content with Groq" active />
            <Step label="Creating visualization with Fal.ai" />
            <Step label="Uploading to Cloudinary" />
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500' : active ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-zinc-800'
        }`}>
        {done && <Check className="w-3 h-3 text-white" />}
        {active && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
      </div>
      <span className={`text-sm ${done ? 'text-emerald-400' : active ? 'text-white' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  );
}
