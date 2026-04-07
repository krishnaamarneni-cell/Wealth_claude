'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink, Film } from 'lucide-react'
import type { VideoActivityItem } from '@/lib/video-studio/types'

const DATE_FILTERS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'All Time', days: 0 },
]

const statusColors: Record<string, string> = {
  posted: 'bg-green-500/10 text-green-500',
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-blue-500/10 text-blue-500',
  skipped: 'bg-gray-500/10 text-gray-400',
  error: 'bg-red-500/10 text-red-500',
}

export default function HistoryPage() {
  const [activity, setActivity] = useState<VideoActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(7)

  useEffect(() => {
    fetchActivity()
  }, [dateFilter])

  async function fetchActivity() {
    setLoading(true)
    try {
      let url = '/api/admin/video-activity'
      if (dateFilter > 0) {
        const from = new Date()
        from.setDate(from.getDate() - dateFilter)
        url += `?dateFrom=${from.toISOString().split('T')[0]}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setActivity(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to fetch activity:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/video-studio" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Posting History</h1>
          <p className="text-muted-foreground text-sm">{activity.length} entries</p>
        </div>
        <button
          onClick={fetchActivity}
          className="p-2 rounded-lg border hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 flex-wrap">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.days}
            onClick={() => setDateFilter(f.days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === f.days
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activity.length === 0 ? (
        <div className="text-center py-16">
          <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No posting history yet</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Platform</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Views</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Link</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-[300px] truncate">
                      {item.title || 'Untitled'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                      {item.platform || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.views || 0}
                    </td>
                    <td className="px-4 py-3">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
