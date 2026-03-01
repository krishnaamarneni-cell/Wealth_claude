"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — WealthClaude | Account Settings',
  description: 'Customize your WealthClaude experience. Manage notifications, display preferences and account settings.',
}

import {
  Settings, Bell, Link2, AlertTriangle,
  CheckCircle2, XCircle, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneralSettings {
  theme: string
  currency: string
  dateFormat: string
}

interface NotificationSettings {
  emailAlerts: boolean
  priceAlerts: boolean
  weeklyDigest: boolean
  earningsAlerts: boolean
}

interface ConnectedAccount {
  id: string
  name: string
  logo: string
  status: "connected" | "disconnected"
  connectedAt?: string
}

// ─── Brokers Config ───────────────────────────────────────────────────────────

const BROKERS: ConnectedAccount[] = [
  { id: "robinhood", name: "Robinhood", logo: "🟢", status: "disconnected" },
  { id: "fidelity", name: "Fidelity", logo: "🟩", status: "disconnected" },
  { id: "webull", name: "Webull", logo: "🔵", status: "disconnected" },
  { id: "charles_schwab", name: "Charles Schwab", logo: "🔷", status: "disconnected" },
  { id: "td_ameritrade", name: "TD Ameritrade", logo: "🟦", status: "disconnected" },
  { id: "etrade", name: "E*TRADE", logo: "⚡", status: "disconnected" },
]

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connected", label: "Connected Accounts", icon: Link2 },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
]

// ─── Main Component ───────────────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") ?? "general"

  const [activeTab, setActiveTab] = useState(defaultTab)

  const [general, setGeneral] = useState<GeneralSettings>({
    theme: "dark",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    priceAlerts: false,
    weeklyDigest: true,
    earningsAlerts: false,
  })

  const [brokers, setBrokers] = useState<ConnectedAccount[]>(BROKERS)

  // Load from localStorage
  useEffect(() => {
    const g = localStorage.getItem("settings_general")
    const n = localStorage.getItem("settings_notifications")
    const b = localStorage.getItem("settings_brokers")
    if (g) setGeneral(JSON.parse(g))
    if (n) setNotifications(JSON.parse(n))
    if (b) setBrokers(JSON.parse(b))
  }, [])

  const saveGeneral = () => {
    localStorage.setItem("settings_general", JSON.stringify(general))
    toast.success("General settings saved")
  }

  const saveNotifications = () => {
    localStorage.setItem("settings_notifications", JSON.stringify(notifications))
    toast.success("Notification preferences saved")
  }

  const toggleBroker = (id: string) => {
    setBrokers((prev) => {
      const updated = prev.map((b) =>
        b.id === id
          ? {
            ...b,
            status: b.status === "connected" ? "disconnected" : "connected",
            connectedAt: b.status === "disconnected" ? new Date().toISOString() : undefined,
          } as ConnectedAccount
          : b
      )
      localStorage.setItem("settings_brokers", JSON.stringify(updated))
      const broker = updated.find((b) => b.id === id)
      toast.success(
        broker?.status === "connected"
          ? `${broker.name} connected`
          : `${broker?.name} disconnected`
      )
      return updated
    })
  }

  const handleClearData = () => {
    localStorage.removeItem("portfolio")
    localStorage.removeItem("transactions")
    toast.success("Portfolio data cleared")
  }

  const handleDeleteAccount = () => {
    localStorage.clear()
    toast.success("Account deleted")
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-6">

        {/* ── Sidebar Tabs ── */}
        <div className="flex flex-col gap-1 w-52 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  tab.id === "danger" && !isActive && "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 min-w-0">

          {/* General */}
          {activeTab === "general" && (
            <div className="rounded-xl border bg-card p-6 space-y-5">
              <h3 className="text-sm font-semibold border-b pb-3">General Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose your display theme
                    </p>
                  </div>
                  <Select
                    value={general.theme}
                    onValueChange={(v) => setGeneral((g) => ({ ...g, theme: v }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default Currency</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Used for portfolio calculations
                    </p>
                  </div>
                  <Select
                    value={general.currency}
                    onValueChange={(v) => setGeneral((g) => ({ ...g, currency: v }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Date Format</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      How dates are displayed
                    </p>
                  </div>
                  <Select
                    value={general.dateFormat}
                    onValueChange={(v) => setGeneral((g) => ({ ...g, dateFormat: v }))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveGeneral}>Save Changes</Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="rounded-xl border bg-card p-6 space-y-5">
              <h3 className="text-sm font-semibold border-b pb-3">Notification Preferences</h3>

              <div className="space-y-4">
                {[
                  {
                    key: "emailAlerts" as const,
                    label: "Email Alerts",
                    desc: "Receive important account notifications via email",
                  },
                  {
                    key: "priceAlerts" as const,
                    label: "Price Alerts",
                    desc: "Get notified when stocks hit your target price",
                  },
                  {
                    key: "weeklyDigest" as const,
                    label: "Weekly Digest",
                    desc: "Weekly summary of your portfolio performance",
                  },
                  {
                    key: "earningsAlerts" as const,
                    label: "Earnings Alerts",
                    desc: "Notifications before earnings reports for holdings",
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={(v) =>
                        setNotifications((n) => ({ ...n, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveNotifications}>Save Preferences</Button>
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          {activeTab === "connected" && (
            <div className="rounded-xl border bg-card p-6 space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold">Connected Accounts</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Link your brokerage accounts to sync portfolio data automatically
                </p>
              </div>

              <div className="space-y-3">
                {brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{broker.logo}</span>
                      <div>
                        <p className="text-sm font-medium">{broker.name}</p>
                        {broker.status === "connected" && broker.connectedAt && (
                          <p className="text-xs text-muted-foreground">
                            Connected{" "}
                            {new Date(broker.connectedAt).toLocaleDateString()}
                          </p>
                        )}
                        {broker.status === "disconnected" && (
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {broker.status === "connected" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge
                        variant={broker.status === "connected" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {broker.status === "connected" ? "Connected" : "Disconnected"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={broker.status === "connected" ? "destructive" : "outline"}
                        onClick={() => toggleBroker(broker.id)}
                      >
                        {broker.status === "connected" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Full broker OAuth integration coming soon. Connections are saved locally for now.
              </p>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === "danger" && (
            <div className="rounded-xl border border-red-500/30 bg-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-red-500 border-b border-red-500/20 pb-3">
                Danger Zone
              </h3>

              <div className="space-y-4">

                {/* Clear Data */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="text-sm font-medium">Clear Portfolio Data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete all transactions and holdings. Cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Clear Data</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all portfolio data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your transactions, holdings, and
                          portfolio history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleClearData}
                        >
                          Yes, clear everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account, all portfolio data,
                          settings, and preferences. This action absolutely cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleDeleteAccount}
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
