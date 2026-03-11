'use client';

// ============================================
// Main Agents Dashboard Page
// /app/agents/page.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Settings,
  Activity,
  BarChart3,
  Send,
  Zap,
  MessageCircle,
  Key,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

// Import components
import AgentCard from '@/components/agents/AgentCard';
import AgentForm from '@/components/agents/AgentForm';
import ApiKeysPanel from '@/components/agents/ApiKeysPanel';
import SocialAccountsPanel from '@/components/agents/SocialAccountsPanel';
import PostQueue from '@/components/agents/PostQueue';
import ContentGenerator from '@/components/agents/ContentGenerator';
import SchedulerPanel from '@/components/agents/SchedulerPanel';
import TelegramSetup from '@/components/agents/TelegramSetup';
import ActivityLog from '@/components/agents/ActivityLog';
import StatsDashboard from '@/components/agents/StatsDashboard';
import CommentsPanel from '@/components/agents/CommentsPanel';

import { Agent, AgentInsert } from '@/types/database';

type TabId = 'overview' | 'agents' | 'generate' | 'queue' | 'automation' | 'telegram' | 'comments' | 'settings';

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async (data: AgentInsert) => {
    try {
      const url = '/api/agents';
      const method = editingAgent ? 'PUT' : 'POST';
      const body = editingAgent ? { ...data, id: editingAgent.id } : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAgents();
        setShowAgentForm(false);
        setEditingAgent(null);
      } else {
        alert(result.error || 'Failed to save agent');
      }
    } catch (err) {
      alert('Failed to save agent');
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentForm(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Delete this agent? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/agents?id=${agentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setAgents(prev => prev.filter(a => a.id !== agentId));
      } else {
        alert(result.error || 'Failed to delete agent');
      }
    } catch (err) {
      alert('Failed to delete agent');
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'agents', label: 'Agents', icon: <Bot className="w-4 h-4" /> },
    { id: 'generate', label: 'Generate', icon: <Zap className="w-4 h-4" /> },
    { id: 'queue', label: 'Queue', icon: <Send className="w-4 h-4" /> },
    { id: 'automation', label: 'Automation', icon: <Activity className="w-4 h-4" /> },
    { id: 'telegram', label: 'Telegram', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <a 
            href="/dashboard" 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </a>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Social Agents</h1>
            <p className="text-zinc-500 mt-1">Autonomous AI content creators</p>
          </div>
          <button
            onClick={() => {
              setEditingAgent(null);
              setShowAgentForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Agent
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StatsDashboard />
              </div>
              <div>
                <ActivityLog limit={10} compact />
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                  <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
                  <p className="text-zinc-500 mb-6">Create your first AI agent to start automating</p>
                  <button
                    onClick={() => setShowAgentForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create Agent
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onEdit={() => handleEditAgent(agent)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="max-w-3xl">
              <ContentGenerator onPostCreated={fetchAgents} />
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <PostQueue />
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SchedulerPanel />
              <ActivityLog />
            </div>
          )}

          {/* Telegram Tab */}
          {activeTab === 'telegram' && (
            <div className="max-w-2xl">
              <TelegramSetup />
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <CommentsPanel />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">API Connections</h3>
                </div>
                <ApiKeysPanel />
              </div>
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <React.Suspense fallback={<div className="animate-pulse h-32 bg-zinc-800 rounded-lg" />}>
                  <SocialAccountsPanel />
                </React.Suspense>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Form Modal */}
      {showAgentForm && (
        <AgentForm
          agent={editingAgent}
          onSave={handleSaveAgent}
          onCancel={() => {
            setShowAgentForm(false);
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
}
