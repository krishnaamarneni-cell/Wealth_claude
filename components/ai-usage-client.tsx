'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Zap,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

interface UsageData {
  summary: {
    totalRequests: number
    successCount: number
    failCount: number
    successRate: number
    avgResponseTimeMs: number
    uniqueUsers: number
    estimatedCost: number
  }
  byCategory: Record<string, number>
  byRoute: Record<string, number>
  byDay: Record<string, number>
  topQuestions: Array<{ question: string; count: number }>
  recentLogs: Array<{
    id: string
    message: string
    category: string
    route: string
    model: string
    responseTimeMs: number
    success: boolean
    errorMessage?: string
    createdAt: string
  }>
}

export function AIUsageClient() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ai-usage?period=${period}`)
      if (!res.ok) {
        if (res.status === 403) throw new Error('Admin access required')
        throw new Error('Failed to fetch usage data')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-lg font-medium text-foreground">{error}</p>
          <button onClick={fetchData} className="text-sm text-green-500 hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period selector + refresh */}
      <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-muted/50 border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Total Requests"
              value={data.summary.totalRequests.toLocaleString()}
              color="green"
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Unique Users"
              value={data.summary.uniqueUsers.toString()}
              color="blue"
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Avg Response"
              value={`${(data.summary.avgResponseTimeMs / 1000).toFixed(1)}s`}
              color="yellow"
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Est. Cost"
              value={`$${data.summary.estimatedCost.toFixed(2)}`}
              color="purple"
            />
          </div>

          {/* Success Rate */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Success Rate</span>
              <span className="text-sm font-bold text-green-500">{data.summary.successRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${data.summary.successRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{data.summary.successCount} succeeded</span>
              <span>{data.summary.failCount} failed</span>
            </div>
          </div>

          {/* Category + Route */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                By Question Type
              </h3>
              {Object.entries(data.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getCategoryColor(category)}`} />
                      <span className="text-sm text-foreground capitalize">{category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 bg-muted rounded-full w-24 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getCategoryColor(category)}`}
                          style={{ width: `${(count / data.summary.totalRequests) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                By LLM Route
              </h3>
              {Object.entries(data.byRoute)
                .sort(([, a], [, b]) => b - a)
                .map(([route, count]) => (
                  <div key={route} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getRouteColor(route)}`} />
                      <span className="text-sm text-foreground">{formatRouteName(route)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 bg-muted rounded-full w-24 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getRouteColor(route)}`}
                          style={{ width: `${(count / data.summary.totalRequests) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Daily Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Requests per Day</h3>
            <div className="flex items-end gap-1 h-32">
              {Object.entries(data.byDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(data.byDay))
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{count}</span>
                      <div
                        className="w-full bg-green-500/80 rounded-t transition-all hover:bg-green-400"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day}: ${count} requests`}
                      />
                      <span className="text-[9px] text-muted-foreground">{day.substring(5)}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top Questions */}
          {data.topQuestions.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Questions</h3>
              <div className="space-y-2">
                {data.topQuestions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-sm text-foreground truncate max-w-[80%]">{q.question}</span>
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {q.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Logs */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Requests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Time</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Message</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Route</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Speed</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-2 text-foreground max-w-[200px] truncate">{log.message}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRouteBadge(log.route)}`}>
                          {formatRouteName(log.route)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {(log.responseTimeMs / 1000).toFixed(1)}s
                      </td>
                      <td className="py-2 px-2">
                        {log.success ? (
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" title={log.errorMessage} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    purple: 'bg-purple-500/10 text-purple-500',
  }
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`h-8 w-8 rounded-lg ${colorMap[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'portfolio': return 'bg-green-500'
    case 'market': return 'bg-blue-500'
    case 'mixed': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

function getRouteColor(route: string): string {
  switch (route) {
    case 'groq': return 'bg-green-500'
    case 'perplexity': return 'bg-blue-500'
    case 'perplexity+groq': return 'bg-purple-500'
    case 'mistral-fallback': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

function formatRouteName(route: string): string {
  switch (route) {
    case 'groq': return 'Groq'
    case 'perplexity': return 'Perplexity'
    case 'perplexity+groq': return 'Perplexity + Groq'
    case 'mistral-fallback': return 'Mistral (fallback)'
    case 'market-fallback': return 'Groq (market fallback)'
    default: return route
  }
}

function getCategoryBadge(cat: string): string {
  switch (cat) {
    case 'portfolio': return 'bg-green-500/15 text-green-400'
    case 'market': return 'bg-blue-500/15 text-blue-400'
    case 'mixed': return 'bg-purple-500/15 text-purple-400'
    default: return 'bg-gray-500/15 text-gray-400'
  }
}

function getRouteBadge(route: string): string {
  switch (route) {
    case 'groq': return 'bg-green-500/15 text-green-400'
    case 'perplexity': return 'bg-blue-500/15 text-blue-400'
    case 'perplexity+groq': return 'bg-purple-500/15 text-purple-400'
    case 'mistral-fallback': return 'bg-yellow-500/15 text-yellow-400'
    default: return 'bg-gray-500/15 text-gray-400'
  }
}
