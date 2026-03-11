'use client';

// ============================================
// Agents Dashboard Page - Premium Design
// /agents
// ============================================

import React from 'react';
import ApiKeysPanel from '@/components/agents/ApiKeysPanel';
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
  Plus
} from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
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
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-zinc-400">System Online</span>
              </div>
              <button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center gap-2">
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
              value="0"
              subtext="Ready to deploy"
              icon={<Bot className="w-5 h-5" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="Posts Today"
              value="0"
              subtext="Across all platforms"
              icon={<Send className="w-5 h-5" />}
              gradient="from-emerald-500 to-green-500"
            />
            <StatCard
              label="Scheduled"
              value="0"
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
              borderGradient="from-blue-500/50 to-purple-500/50"
            />
            <QuickAction
              title="View Trends"
              description="See what's trending now"
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-emerald-500/10 to-cyan-500/10"
              borderGradient="from-emerald-500/50 to-cyan-500/50"
            />
            <QuickAction
              title="Schedule Review"
              description="Review upcoming posts"
              icon={<Calendar className="w-5 h-5" />}
              gradient="from-amber-500/10 to-orange-500/10"
              borderGradient="from-amber-500/50 to-orange-500/50"
            />
          </div>

          {/* API Keys Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent rounded-3xl"></div>
            <div className="relative bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800/50 p-6 md:p-8">
              <ApiKeysPanel />
            </div>
          </section>

          {/* Agents Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent rounded-3xl"></div>
            <div className="relative bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800/50 p-6 md:p-8">

              {/* Section Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Agents</h2>
                    <p className="text-sm text-zinc-500">Configure autonomous content creators</p>
                  </div>
                </div>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  <Bot className="w-4 h-4" />
                  Create Agent
                </button>
              </div>

              {/* Empty State */}
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
                    Connect your API keys above to unlock agent creation. Each agent can post to multiple platforms with unique content styles.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">1</div>
                      Connect APIs
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">2</div>
                      Create Agent
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">3</div>
                      Auto-post
                    </div>
                  </div>
                </div>
              </div>

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
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ label, value, subtext, icon, gradient }: StatCardProps) {
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

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderGradient: string;
}

function QuickAction({ title, description, icon, gradient, borderGradient }: QuickActionProps) {
  return (
    <button className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 text-left hover:scale-[1.02] transition-all border border-zinc-800/50 hover:border-zinc-700/50`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${borderGradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} style={{ padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

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
