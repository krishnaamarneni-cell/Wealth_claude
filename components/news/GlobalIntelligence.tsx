'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Zap, RefreshCw, Clock, Shield, BarChart2, Cpu,
  Wheat, AlertTriangle, Radio, Swords, ChevronRight, Bell, ArrowRight
} from 'lucide-react'
import type { IntelligenceBrief, TabId } from '@/types/intelligence'
import { TABS } from '@/types/intelligence'
import { PriorityIndex } from '@/components/intelligence/tabs/PriorityIndex'
import { WarRoom } from '@/components/intelligence/tabs/WarRoom'
import { Markets } from '@/components/intelligence/tabs/Markets'
import { TechAI } from '@/components/intelligence/tabs/TechAI'
import { FoodClimate } from '@/components/intelligence/tabs/FoodClimate'
import { ThreatIndex } from '@/components/intelligence/tabs/ThreatIndex'
import { Signals } from '@/components/intelligence/tabs/Signals'

// ─── Tab Icons ────────────────────────────────────────────────────────────────
const tabIcons: Record<TabId, React.ReactNode> = {
  priority: <BarChart2 className="h-4 w-4" />,
  warroom: <Swords className="h-4 w-4" />,
  markets: <BarChart2 className="h-4 w-4" />,
  techai: <Cpu className="h-4 w-4" />,
  foodclimate: <Wheat className="h-4 w-4" />,
  threat: <AlertTriangle className="h-4 w-4" />,
  signals: <Radio className="h-4 w-4" />,
}

// ─── Time Ago Helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 bg-secondary/50 rounded-xl" />
      <div className="flex gap-2 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-secondary/50 rounded-lg shrink-0" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Newsletter CTA (sidebar) ─────────────────────────────────────────────────
function SidebarNewsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSubmitted(true)
    } catch {}
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wide">Daily Brief</span>
      </div>
      <div className="text-sm font-semibold mb-1">AI intelligence delivered</div>
      <p className="text-xs text-muted-foreground mb-3">
        Get the intelligence brief every morning. Free forever.
      </p>
      {submitted ? (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Zap className="h-3 w-3" /> You're in! First brief arrives tomorrow.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
            required
          />
          <button type="submit" className="w-full bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            Subscribe free
          </button>
        </form>
      )}
    </div>
  )
}

// ─── CTA Card (sidebar) ──────────────────────────────────────────────────────
function SidebarCTA() {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Track your portfolio</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Add stocks and get AI-powered alerts on risks affecting your holdings.
      </p>
      <Link
        href="/auth"
        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-primary/90"
      >
        Start free <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GlobalIntelligence() {
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('priority')

  const fetchBrief = useCallback(async () => {
    try {
      const res = await fetch('/api/intelligence/latest')
      if (!res.ok) throw new Error('Failed to fetch intelligence brief')
      const json = await res.json()
      setBrief(json.brief)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrief()
    const interval = setInterval(fetchBrief, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchBrief])

  if (loading) return <DashboardSkeleton />

  if (error || !brief) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          {brief === null && !error ? 'Intelligence brief is being generated...' : 'Failed to load intelligence brief'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {brief === null && !error ? 'Check back in a few minutes.' : 'Please try again.'}
        </p>
        {error && (
          <button
            onClick={() => { setLoading(true); fetchBrief() }}
            className="mt-4 text-primary text-sm hover:underline flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        )}
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'priority': return <PriorityIndex data={brief.priority_index} />
      case 'warroom': return <WarRoom data={brief.war_room} />
      case 'markets': return <Markets data={brief.markets} />
      case 'techai': return <TechAI data={brief.tech_ai} />
      case 'foodclimate': return <FoodClimate data={brief.food_climate} />
      case 'threat': return <ThreatIndex data={brief.threat_index} />
      case 'signals': return <Signals data={brief.signals} />
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            Global Intelligence
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-red-400 uppercase">Live</span>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Intelligence Dashboard</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Updated {timeAgo(brief.created_at)}
          </span>
          <span className="text-sm text-muted-foreground">
            {brief.source_count} sources processed
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tabIcons[tab.id]}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Content area */}
        <div className="lg:col-span-3">
          {renderTab()}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Tab quick-jump */}
            <div className="bg-card border rounded-xl p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Sections
              </div>
              <div className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tabIcons[tab.id]}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <SidebarNewsletter />
            <SidebarCTA />
          </div>
        </div>
      </div>
    </div>
  )
}
