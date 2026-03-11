'use client';

// ============================================
// Agent Card Component - Display Agent
// ============================================

import React from 'react';
import {
  Bot,
  Play,
  Pause,
  Settings,
  Trash2,
  MoreVertical,
  TrendingUp,
  Clock,
  Send,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Agent } from '@/types/database';

interface AgentCardProps {
  agent: Agent & {
    stats?: {
      posts_today: number;
      scheduled_posts: number;
      pending_trends: number;
    };
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  paused: {
    label: 'Paused',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  draft: {
    label: 'Draft',
    color: 'bg-zinc-500',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/30',
  },
};

export default function AgentCard({ agent, onEdit, onDelete, onToggleStatus }: AgentCardProps) {
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.draft;
  const stats = agent.stats || { posts_today: 0, scheduled_posts: 0, pending_trends: 0 };

  return (
    <div className="group relative bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              {/* Status dot */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 ${statusConfig.color}`}>
                {agent.status === 'active' && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <div className="flex items-center gap-2">
                {agent.niche && (
                  <span className="text-xs text-zinc-500">{agent.niche}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleStatus}
              className={`p-2 rounded-lg transition-all ${agent.status === 'active'
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
              title={agent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
            >
              {agent.status === 'active' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              title="Edit Agent"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Delete Agent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Topic Instructions Preview */}
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
          {agent.topic_instructions}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatMini
            icon={<Send className="w-3.5 h-3.5" />}
            label="Today"
            value={stats.posts_today}
            color="text-blue-400"
          />
          <StatMini
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Queued"
            value={stats.scheduled_posts}
            color="text-amber-400"
          />
          <StatMini
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Trends"
            value={stats.pending_trends}
            color="text-emerald-400"
            highlight={stats.pending_trends > 0}
          />
        </div>

        {/* Pending Alert */}
        {stats.pending_trends > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">
              {stats.pending_trends} trend{stats.pending_trends > 1 ? 's' : ''} awaiting approval
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Every {agent.posting_frequency_minutes / 60}h
          </div>
          {agent.last_post_at ? (
            <span>Last post: {formatRelativeTime(agent.last_post_at)}</span>
          ) : (
            <span>No posts yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function StatMini({
  icon,
  label,
  value,
  color,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`text-center p-2 rounded-lg ${highlight ? 'bg-amber-500/10' : 'bg-zinc-900'}`}>
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="font-semibold">{value}</span>
      </div>
      <span className="text-xs text-zinc-600">{label}</span>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
