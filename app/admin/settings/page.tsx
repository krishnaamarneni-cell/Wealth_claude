'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check, AlertCircle, Settings as SettingsIcon } from 'lucide-react'

export default function AdminSettingsPage() {
  const [plansEnabled, setPlansEnabled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current setting
  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        setPlansEnabled(s.plans_enabled === true || s.plans_enabled === 'true')
      })
      .catch(() => setPlansEnabled(false))
      .finally(() => setIsLoading(false))
  }, [])

  const handleToggle = async () => {
    if (plansEnabled === null) return

    const newValue = !plansEnabled
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'plans_enabled', value: newValue }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update setting' })
      } else {
        setPlansEnabled(newValue)
        setMessage({
          type: 'success',
          text: newValue
            ? 'Plans ENABLED. Users now see Free/Pro/Premium gating and pricing.'
            : 'Plans DISABLED. All users now have full access. No pricing shown.',
        })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Request failed' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || plansEnabled === null) {
    return (
      <div className="p-6 min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            App Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Global feature flags and admin-controlled settings
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-500'
              : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Subscription Plans Toggle */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Subscription Plans</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Control whether Free/Pro/Premium tiers are enforced across the app.
            </p>

            <div className="space-y-3 text-sm">
              <div className={plansEnabled ? 'text-foreground' : 'text-muted-foreground'}>
                <span className="font-semibold">When ON:</span> Free users see restricted pages with
                &quot;Upgrade to Pro/Premium&quot; prompts. AI chat is Premium only. Pricing page
                and upgrade buttons are visible.
              </div>
              <div className={!plansEnabled ? 'text-foreground' : 'text-muted-foreground'}>
                <span className="font-semibold">When OFF:</span> All users get full access to
                everything including AI chat. No pricing page, no upgrade prompts, no lock icons.
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleToggle}
              disabled={isSaving}
              aria-label="Toggle subscription plans"
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
                plansEnabled ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                  plansEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
              {isSaving && (
                <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
              )}
            </button>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                plansEnabled ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {plansEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Status info */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                plansEnabled ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-muted-foreground">
              Currently: <span className="font-semibold text-foreground">
                {plansEnabled ? 'Plans enforced' : 'Free access for everyone'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-dashed bg-card/50 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Launch strategy:</p>
        <p>
          Keep plans <span className="font-mono bg-secondary px-1 rounded">OFF</span> while building
          your user base. Once you have your first 1,000 customers and are ready to launch Pro and
          Premium tiers, flip this <span className="font-mono bg-secondary px-1 rounded">ON</span>{' '}
          to activate paywalls. Changes take effect instantly — no redeploy needed.
        </p>
      </div>
    </div>
  )
}
