'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Mail,
  BookOpen,
  Share2,
  Briefcase,
  UserPlus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

interface OverviewData {
  stats: {
    subscribers: number
    blogPosts: number
    leads: number
    users: number
    videosInQueue: number
    videosPosted: number
  }
  recentBlogs: { id: string; title: string; created_at: string; status: string }[]
  recentSubscribers: { id: string; email: string; created_at: string }[]
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  async function fetchOverview() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/overview')
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error('Failed to fetch overview:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = data?.stats || { subscribers: 0, blogPosts: 0, leads: 0, users: 0, videosInQueue: 0, videosPosted: 0 }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Welcome to the WealthClaude admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.users} icon={Users} color="border-blue-500" />
        <StatCard label="Newsletter Subscribers" value={stats.subscribers} icon={Mail} color="border-green-500" />
        <StatCard label="Blog Posts" value={stats.blogPosts} icon={BookOpen} color="border-purple-500" />
        <StatCard label="Leads" value={stats.leads} icon={UserPlus} color="border-orange-500" />
        <StatCard label="Videos in Queue" value={stats.videosInQueue} icon={Share2} color="border-pink-500" />
        <StatCard label="Videos Posted" value={stats.videosPosted} icon={Share2} color="border-teal-500" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Blog Posts */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Blog Posts</h2>
            <Link href="/admin/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data?.recentBlogs && data.recentBlogs.length > 0 ? (
            <div className="space-y-3">
              {data.recentBlogs.map((blog) => (
                <div key={blog.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{blog.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    blog.status === 'published'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {blog.status || 'draft'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No blog posts yet</p>
          )}
        </div>

        {/* Recent Subscribers */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Subscribers</h2>
          </div>
          {data?.recentSubscribers && data.recentSubscribers.length > 0 ? (
            <div className="space-y-3">
              {data.recentSubscribers.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm font-medium truncate">{sub.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No subscribers yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/social-media/create" icon={Share2} label="Add Reel" />
          <QuickAction href="/admin/blog" icon={BookOpen} label="New Blog Post" />
          <QuickAction href="/admin/careers" icon={Briefcase} label="Manage Jobs" />
          <QuickAction href="/admin/assessments" icon={Users} label="Assessments" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: {
  href: string; icon: React.ComponentType<{ className?: string }>; label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-secondary transition-colors text-center"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
