'use client';

// ============================================
// Stats Dashboard Component - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Send,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  period: string;
  activities: {
    total: number;
    success: number;
    failed: number;
    byType: Record<string, number>;
  };
  posts: {
    total: number;
    draft: number;
    scheduled: number;
    posted: number;
    failed: number;
  };
  agents: {
    total: number;
    active: number;
    paused: number;
  };
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-zinc-900 rounded-lg p-1">
            {(['24h', '7d', '30d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${period === p
                    ? 'bg-emerald-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Send className="w-5 h-5" />}
          label="Posts Published"
          value={stats?.posts.posted || 0}
          color="emerald"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Scheduled"
          value={stats?.posts.scheduled || 0}
          color="amber"
        />
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          label="Active Agents"
          value={stats?.agents.active || 0}
          total={stats?.agents.total}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Activities"
          value={stats?.activities.total || 0}
          color="purple"
        />
      </div>

      {/* Success/Failure Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activity Success Rate */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Activity Success Rate</h4>

          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${((stats?.activities.success || 0) / Math.max(stats?.activities.total || 1, 1)) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {stats?.activities.total
                    ? Math.round((stats.activities.success / stats.activities.total) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-zinc-400">Success</span>
                </div>
                <span className="font-medium text-emerald-400">{stats?.activities.success || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-zinc-400">Failed</span>
                </div>
                <span className="font-medium text-red-400">{stats?.activities.failed || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Status Breakdown */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Post Status</h4>

          <div className="space-y-3">
            <StatusBar
              label="Posted"
              value={stats?.posts.posted || 0}
              total={stats?.posts.total || 1}
              color="bg-emerald-500"
            />
            <StatusBar
              label="Scheduled"
              value={stats?.posts.scheduled || 0}
              total={stats?.posts.total || 1}
              color="bg-amber-500"
            />
            <StatusBar
              label="Draft"
              value={stats?.posts.draft || 0}
              total={stats?.posts.total || 1}
              color="bg-zinc-500"
            />
            <StatusBar
              label="Failed"
              value={stats?.posts.failed || 0}
              total={stats?.posts.total || 1}
              color="bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* Activity by Type */}
      {stats?.activities.byType && Object.keys(stats.activities.byType).length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Activity Breakdown</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.activities.byType)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="p-3 bg-zinc-800/50 rounded-lg"
                >
                  <p className="text-lg font-bold text-white">{count}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {type.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function StatCard({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number;
  color: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {total !== undefined && (
          <span className="text-sm font-normal text-zinc-500">/{total}</span>
        )}
      </p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = (value / Math.max(total, 1)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
