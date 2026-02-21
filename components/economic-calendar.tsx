"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, AlertCircle, Clock } from "lucide-react"

interface CalEvent {
  event: string
  time: string
  impact: 'high' | 'medium' | 'low'
  estimate: string | null
  prev: string | null
  actual: string | null
  unit: string
}

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso)
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
    }
  } catch { return { date: '—', time: '—' } }
}

function formatValue(val: string | null, unit: string): string {
  if (!val) return '—'
  return unit ? `${val}${unit}` : val
}

export default function EconomicCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/economic-calendar')
      .then(r => r.json())
      .then(data => { setEvents(data.events ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardHeader><div className="h-6 w-48 bg-secondary rounded animate-pulse" /></CardHeader>
      <CardContent className="space-y-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}
      </CardContent>
    </Card>
  )

  if (error || events.length === 0) return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Economic Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No major US economic events in the next 7 days</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Economic Calendar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upcoming US economic events · next 7 days · high & medium impact only
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((ev, i) => {
            const { date, time } = formatDateTime(ev.time)
            const isHigh = ev.impact === 'high'
            const hasActual = ev.actual !== null

            return (
              <div
                key={i}
                className={`p-3 rounded-lg border transition-all ${isHigh
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-secondary/30 border-border hover:bg-secondary/60'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">

                  {/* Left */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 shrink-0 ${isHigh ? 'text-red-500' : 'text-yellow-500'}`}>
                      {isHigh ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{ev.event}</p>
                      <p className="text-xs text-muted-foreground">{date} · {time} ET</p>
                    </div>
                  </div>

                  {/* Right: values */}
                  <div className="flex items-center gap-4 shrink-0 text-right text-xs">
                    {ev.actual !== null ? (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Actual</p>
                        <p className={`font-bold ${ev.estimate && parseFloat(ev.actual) > parseFloat(ev.estimate)
                            ? 'text-green-500' : 'text-red-500'
                          }`}>{formatValue(ev.actual, ev.unit)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Estimate</p>
                        <p className="font-semibold">{formatValue(ev.estimate, ev.unit)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground">Previous</p>
                      <p className="font-medium text-muted-foreground">{formatValue(ev.prev, ev.unit)}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isHigh ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {ev.impact}
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-400" /><span>High impact</span></div>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-400" /><span>Medium impact</span></div>
          <span className="ml-auto">All times in ET</span>
        </div>
      </CardContent>
    </Card>
  )
}
