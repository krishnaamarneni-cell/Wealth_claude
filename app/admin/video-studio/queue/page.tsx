'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Check, X, Trash2, ExternalLink, Film } from 'lucide-react'
import type { VideoQueueItem, VideoStatusType } from '@/lib/video-studio/types'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Ready', value: 'ready' },
  { label: 'Posted', value: 'posted' },
  { label: 'Skipped', value: 'skipped' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  posted: 'bg-green-500/10 text-green-500 border-green-500/20',
  skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function QueuePage() {
  const [videos, setVideos] = useState<VideoQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchQueue()
  }, [filter])

  async function fetchQueue() {
    setLoading(true)
    try {
      const url = filter === 'all' ? '/api/admin/video-queue' : `/api/admin/video-queue?status=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setVideos(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to fetch queue:', e)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: VideoStatusType) {
    try {
      const res = await fetch(`/api/admin/video-queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) fetchQueue()
    } catch (e) {
      console.error('Failed to update:', e)
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Delete this item from the queue?')) return
    try {
      const res = await fetch(`/api/admin/video-queue/${id}`, { method: 'DELETE' })
      if (res.ok) fetchQueue()
    } catch (e) {
      console.error('Failed to delete:', e)
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
          <h1 className="text-2xl font-bold">Video Queue</h1>
          <p className="text-muted-foreground text-sm">{videos.length} items</p>
        </div>
        <button
          onClick={fetchQueue}
          className="p-2 rounded-lg border hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No videos in queue</p>
          <Link href="/admin/video-studio/create" className="text-primary hover:underline text-sm mt-2 inline-block">
            Add one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="rounded-xl border bg-card overflow-hidden">
              {/* Thumbnail or placeholder */}
              <div className="aspect-video bg-secondary/50 flex items-center justify-center relative">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film className="h-10 w-10 text-muted-foreground/30" />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[video.status] || ''}`}>
                    {video.status}
                  </span>
                </div>
                {video.content_type && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                      {video.content_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm font-medium line-clamp-2 mb-1">
                  {video.title || video.source_url || 'Untitled'}
                </p>
                {video.source_url && (
                  <p className="text-xs text-muted-foreground truncate mb-2">{video.source_url}</p>
                )}
                {video.text_content && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{video.text_content}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(video.created_at).toLocaleDateString()} &middot; {video.platform}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {video.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(video.id, 'approved')}
                        className="flex-1 py-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(video.id, 'skipped')}
                        className="py-1.5 px-3 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <X className="h-3 w-3" /> Skip
                      </button>
                    </>
                  )}
                  {video.status === 'approved' && (
                    <span className="text-xs text-blue-400">Waiting for Python script to process...</span>
                  )}
                  {video.status === 'posted' && video.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View Post
                    </a>
                  )}
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="ml-auto py-1.5 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
