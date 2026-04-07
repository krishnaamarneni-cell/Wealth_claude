'use client'

import { useState, useCallback } from 'react'
import { X, Download, Share2, Loader2, Instagram, Linkedin, MessageCircle } from 'lucide-react'
import type { TabId } from '@/types/intelligence'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  tab: TabId
  data: any
  date?: string
}

const FORMATS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, desc: '1200 x 627' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, desc: '1080 x 1080' },
  { id: 'story', label: 'Story', icon: Instagram, desc: '1080 x 1920' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: '1200 x 630' },
] as const

export function ShareModal({ open, onClose, tab, data, date }: ShareModalProps) {
  const [selected, setSelected] = useState<string>('linkedin')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (format: string) => {
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const res = await fetch('/api/intelligence/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab, format, data, date }),
      })
      if (!res.ok) throw new Error('Failed to generate image')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreview(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, data, date])

  const handleFormatSelect = (format: string) => {
    setSelected(format)
    generate(format)
  }

  const handleDownload = () => {
    if (!preview) return
    const a = document.createElement('a')
    a.href = preview
    a.download = `wealthclaude-${tab}-${selected}.png`
    a.click()
  }

  const handleNativeShare = async () => {
    if (!preview) return
    try {
      const res = await fetch(preview)
      const blob = await res.blob()
      const file = new File([blob], `wealthclaude-${tab}-${selected}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `WealthClaude Intelligence — ${tab}`,
          files: [file],
        })
      } else {
        handleDownload()
      }
    } catch {
      handleDownload()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Share Intelligence</h2>
            <p className="text-sm text-muted-foreground">Choose a format and download the image</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format selector */}
        <div className="p-5 border-b">
          <div className="grid grid-cols-4 gap-2">
            {FORMATS.map((f) => {
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  onClick={() => handleFormatSelect(f.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    selected === f.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground">{f.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview area */}
        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Generating image...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => generate(selected)}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {preview && !loading && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border bg-black/50">
                <img
                  src={preview}
                  alt="Share preview"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 bg-secondary text-foreground rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          )}

          {!preview && !loading && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a format above to generate your share image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
