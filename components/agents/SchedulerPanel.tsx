'use client';

// ============================================
// Scheduler Control Panel - WealthClaude Style
// ============================================

import React, { useState } from 'react';
import {
  Play,
  Clock,
  TrendingUp,
  Send,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Zap,
  Calendar,
  Bot,
} from 'lucide-react';

interface SchedulerResult {
  timestamp?: string;
  trends?: Array<{
    agentId: string;
    agentName: string;
    newTrends: string[];
  }>;
  autoPosts?: Array<{
    agentId: string;
    agentName: string;
    topic: string;
    success: boolean;
    error?: string;
  }>;
  scheduledPosts?: {
    processed: number;
    success: number;
    failed: number;
  };
}

export default function SchedulerPanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTask = async (task: string) => {
    setRunning(task);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/agents/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Task failed');
      }
    } catch (err) {
      setError('Failed to run task');
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500 rounded-xl">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Automation Control</h2>
          <p className="text-sm text-zinc-500">Run scheduled tasks manually</p>
        </div>
      </div>

      {/* Task Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TaskButton
          icon={<RefreshCw className="w-5 h-5" />}
          label="Full Cycle"
          description="Run all tasks"
          task="full"
          running={running}
          onClick={runTask}
          gradient="from-emerald-500 to-green-600"
        />
        <TaskButton
          icon={<TrendingUp className="w-5 h-5" />}
          label="Check Trends"
          description="Discover new topics"
          task="trends"
          running={running}
          onClick={runTask}
          gradient="from-blue-500 to-cyan-600"
        />
        <TaskButton
          icon={<Calendar className="w-5 h-5" />}
          label="Scheduled"
          description="Process due posts"
          task="scheduled"
          running={running}
          onClick={runTask}
          gradient="from-amber-500 to-orange-600"
        />
        <TaskButton
          icon={<Bot className="w-5 h-5" />}
          label="Auto-Post"
          description="Generate & publish"
          task="autopost"
          running={running}
          onClick={runTask}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Task Failed</p>
            <p className="text-sm text-red-300/70">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">Task Completed</span>
            {result.timestamp && (
              <span className="text-xs text-zinc-500 ml-auto">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Trends Results */}
          {result.trends && result.trends.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Trends Discovered
              </h4>
              <div className="space-y-2">
                {result.trends.map((t, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{t.agentName}</span>
                    {t.newTrends.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.newTrends.map((trend, j) => (
                          <span key={j} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {trend}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 mt-1">No new trends</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-Posts Results */}
          {result.autoPosts && result.autoPosts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                Auto-Posts
              </h4>
              <div className="space-y-2">
                {result.autoPosts.map((p, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 ${p.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {p.success ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-white font-medium">{p.agentName}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      {p.topic || p.error || 'No topic'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Posts Results */}
          {result.scheduledPosts && result.scheduledPosts.processed > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Scheduled Posts Processed
              </h4>
              <div className="flex gap-4">
                <div className="bg-zinc-900/50 rounded-lg p-3 text-center flex-1">
                  <p className="text-2xl font-bold text-white">{result.scheduledPosts.processed}</p>
                  <p className="text-xs text-zinc-500">Processed</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 text-center flex-1">
                  <p className="text-2xl font-bold text-emerald-400">{result.scheduledPosts.success}</p>
                  <p className="text-xs text-zinc-500">Success</p>
                </div>
                {result.scheduledPosts.failed > 0 && (
                  <div className="bg-red-500/10 rounded-lg p-3 text-center flex-1">
                    <p className="text-2xl font-bold text-red-400">{result.scheduledPosts.failed}</p>
                    <p className="text-xs text-zinc-500">Failed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result.trends?.some(t => t.newTrends.length > 0) &&
            !result.autoPosts?.length &&
            !result.scheduledPosts?.processed && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No actions taken. All agents up to date.
              </p>
            )}
        </div>
      )}

      {/* Info */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-300 mb-2">Automation Schedule</h4>
        <p className="text-sm text-zinc-500">
          Tasks run automatically every 2 hours via Vercel Cron.
          Use the buttons above to trigger tasks manually.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
            Trends: Every 2h
          </span>
          <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
            Scheduled: Every 15m
          </span>
          <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
            Auto-post: Per agent frequency
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Task Button Component
// ============================================

function TaskButton({
  icon,
  label,
  description,
  task,
  running,
  onClick,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  task: string;
  running: string | null;
  onClick: (task: string) => void;
  gradient: string;
}) {
  const isRunning = running === task;
  const isDisabled = running !== null;

  return (
    <button
      onClick={() => onClick(task)}
      disabled={isDisabled}
      className={`
        relative overflow-hidden rounded-xl p-4 text-left transition-all
        ${isDisabled && !isRunning ? 'opacity-50' : 'hover:scale-[1.02]'}
        bg-zinc-900 border border-zinc-800 hover:border-zinc-700
        disabled:cursor-not-allowed
      `}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} ${isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
          {isRunning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            icon
          )}
        </div>
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
