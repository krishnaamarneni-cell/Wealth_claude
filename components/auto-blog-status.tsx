'use client'

import { useState, useEffect, useCallback } from 'react'

interface PostResult {
  title: string
  status: 'published' | 'draft'
}

interface RunResult {
  success: boolean
  timeOfDay?: string
  published?: number
  drafts?: number
  failed?: number
  skipped?: number
  posts?: PostResult[]
  error?: string
  startedAt: string
  finishedAt?: string
}

function getNextScheduledTimes(): { label: string; time: Date }[] {
  const now = new Date()
  const today = new Date(now)
  const schedules = [12, 17, 22] // UTC hours = 7AM, 12PM, 5PM EST

  const times: { label: string; time: Date }[] = []
  const labels = ['7:00 AM EST', '12:00 PM EST', '5:00 PM EST']

  for (let i = 0; i < schedules.length; i++) {
    const t = new Date(today)
    t.setUTCHours(schedules[i], 0, 0, 0)
    if (t > now) {
      times.push({ label: labels[i], time: t })
    }
  }

  // If no more times today, show tomorrow's first
  if (times.length === 0) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setUTCHours(schedules[0], 0, 0, 0)
    times.push({ label: labels[0] + ' tomorrow', time: tomorrow })
  }

  return times
}

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return 'Now'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function AutoBlogStatus() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<RunResult | null>(null)
  const [countdown, setCountdown] = useState('')
  const [nextTime, setNextTime] = useState<{ label: string; time: Date } | null>(null)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  // Update countdown every second
  useEffect(() => {
    const tick = () => {
      const times = getNextScheduledTimes()
      if (times.length > 0) {
        setNextTime(times[0])
        setCountdown(formatCountdown(times[0].time))
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate progress bar during run
  useEffect(() => {
    if (!isRunning) { setProgress(0); return }
    setProgress(5)
    const steps = [
      { pct: 15, delay: 1000, log: '🔍 Fetching live market data...' },
      { pct: 30, delay: 4000, log: '📊 Analyzing market movers...' },
      { pct: 45, delay: 7000, log: '✍️ Generating post 1...' },
      { pct: 58, delay: 13000, log: '✍️ Generating post 2...' },
      { pct: 70, delay: 19000, log: '✍️ Generating post 3...' },
      { pct: 82, delay: 25000, log: '✍️ Generating post 4...' },
      { pct: 92, delay: 31000, log: '🖼️ Fetching images...' },
      { pct: 97, delay: 35000, log: '💾 Saving to database...' },
    ]
    const timers = steps.map(({ pct, delay, log }) =>
      setTimeout(() => {
        setProgress(pct)
        setLogs(prev => [...prev, log])
      }, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [isRunning])

  const runNow = useCallback(async () => {
    setIsRunning(true)
    setLogs(['🚀 Starting auto-blog run...'])
    setLastRun(null)

    const startedAt = new Date().toISOString()

    try {
      const res = await fetch('/api/auto-blog', { method: 'GET' })
      const data = await res.json()
      setLastRun({ ...data, startedAt, finishedAt: new Date().toISOString() })
      setLogs(prev => [...prev, data.success ? '✅ Run complete!' : `❌ Error: ${data.error}`])
      setProgress(100)
    } catch (err) {
      setLastRun({ success: false, error: 'Network error', startedAt, finishedAt: new Date().toISOString() })
      setLogs(prev => [...prev, '❌ Network error — check console'])
      setProgress(100)
    } finally {
      setTimeout(() => setIsRunning(false), 500)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="font-semibold text-foreground text-sm">Auto Blog Engine</span>
        </div>
        <button
          onClick={runNow}
          disabled={isRunning}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          {isRunning ? 'Running...' : 'Run Now'}
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">

        {/* Status / countdown */}
        {!isRunning && !lastRun && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Next scheduled run</p>
              <p className="text-sm font-medium text-foreground">
                {nextTime?.label ?? 'Loading...'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Starts in</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{countdown}</p>
            </div>
          </div>
        )}

        {/* Progress bar while running */}
        {isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Generating posts...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Live logs */}
            <div className="bg-black/20 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">{log}</p>
              ))}
              <p className="text-xs text-primary font-mono animate-pulse">▊</p>
            </div>
          </div>
        )}

        {/* Results after run */}
        {!isRunning && lastRun && (
          <div className="space-y-4">
            {lastRun.success ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Published', value: lastRun.published ?? 0, color: 'text-emerald-400' },
                    { label: 'Drafts', value: lastRun.drafts ?? 0, color: 'text-yellow-400' },
                    { label: 'Skipped', value: lastRun.skipped ?? 0, color: 'text-muted-foreground' },
                    { label: 'Failed', value: lastRun.failed ?? 0, color: 'text-red-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Post list */}
                {lastRun.posts && lastRun.posts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posts created</p>
                    {lastRun.posts.map((post, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${post.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                          {post.status}
                        </span>
                        <span className="text-muted-foreground leading-snug">{post.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Next run countdown */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Next run: {nextTime?.label}</span>
                  <span className="tabular-nums">{countdown}</span>
                </div>
              </>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-red-400 mb-1">Run failed</p>
                <p className="text-xs text-muted-foreground">{lastRun.error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Check that PERPLEXITY_API_KEY is set in Vercel env vars.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Schedule info */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Daily schedule (weekdays)</p>
          <div className="flex gap-2">
            {['7:00 AM', '12:00 PM', '5:00 PM'].map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                {t} EST
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
