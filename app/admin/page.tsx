// =============================================================================
// Admin Dashboard Overview
// Path: src/app/admin/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface DashboardData {
  stats: {
    totalAssessments: number;
    assessmentsThisWeek: number;
    totalUsers: number;
    newUsersThisWeek: number;
    averageScore: number;
    scoreChange: number;
    completionRate: number;
  };
  recentAssessments: {
    id: string;
    user_name: string;
    user_email: string;
    overall_score: number;
    personality_type: string;
    created_at: string;
  }[];
  topPerformers: {
    id: string;
    user_name: string;
    overall_score: number;
  }[];
  needsAttention: {
    id: string;
    user_name: string;
    overall_score: number;
  }[];
}

// =============================================================================
// Admin Dashboard Component
// =============================================================================

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockData: DashboardData = {
    stats: {
      totalAssessments: 1247,
      assessmentsThisWeek: 89,
      totalUsers: 856,
      newUsersThisWeek: 34,
      averageScore: 62,
      scoreChange: 3.2,
      completionRate: 78
    },
    recentAssessments: [
      { id: '1', user_name: 'John Smith', user_email: 'john@example.com', overall_score: 72, personality_type: 'balanced_planner', created_at: new Date().toISOString() },
      { id: '2', user_name: 'Sarah Johnson', user_email: 'sarah@example.com', overall_score: 58, personality_type: 'cautious_saver', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', user_name: 'Mike Davis', user_email: 'mike@example.com', overall_score: 81, personality_type: 'growth_investor', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: '4', user_name: 'Emily Brown', user_email: 'emily@example.com', overall_score: 45, personality_type: 'money_avoider', created_at: new Date(Date.now() - 10800000).toISOString() },
      { id: '5', user_name: 'Chris Wilson', user_email: 'chris@example.com', overall_score: 67, personality_type: 'security_seeker', created_at: new Date(Date.now() - 14400000).toISOString() },
    ],
    topPerformers: [
      { id: '3', user_name: 'Mike Davis', overall_score: 81 },
      { id: '6', user_name: 'Anna Lee', overall_score: 79 },
      { id: '7', user_name: 'Tom Harris', overall_score: 76 },
    ],
    needsAttention: [
      { id: '4', user_name: 'Emily Brown', overall_score: 45 },
      { id: '8', user_name: 'James Martin', overall_score: 38 },
      { id: '9', user_name: 'Lisa Garcia', overall_score: 42 },
    ]
  };

  const displayData = data || mockData;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assessments"
          value={displayData.stats.totalAssessments}
          subValue={`+${displayData.stats.assessmentsThisWeek} this week`}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={displayData.stats.totalUsers}
          subValue={`+${displayData.stats.newUsersThisWeek} this week`}
          icon={<Users className="w-5 h-5" />}
          color="purple"
          trend="up"
        />
        <StatCard
          title="Average Score"
          value={displayData.stats.averageScore}
          subValue={`${displayData.stats.scoreChange >= 0 ? '+' : ''}${displayData.stats.scoreChange}% vs last week`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          trend={displayData.stats.scoreChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Completion Rate"
          value={`${displayData.stats.completionRate}%`}
          subValue="of started assessments"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Assessments</h2>
            <Link 
              href="/admin/assessments"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {displayData.recentAssessments.map((assessment) => (
              <div key={assessment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {assessment.user_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{assessment.user_name}</div>
                    <div className="text-sm text-gray-500">{assessment.user_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${getScoreColor(assessment.overall_score)}`}>
                    {assessment.overall_score}
                  </span>
                  <span className="text-sm text-gray-400">{formatDate(assessment.created_at)}</span>
                  <Link
                    href={`/admin/assessments?id=${assessment.id}`}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">🏆 Top Performers</h2>
            </div>
            <div className="p-4 space-y-3">
              {displayData.topPerformers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">{user.user_name}</span>
                  <span className="text-sm font-semibold text-emerald-600">{user.overall_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">⚠️ Needs Attention</h2>
            </div>
            <div className="p-4 space-y-3">
              {displayData.needsAttention.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                    !
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">{user.user_name}</span>
                  <span className="text-sm font-semibold text-red-600">{user.overall_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/admin/assessments"
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">View All Assessments</span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Export Reports (CSV)</span>
              </button>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Manage Users</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  subValue: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
  trend?: 'up' | 'down';
}

function StatCard({ title, value, subValue, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
      <div className="text-xs text-gray-400 mt-2">{subValue}</div>
    </div>
  );
}
