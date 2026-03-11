'use client';

// ============================================
// Post Queue Component - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  Image as ImageIcon,
  Play,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface Post {
  id: string;
  agent_id: string;
  topic: string | null;
  x_content: string | null;
  linkedin_content: string | null;
  instagram_content: string | null;
  image_url: string | null;
  status: 'draft' | 'scheduled' | 'posted' | 'failed' | 'cancelled';
  scheduled_for: string | null;
  posted_at: string | null;
  created_at: string;
  agents?: {
    name: string;
    niche: string | null;
  };
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-zinc-500', textColor: 'text-zinc-400' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-500', textColor: 'text-amber-400' },
  posted: { label: 'Posted', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  failed: { label: 'Failed', color: 'bg-red-500', textColor: 'text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-600', textColor: 'text-zinc-500' },
};

interface PostQueueProps {
  agentId?: string;
  showHistory?: boolean;
}

export default function PostQueue({ agentId, showHistory = false }: PostQueueProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts();
  }, [agentId, showHistory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (agentId) params.set('agent_id', agentId);
      if (!showHistory) params.set('status', 'queue');
      params.set('limit', '50');

      const response = await fetch(`/api/agents/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (postId: string, action: string, payload?: any) => {
    setActionLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch('/api/agents/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action, ...payload }),
      });

      const data = await response.json();
      console.log('[v0] Post action response:', { postId, action, data });

      if (data.success) {
        await fetchPosts();
      } else {
        const errorMsg = data.error || data.message || 'Action failed';
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      console.error('[v0] Post action error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Action failed';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;

    setActionLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch(`/api/agents/posts?id=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (err) {
      alert('Delete failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: false }));
    }
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
        <div>
          <h3 className="text-lg font-semibold text-white">
            {showHistory ? 'Post History' : 'Post Queue'}
          </h3>
          <p className="text-sm text-zinc-500">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-zinc-300 font-medium mb-1">No posts in queue</h4>
          <p className="text-sm text-zinc-500">
            Generate content to add posts to the queue
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map(post => {
          const isExpanded = expandedPost === post.id;
          const isLoading = actionLoading[post.id];
          const statusConfig = STATUS_CONFIG[post.status];

          return (
            <div
              key={post.id}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Image Thumbnail */}
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}/20 ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                      {post.agents && (
                        <span className="text-xs text-zinc-500">
                          {post.agents.name}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium truncate">
                      {post.topic || 'Untitled Post'}
                    </p>
                    <p className="text-sm text-zinc-500 line-clamp-1">
                      {post.x_content || post.linkedin_content || 'No content'}
                    </p>
                    {post.scheduled_for && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.scheduled_for).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleAction(post.id, 'publish_now')}
                        disabled={isLoading}
                        className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50"
                        title="Publish Now"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {post.status === 'scheduled' && (
                      <button
                        onClick={() => handleAction(post.id, 'cancel')}
                        disabled={isLoading}
                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={isLoading}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-zinc-800 mt-2 pt-4">
                  {/* Platform Content */}
                  <div className="grid gap-4">
                    {post.x_content && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-zinc-400">𝕏 Twitter</span>
                          <span className="text-xs text-zinc-600">
                            {post.x_content.length}/280
                          </span>
                        </div>
                        <p className="text-sm text-white bg-zinc-800/50 rounded-lg p-3">
                          {post.x_content}
                        </p>
                      </div>
                    )}
                    {post.linkedin_content && (
                      <div>
                        <span className="text-xs font-medium text-zinc-400 mb-2 block">LinkedIn</span>
                        <p className="text-sm text-white bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">
                          {post.linkedin_content}
                        </p>
                      </div>
                    )}
                    {post.instagram_content && (
                      <div>
                        <span className="text-xs font-medium text-zinc-400 mb-2 block">Instagram</span>
                        <p className="text-sm text-white bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">
                          {post.instagram_content}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-600">
                      Created {new Date(post.created_at).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {post.status === 'draft' && (
                        <>
                          <button
                            onClick={() => {
                              const date = prompt('Schedule for (YYYY-MM-DD HH:MM):');
                              if (date) {
                                handleAction(post.id, 'schedule', {
                                  scheduled_for: new Date(date).toISOString()
                                });
                              }
                            }}
                            className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                          </button>
                          <button
                            onClick={() => handleAction(post.id, 'publish_now')}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Publish Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
