'use client';

// ============================================
// Agent Form Component - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  X,
  Sparkles,
  Clock,
  MessageSquare,
  Image,
  Zap,
  Target,
  Palette,
  Link2,
} from 'lucide-react';
import { Agent, AgentInsert, PostingStyle, TrendSource } from '@/types/database';
import SocialAccountsPanel from './SocialAccountsPanel';

interface AgentFormProps {
  agent?: Agent | null;
  onSave: (data: AgentInsert) => Promise<void>;
  onCancel: () => void;
}

// ============================================
// Options Configuration
// ============================================

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', desc: 'Formal & authoritative', emoji: '👔' },
  { value: 'casual', label: 'Casual', desc: 'Friendly & conversational', emoji: '😊' },
  { value: 'authoritative', label: 'Expert', desc: 'Confident & data-driven', emoji: '📊' },
  { value: 'educational', label: 'Educational', desc: 'Informative & clear', emoji: '📚' },
  { value: 'provocative', label: 'Bold', desc: 'Attention-grabbing', emoji: '🔥' },
];

const EMOJI_OPTIONS = [
  { value: 'none', label: 'None', desc: 'No emojis' },
  { value: 'minimal', label: 'Minimal', desc: '1-2 emojis' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 emojis' },
  { value: 'heavy', label: 'Heavy', desc: '5+ emojis' },
];

const HASHTAG_OPTIONS = [
  { value: 'none', label: 'None', desc: 'No hashtags' },
  { value: 'minimal', label: 'Minimal', desc: '1-2 tags' },
  { value: 'relevant', label: 'Relevant', desc: '3-5 tags' },
  { value: 'trending', label: 'Trending', desc: 'Include viral tags' },
];

const FREQUENCY_OPTIONS = [
  { value: 60, label: 'Every hour' },
  { value: 120, label: 'Every 2 hours' },
  { value: 180, label: 'Every 3 hours' },
  { value: 240, label: 'Every 4 hours' },
  { value: 360, label: 'Every 6 hours' },
  { value: 480, label: 'Every 8 hours' },
  { value: 720, label: 'Every 12 hours' },
  { value: 1440, label: 'Once daily' },
];

const TREND_SOURCE_OPTIONS: { value: TrendSource; label: string; desc: string; icon: string }[] = [
  { value: 'x_trending', label: 'X / Twitter', desc: 'Real-time trending topics', icon: '𝕏' },
  { value: 'perplexity', label: 'Perplexity AI', desc: 'AI-powered research', icon: '🔍' },
  { value: 'news_rss', label: 'News RSS', desc: 'Bloomberg, Reuters, etc.', icon: '📰' },
];

const DEFAULT_POSTING_STYLE: PostingStyle = {
  tone: 'professional',
  emoji_usage: 'moderate',
  hashtag_style: 'relevant',
  x_style: 'Short, punchy insights with hooks. Max 280 chars. Use 1-2 relevant hashtags.',
  linkedin_style: 'Professional, thoughtful analysis. 2-3 paragraphs. No emojis. Clear insights.',
  instagram_style: 'Visual-first caption. Engaging hook. Story-driven. 5-10 hashtags at end.',
};

// ============================================
// Main Form Component
// ============================================

export default function AgentForm({ agent, onSave, onCancel }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('basic');

  // Form state
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [niche, setNiche] = useState(agent?.niche || '');
  const [topicInstructions, setTopicInstructions] = useState(agent?.topic_instructions || '');
  const [postingStyle, setPostingStyle] = useState<PostingStyle>(agent?.posting_style || DEFAULT_POSTING_STYLE);
  const [imageStylePrompt, setImageStylePrompt] = useState(
    agent?.image_style_prompt ||
    'Professional finance data visualization, clean minimal design, green/dark color scheme, modern chart style, dark background'
  );
  const [postingFrequency, setPostingFrequency] = useState(agent?.posting_frequency_minutes || 120);
  const [trendSources, setTrendSources] = useState<TrendSource[]>(
    agent?.trend_sources || ['x_trending', 'perplexity', 'news_rss']
  );
  const [trendKeywords, setTrendKeywords] = useState(agent?.trend_keywords?.join(', ') || '');
  const [winningContentUrl, setWinningContentUrl] = useState(agent?.winning_content_folder_url || '');
  const [selectedSocialIds, setSelectedSocialIds] = useState<string[]>(agent?.social_account_ids || []);
  const [isAutoPosting, setIsAutoPosting] = useState(agent?.is_auto_posting ?? true);
  const [notifyOnTrendChange, setNotifyOnTrendChange] = useState(agent?.notify_on_trend_change ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: AgentInsert = {
        name,
        description: description || null,
        niche: niche || null,
        topic_instructions: topicInstructions,
        posting_style: postingStyle,
        image_style_prompt: imageStylePrompt,
        posting_frequency_minutes: postingFrequency,
        trend_sources: trendSources,
        trend_keywords: trendKeywords ? trendKeywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        winning_content_folder_url: winningContentUrl || null,
        social_account_ids: selectedSocialIds,
        is_auto_posting: isAutoPosting,
        notify_on_trend_change: notifyOnTrendChange,
        status: agent?.status || 'draft',
      };

      await onSave(data);
    } catch (error) {
      console.error('Error saving agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePostingStyle = (key: keyof PostingStyle, value: string) => {
    setPostingStyle(prev => ({ ...prev, [key]: value }));
  };

  const toggleTrendSource = (source: TrendSource) => {
    setTrendSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Bot },
    { id: 'accounts', label: 'Accounts', icon: Link2 },
    { id: 'style', label: 'Posting Style', icon: Palette },
    { id: 'platforms', label: 'Platform Copy', icon: MessageSquare },
    { id: 'image', label: 'Image Style', icon: Image },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {agent ? 'Edit Agent' : 'Create New Agent'}
                </h2>
                <p className="text-sm text-zinc-500">Configure your autonomous content creator</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 mt-5 overflow-x-auto pb-1 -mb-1">
            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSection === section.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <FormField label="Agent Name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Finance News Bot"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </FormField>

                <FormField label="Niche / Category">
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., Finance, AI Tools, Crypto, Tech"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </FormField>

                <FormField
                  label="Topic Instructions"
                  required
                  hint="Tell the agent exactly what to post about"
                >
                  <textarea
                    value={topicInstructions}
                    onChange={(e) => setTopicInstructions(e.target.value)}
                    placeholder="e.g., Focus on US stock market news, tech earnings reports, and Fed announcements. Avoid crypto and meme stocks. Emphasize actionable insights."
                    rows={5}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    required
                  />
                </FormField>

                <FormField label="Internal Notes" hint="Only visible to you">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes about this agent..."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </FormField>
              </div>
            )}

            {/* Accounts Section */}
            {activeSection === 'accounts' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <p className="text-sm text-zinc-400">
                  Select which social accounts this agent will post to.
                </p>
                <SocialAccountsPanel
                  selectedIds={selectedSocialIds}
                  onSelectionChange={setSelectedSocialIds}
                  selectable
                />
              </div>
            )}

            {/* Posting Style Section */}
            {activeSection === 'style' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <FormField label="Tone of Voice">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {TONE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePostingStyle('tone', option.value)}
                        className={`p-4 rounded-xl border text-center transition-all ${postingStyle.tone === option.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                          }`}
                      >
                        <span className="text-2xl mb-2 block">{option.emoji}</span>
                        <div className="font-medium text-white text-sm">{option.label}</div>
                        <div className="text-xs text-zinc-500">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Emoji Usage">
                    <div className="grid grid-cols-2 gap-2">
                      {EMOJI_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updatePostingStyle('emoji_usage', option.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${postingStyle.emoji_usage === option.value
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                          <div className="font-medium text-white text-sm">{option.label}</div>
                          <div className="text-xs text-zinc-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Hashtag Style">
                    <div className="grid grid-cols-2 gap-2">
                      {HASHTAG_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updatePostingStyle('hashtag_style', option.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${postingStyle.hashtag_style === option.value
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                          <div className="font-medium text-white text-sm">{option.label}</div>
                          <div className="text-xs text-zinc-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            {/* Platform Copy Section */}
            {activeSection === 'platforms' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <p className="text-sm text-zinc-400">
                  Customize how the AI writes for each platform.
                </p>

                <FormField label="X / Twitter Style" hint="280 char limit">
                  <textarea
                    value={postingStyle.x_style}
                    onChange={(e) => updatePostingStyle('x_style', e.target.value)}
                    placeholder="Short, punchy insights..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </FormField>

                <FormField label="LinkedIn Style" hint="Professional audience">
                  <textarea
                    value={postingStyle.linkedin_style}
                    onChange={(e) => updatePostingStyle('linkedin_style', e.target.value)}
                    placeholder="Professional, thoughtful analysis..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </FormField>

                <FormField label="Instagram Style" hint="Visual-first">
                  <textarea
                    value={postingStyle.instagram_style}
                    onChange={(e) => updatePostingStyle('instagram_style', e.target.value)}
                    placeholder="Engaging caption with hashtags..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </FormField>
              </div>
            )}

            {/* Image Style Section */}
            {activeSection === 'image' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <FormField
                  label="Image Generation Prompt"
                  hint="Used for Fal.ai Flux image generation"
                >
                  <textarea
                    value={imageStylePrompt}
                    onChange={(e) => setImageStylePrompt(e.target.value)}
                    placeholder="Professional finance data visualization..."
                    rows={4}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                  />
                </FormField>

                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">💡 Tips:</h4>
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• Include color scheme (e.g., "green/dark", "minimal")</li>
                    <li>• Specify chart types (e.g., "line chart", "candlestick")</li>
                    <li>• Add style keywords (e.g., "professional", "modern")</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Schedule Section */}
            {activeSection === 'schedule' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <FormField label="Posting Frequency">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FREQUENCY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPostingFrequency(option.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${postingFrequency === option.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        <div className="font-medium text-white text-sm">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Trend Sources" hint="Where to find content ideas">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TREND_SOURCE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleTrendSource(option.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${trendSources.includes(option.value)
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{option.icon}</span>
                          <div>
                            <div className="font-medium text-white text-sm">{option.label}</div>
                            <div className="text-xs text-zinc-500">{option.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Trend Keywords" hint="Comma-separated filter">
                  <input
                    type="text"
                    value={trendKeywords}
                    onChange={(e) => setTrendKeywords(e.target.value)}
                    placeholder="e.g., AAPL, earnings, Fed, inflation"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </FormField>
              </div>
            )}

            {/* Advanced Section */}
            {activeSection === 'advanced' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <FormField label="Winning Content Folder" hint="Google Drive URL for RAG">
                  <input
                    type="url"
                    value={winningContentUrl}
                    onChange={(e) => setWinningContentUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </FormField>

                <div className="space-y-4">
                  <ToggleOption
                    label="Auto-Posting"
                    description="Agent posts automatically without approval"
                    checked={isAutoPosting}
                    onChange={setIsAutoPosting}
                  />
                  <ToggleOption
                    label="Trend Change Notifications"
                    description="Get notified via Telegram when new trends detected"
                    checked={notifyOnTrendChange}
                    onChange={setNotifyOnTrendChange}
                  />
                </div>
              </div>
            )}

          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {selectedSocialIds.length} account{selectedSocialIds.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {agent ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function FormField({
  label,
  required,
  hint,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
        {required && <span className="text-emerald-400 ml-1">*</span>}
        {hint && <span className="text-zinc-600 font-normal ml-2">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'
        }`}
      onClick={() => onChange(!checked)}
    >
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="text-sm text-zinc-500">{description}</div>
      </div>
      <div className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${checked ? 'bg-emerald-500' : 'bg-zinc-700'
        }`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
          }`} />
      </div>
    </div>
  );
}
