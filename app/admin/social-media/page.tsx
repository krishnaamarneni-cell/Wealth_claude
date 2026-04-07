'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Film, Plus, Clock, CheckCircle, AlertCircle, TrendingUp, RefreshCw, ExternalLink, Youtube } from 'lucide-react'
import type { VideoStats, VideoActivityItem } from '@/lib/video-studio/types'

export default function VideoStudioDashboard() {
  const [stats, setStats] = useState<VideoStats>({ pending: 0, approved: 0, postedToday: 0, totalPosted: 0 })
  const [activity, setActivity] = useState<VideoActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quickUrl, setQuickUrl] = useState('')
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/video-stats'),
        fetch('/api/admin/video-activity'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivity(Array.isArray(data) ? data.slice(0, 5) : [])
      }
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
    }
  }

  function detectUrlType(url: string): { type: string; platform: string; label: string } | null {
    if (url.includes('instagram.com')) return { type: 'reel', platform: 'instagram', label: 'Reel' }
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { type: 'youtube', platform: 'youtube', label: 'YouTube video' }
    return null
  }

  async function handleQuickAdd() {
    if (!quickUrl.trim()) return
    const detected = detectUrlType(quickUrl)
    if (!detected) {
      setMessage({ type: 'error', text: 'Enter a valid Instagram or YouTube URL' })
      return
    }

    setPosting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: quickUrl,
          source_type: detected.platform,
          content_type: detected.type,
          platform: detected.platform,
          platforms: [detected.platform],
          status: 'pending',
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `${detected.label} added to queue!` })
        setQuickUrl('')
        fetchData()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to add' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add to queue' })
    } finally {
      setPosting(false)
    }
  }

  const statusColor: Record<string, string> = {
    posted: 'text-green-400',
    approved: 'text-blue-400',
    pending: 'text-yellow-400',
    skipped: 'text-gray-400',
    error: 'text-red-400',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media</h1>
          <p className="text-muted-foreground text-sm">Manage your Instagram reels, YouTube videos, and image content</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/social-media/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Create Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Pending" value={stats.pending} icon={Clock} color="border-yellow-500" />
        <StatsCard label="Approved" value={stats.approved} icon={CheckCircle} color="border-blue-500" />
        <StatsCard label="Posted Today" value={stats.postedToday} icon={TrendingUp} color="border-green-500" />
        <StatsCard label="Total Posted" value={stats.totalPosted} icon={Film} color="border-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Add */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Add</h2>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                : 'bg-red-500/10 border border-red-500/20 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="https://instagram.com/reel/... or https://youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button
              onClick={handleQuickAdd}
              disabled={posting || !quickUrl.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {posting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Add'}
            </button>
          </div>

          {quickUrl && quickUrl.includes('instagram.com') && (
            <p className="text-xs text-green-500 mt-2">Valid Instagram URL detected</p>
          )}
          {quickUrl && (quickUrl.includes('youtube.com') || quickUrl.includes('youtu.be')) && (
            <p className="text-xs text-red-400 mt-2 inline-flex items-center gap-1"><Youtube className="h-3.5 w-3.5" /> Valid YouTube URL detected</p>
          )}

          <div className="mt-4 flex gap-2">
            <Link
              href="/admin/social-media/queue"
              className="text-sm text-primary hover:underline"
            >
              View Queue ({stats.pending + stats.approved})
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/admin/social-media/history"
              className="text-sm text-primary hover:underline"
            >
              View History
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/admin/social-media/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.platform} &middot; {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium capitalize ${statusColor[item.status] || 'text-muted-foreground'}`}>
                      {item.status}
                    </span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            <div>
              <p className="font-medium">Add URL</p>
              <p className="text-muted-foreground">Paste Instagram reel or YouTube URL, or use Create Post</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <div>
              <p className="font-medium">Approve</p>
              <p className="text-muted-foreground">Review in queue and approve for processing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <div>
              <p className="font-medium">Auto Process</p>
              <p className="text-muted-foreground">Python downloads, transcribes, generates AI content, uploads</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            <div>
              <p className="font-medium">Posted!</p>
              <p className="text-muted-foreground">YouTube uploads directly, Instagram via Make.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    </div>
  )
}
