"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Mail, User, Clock, MapPin, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
]

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF"]

interface ProfileData {
  fullName: string
  username: string
  email: string
  bio: string
  timezone: string
  currency: string
  avatar: string
  memberSince: string
}

const DEFAULT_PROFILE: ProfileData = {
  fullName: "",
  username: "",
  email: "user@example.com",
  bio: "",
  timezone: "America/New_York",
  currency: "USD",
  avatar: "",
  memberSince: new Date().toISOString(),
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isSaving, setIsSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("userProfile")
    if (saved) setProfile(JSON.parse(saved))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600)) // simulate save
    localStorage.setItem("userProfile", JSON.stringify(profile))
    setIsSaving(false)
    toast.success("Profile saved successfully")
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* ── Avatar + Name Card ── */}
      <div className="rounded-xl border bg-card p-6 flex items-center gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="h-20 w-20 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer ring-2 ring-border hover:ring-primary transition-all"
            onClick={() => fileRef.current?.click()}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Camera className="h-3 w-3 text-primary-foreground" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name + meta */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {profile.fullName || "Your Name"}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{profile.username || "username"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {profile.currency}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {profile.timezone}
            </Badge>
          </div>
        </div>

        {/* Member since */}
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Member since</p>
          <p className="text-sm font-medium">
            {new Date(profile.memberSince).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold border-b pb-3">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              placeholder="John Doe"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Username
            </Label>
            <Input
              placeholder="johndoe"
              value={profile.username}
              onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
            />
          </div>

          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
              <Badge variant="secondary" className="text-xs ml-1">Read-only</Badge>
            </Label>
            <Input
              value={profile.email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Default Currency
            </Label>
            <Select
              value={profile.currency}
              onValueChange={(val) => setProfile((p) => ({ ...p, currency: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Timezone
            </Label>
            <Select
              value={profile.timezone}
              onValueChange={(val) => setProfile((p) => ({ ...p, timezone: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bio */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Bio
            </Label>
            <Textarea
              placeholder="Tell us a little about yourself..."
              className="resize-none"
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
