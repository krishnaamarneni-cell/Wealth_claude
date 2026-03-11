'use client';

// ============================================
// Agents Dashboard Page - Full CRUD
// /agents
// ============================================

import React, { useState, useEffect } from 'react';
import ApiKeysPanel from '@/components/agents/ApiKeysPanel';
import AgentForm from '@/components/agents/AgentForm';
import AgentCard from '@/components/agents/AgentCard';
import { Agent, AgentInsert } from '@/types/database';
import {
  Bot,
  Key,
  Zap,
  Calendar,
  TrendingUp,
  Image,
  Send,
  Clock,
  Activity,
  ChevronRight,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents?include_stats=true');
      const data = await response.json();

      if (data.success) {
        setAgents(data.data);
      } else {
        setError(data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      setError('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (data: AgentInsert) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAgents();
        setShowForm(false);
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateAgent = async (data: AgentInsert) => {
    if (!editingAgent) return;

    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAgent.id, ...data }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAgents();
        setEditingAgent(null);
      } else {
        throw new Error(result.error || 'Failed to update agent');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents?id=${agent.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchAgents();
      } else {
        throw new Error(result.error || 'Failed to delete agent');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAgents();
      } else {
        throw new Error(result.error || 'Failed to update agent');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calculate stats
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalPosts = agents.reduce((sum, a) => sum + (a.stats?.posts_today || 0), 0);
  const totalScheduled = agents.reduce((sum, a) => sum + (a.stats?.scheduled_posts || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <Bot className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">AI Agents</h1>
                <p className="text-sm text-zinc-500">Autonomous social media automation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${activeAgents > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                <span className="text-sm text-zinc-400">
                  {activeAgents > 0 ? `${activeAgents} Active` : 'No Active Agents'}
                </span>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Agents"
              value={activeAgents.toString()}
              subtext={`${agents.length} total`}
              icon={<Bot className="w-5 h-5" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="Posts Today"
              value={totalPosts.toString()}
              subtext="Across all platforms"
              icon={<Send className="w-5 h-5" />}
              gradient="from-emerald-500 to-green-500"
            />
            <StatCard
              label="Scheduled"
              value={totalScheduled.toString()}
              subtext="In queue"
              icon={<Clock className="w-5 h-5" />}
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              label="Images Generated"
              value="0"
              subtext="This month"
              icon={<Image className="w-5 h-5" />}
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="Create Post"
              description="Generate content manually"
              icon={<Sparkles className="w-5 h-5" />}
              gradient="from-blue-500/10 to-purple-500/10"
            />
            <QuickAction
              title="View Trends"
              description="See what's trending now"
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-emerald-500/10 to-cyan-500/10"
            />
            <QuickAction
              title="Schedule Review"
              description="Review upcoming posts"
              icon={<Calendar className="w-5 h-5" />}
              gradient="from-amber-500/10 to-orange-500/10"
            />
          </div>

          {/* Agents Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent rounded-3xl"></div>
            <div className="relative bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800/50 p-6 md:p-8">

              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Agents</h2>
                    <p className="text-sm text-zinc-500">
                      {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchAgents}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-zinc-500">Loading agents...</p>
                </div>
              )}

              {/* Agents Grid */}
              {!loading && agents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onEdit={() => setEditingAgent(agent)}
                      onDelete={() => handleDeleteAgent(agent)}
                      onToggleStatus={() => handleToggleStatus(agent)}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && agents.length === 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-2xl"></div>
                  <div className="relative text-center py-16 border-2 border-dashed border-zinc-800 rounded-2xl">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                      <div className="relative p-5 bg-zinc-900 rounded-full border border-zinc-800">
                        <Bot className="w-10 h-10 text-zinc-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-300 mb-2">No agents configured</h3>
                    <p className="text-zinc-500 max-w-md mx-auto mb-6">
                      Create your first agent to start automating your social media content.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Your First Agent
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* API Keys Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent rounded-3xl"></div>
            <div className="relative bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800/50 p-6 md:p-8">
              <ApiKeysPanel />
            </div>
          </section>

          {/* Activity Log Preview */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent rounded-3xl"></div>
            <div className="relative bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800/50 p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Activity Log</h2>
                  <p className="text-sm text-zinc-500">Recent agent actions and events</p>
                </div>
              </div>

              <div className="text-center py-12 text-zinc-500">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No activity yet. Create an agent to get started.</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Agent Form Modal */}
      {(showForm || editingAgent) && (
        <AgentForm
          agent={editingAgent}
          onSave={editingAgent ? handleUpdateAgent : handleCreateAgent}
          onCancel={() => {
            setShowForm(false);
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================

function StatCard({ label, value, subtext, icon, gradient }: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-zinc-950/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-5 hover:border-zinc-700/50 transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>

      <div className="relative">
        <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
          <div className="text-white">{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <p className="text-xs text-zinc-600">{subtext}</p>
      </div>
    </div>
  );
}

// ============================================
// Quick Action Component
// ============================================

function QuickAction({ title, description, icon, gradient }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <button className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 text-left hover:scale-[1.02] transition-all border border-zinc-800/50 hover:border-zinc-700/50`}>
      <div className="relative flex items-center gap-4">
        <div className="p-3 bg-zinc-900/80 rounded-xl text-white">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 ml-auto group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
