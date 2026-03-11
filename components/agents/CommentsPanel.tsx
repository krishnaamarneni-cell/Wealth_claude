'use client';

// ============================================
// Comments Panel - WealthClaude Style
// components/agents/CommentsPanel.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  Clock,
  Bot,
} from 'lucide-react';

interface Comment {
  id: string;
  platform: 'x' | 'linkedin';
  content: string;
  author_name: string | null;
  author_handle: string | null;
  author_avatar_url: string | null;
  replied: boolean;
  reply_content: string | null;
  auto_replied: boolean;
  created_at: string;
  posts?: {
    topic: string;
    agents?: {
      name: string;
    };
  };
}

const PLATFORM_CONFIG = {
  x: { name: 'X', icon: '𝕏', color: 'bg-zinc-800' },
  linkedin: { name: 'LinkedIn', icon: 'in', color: 'bg-[#0A66C2]' },
};

export default function CommentsPanel() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'pending') params.set('replied', 'false');
      if (filter === 'replied') params.set('replied', 'true');

      const response = await fetch(`/api/agents/comments?${params}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewComments = async () => {
    setFetching(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch' }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchComments();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch new comments');
    } finally {
      setFetching(false);
    }
  };

  const generateReply = async (commentId: string) => {
    setGeneratingReply(commentId);
    setError(null);

    try {
      const response = await fetch('/api/agents/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_reply', comment_id: commentId }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyText(data.data.reply);
        setReplyingTo(commentId);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to generate reply');
    } finally {
      setGeneratingReply(null);
    }
  };

  const sendReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setSendingReply(commentId);
    setError(null);

    try {
      const response = await fetch('/api/agents/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          comment_id: commentId,
          reply_text: replyText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyingTo(null);
        setReplyText('');
        await fetchComments();
      } else {
        setError(data.error || data.message);
      }
    } catch (err) {
      setError('Failed to send reply');
    } finally {
      setSendingReply(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Comments</h3>
          <span className="text-sm text-zinc-500">
            {comments.length} {filter === 'pending' ? 'pending' : filter === 'replied' ? 'replied' : 'total'}
          </span>
        </div>
        <button
          onClick={fetchNewComments}
          disabled={fetching}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all"
        >
          {fetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Fetch New
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'replied', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${filter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {comments.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
          <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-zinc-300 font-medium mb-1">No comments</h4>
          <p className="text-sm text-zinc-500">
            {filter === 'pending' ? 'All caught up!' : 'Click "Fetch New" to check for comments'}
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map(comment => {
          const config = PLATFORM_CONFIG[comment.platform];
          const isReplying = replyingTo === comment.id;
          const isGenerating = generatingReply === comment.id;
          const isSending = sendingReply === comment.id;

          return (
            <div
              key={comment.id}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3"
            >
              {/* Comment Header */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {comment.author_avatar_url ? (
                  <img
                    src={comment.author_avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white font-bold`}>
                    {config.icon}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">
                      {comment.author_name || comment.author_handle || 'Unknown'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${config.color} text-white`}>
                      {config.name}
                    </span>
                    {comment.replied && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Replied
                        {comment.auto_replied && <Bot className="w-3 h-3" />}
                      </span>
                    )}
                    <span className="text-xs text-zinc-600">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-zinc-300 mt-1">{comment.content}</p>
                  {comment.posts && (
                    <p className="text-xs text-zinc-600 mt-1">
                      On: {comment.posts.topic} • {comment.posts.agents?.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Reply Section */}
              {comment.replied && comment.reply_content ? (
                <div className="ml-13 pl-4 border-l-2 border-emerald-500/30">
                  <p className="text-sm text-zinc-400">{comment.reply_content}</p>
                </div>
              ) : (
                <>
                  {isReplying ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => sendReply(comment.id)}
                          disabled={isSending || !replyText.trim()}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm rounded-lg flex items-center gap-1.5"
                        >
                          {isSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateReply(comment.id)}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        AI Reply
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Manual Reply
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
