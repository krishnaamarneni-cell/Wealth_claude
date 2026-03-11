'use client';

// ============================================
// Agents Dashboard Page
// /agents
// ============================================

import React from 'react';
import ApiKeysPanel from '@/components/agents/ApiKeysPanel';
import { Bot, Key, LayoutDashboard } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Social Media Agents</h1>
              <p className="text-sm text-zinc-400">Automated content generation & posting</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8">

          {/* Quick Stats (placeholder for now) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Active Agents"
              value="0"
              icon={<Bot className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="Posts Today"
              value="0"
              icon={<LayoutDashboard className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              label="Scheduled"
              value="0"
              icon={<LayoutDashboard className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              label="APIs Connected"
              value="0/7"
              icon={<Key className="w-5 h-5" />}
              color="purple"
            />
          </div>

          {/* API Keys Section */}
          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <ApiKeysPanel />
          </section>

          {/* Agents Section (placeholder for Step 4) */}
          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  Your Agents
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Create and manage your content agents
                </p>
              </div>
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled
              >
                <Bot className="w-4 h-4" />
                Create Agent
              </button>
            </div>

            {/* Empty state */}
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
              <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-2">No agents yet</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Connect your API keys above first, then create your first agent
              </p>
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
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
