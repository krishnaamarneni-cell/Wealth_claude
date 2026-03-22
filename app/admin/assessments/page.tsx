// =============================================================================
// Admin Dashboard - Assessment Management
// Path: src/app/admin/assessments/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Download, Eye, RefreshCw, ChevronDown, ChevronUp,
  Users, FileText, TrendingUp, Clock, Filter, X, Calendar,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface Assessment {
  id: string;
  user_id: string;
  overall_score: number;
  personality_type: string;
  factor_scores: FactorScore[];
  rankings: Rankings;
  created_at: string;
  user?: User;
  financial_plans?: FinancialPlan[];
}

interface FactorScore {
  factorId: string;
  score: number;
  status: string;
}

interface Rankings {
  overallPercentile: number;
  vsAgeGroup: number;
  vsIncomeGroup: number;
}

interface FinancialPlan {
  id: string;
  goal_path: string;
  chosen_path: string;
  created_at: string;
}

interface DashboardStats {
  totalAssessments: number;
  assessmentsThisWeek: number;
  averageScore: number;
  scoreChange: number;
  completionRate: number;
}

// =============================================================================
// Admin Dashboard Component
// =============================================================================

export default function AdminAssessmentDashboard() {
  // State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'score' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (dateFilter !== 'all') params.set('date', dateFilter);
      if (scoreFilter !== 'all') params.set('score', scoreFilter);
      params.set('sort', sortField);
      params.set('direction', sortDirection);

      const response = await fetch(`/api/admin/assessments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAssessments(data.assessments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateFilter, scoreFilter, sortField, sortDirection]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Download PDF
  const handleDownloadPdf = async (assessmentId: string) => {
    setDownloadingId(assessmentId);
    try {
      const response = await fetch(`/api/assessment/pdf?id=${assessmentId}`);
      
      if (!response.ok) throw new Error('PDF generation failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WealthClaude_Report_${assessmentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Sort handler
  const handleSort = (field: 'date' | 'score' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Personality type display
  const formatPersonalityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and review user assessments</p>
            </div>
            <button
              onClick={fetchAssessments}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Assessments"
              value={stats.totalAssessments}
              icon={<FileText className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              title="This Week"
              value={stats.assessmentsThisWeek}
              icon={<Calendar className="w-5 h-5" />}
              color="purple"
            />
            <StatsCard
              title="Average Score"
              value={stats.averageScore}
              suffix="/100"
              change={stats.scoreChange}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />
            <StatsCard
              title="Completion Rate"
              value={stats.completionRate}
              suffix="%"
              icon={<Users className="w-5 h-5" />}
              color="amber"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Score Filter */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="all">All Scores</option>
              <option value="high">High (70+)</option>
              <option value="medium">Medium (50-69)</option>
              <option value="low">Low (&lt;50)</option>
            </select>
          </div>
        </div>

        {/* Assessments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      <SortIcon field="name" current={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      Score
                      <SortIcon field="score" current={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Personality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Percentile
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="date" current={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading assessments...
                    </td>
                  </tr>
                ) : assessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No assessments found
                    </td>
                  </tr>
                ) : (
                  assessments.map((assessment) => (
                    <tr 
                      key={assessment.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {assessment.user?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assessment.user?.email || assessment.user_id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${getScoreColor(assessment.overall_score)}`}>
                          {assessment.overall_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatPersonalityType(assessment.personality_type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        Top {100 - assessment.rankings.overallPercentile}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(assessment.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAssessment(assessment)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(assessment.id)}
                            disabled={downloadingId === assessment.id}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingId === assessment.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedAssessment && (
        <AssessmentDetailModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onDownload={() => handleDownloadPdf(selectedAssessment.id)}
          downloading={downloadingId === selectedAssessment.id}
        />
      )}
    </div>
  );
}

// =============================================================================
// Stats Card Component
// =============================================================================

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
}

function StatsCard({ title, value, suffix, change, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">
          {value}{suffix}
        </div>
        <div className="text-sm text-gray-500 mt-1">{title}</div>
      </div>
    </div>
  );
}

// =============================================================================
// Sort Icon Component
// =============================================================================

interface SortIconProps {
  field: string;
  current: string;
  direction: 'asc' | 'desc';
}

function SortIcon({ field, current, direction }: SortIconProps) {
  if (field !== current) {
    return <Minus className="w-3 h-3 text-gray-300" />;
  }
  return direction === 'asc' 
    ? <ChevronUp className="w-3 h-3" /> 
    : <ChevronDown className="w-3 h-3" />;
}

// =============================================================================
// Assessment Detail Modal
// =============================================================================

interface DetailModalProps {
  assessment: Assessment;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
}

function AssessmentDetailModal({ assessment, onClose, onDownload, downloading }: DetailModalProps) {
  const factorNames: Record<string, string> = {
    'savings_discipline': 'Savings Discipline',
    'debt_management': 'Debt Management',
    'financial_planning': 'Financial Planning',
    'spending_control': 'Spending Control',
    'investment_readiness': 'Investment Readiness',
    'risk_tolerance': 'Risk Tolerance',
    'financial_literacy': 'Financial Literacy',
    'emergency_preparedness': 'Emergency Preparedness',
    'future_orientation': 'Future Orientation',
    'money_wellness': 'Money Wellness'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-emerald-400';
      case 'average': return 'bg-amber-400';
      case 'below_average': return 'bg-orange-400';
      case 'needs_work': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assessment Details</h2>
            <p className="text-sm text-gray-500">
              {assessment.user?.full_name || 'Unknown User'} • {new Date(assessment.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Score Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-emerald-600">{assessment.overall_score}</div>
              <div className="text-sm text-emerald-700 mt-1">Overall Score</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{assessment.rankings.overallPercentile}th</div>
              <div className="text-sm text-blue-700 mt-1">Percentile</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-purple-600">
                {assessment.personality_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
              <div className="text-sm text-purple-700 mt-1">Personality</div>
            </div>
          </div>

          {/* Factor Scores */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Factor Breakdown</h3>
          <div className="space-y-3 mb-8">
            {assessment.factor_scores.map((factor) => (
              <div key={factor.factorId} className="flex items-center gap-4">
                <div className="w-40 text-sm font-medium text-gray-700">
                  {factorNames[factor.factorId] || factor.factorId}
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getStatusColor(factor.status)}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-semibold text-gray-900">
                  {factor.score}
                </div>
              </div>
            ))}
          </div>

          {/* Rankings */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rankings</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-900">{assessment.rankings.overallPercentile}th</div>
              <div className="text-xs text-gray-500">vs Everyone</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-900">{assessment.rankings.vsAgeGroup}th</div>
              <div className="text-xs text-gray-500">vs Age Group</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-900">{assessment.rankings.vsIncomeGroup}th</div>
              <div className="text-xs text-gray-500">vs Income Group</div>
            </div>
          </div>

          {/* Financial Plan */}
          {assessment.financial_plans && assessment.financial_plans.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Plan</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Goal Path:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {assessment.financial_plans[0].goal_path.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Chosen Path:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {assessment.financial_plans[0].chosen_path === 'safe_steady' ? '🛡️ Safe & Steady' : '⚡ Fast & Aggressive'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {downloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
