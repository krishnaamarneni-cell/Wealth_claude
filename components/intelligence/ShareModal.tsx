'use client'

import { useState, useCallback, useRef } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Share2, Loader2, Instagram, Linkedin, MessageCircle } from 'lucide-react'
import type { TabId } from '@/types/intelligence'
import { SharePreview } from './share/SharePreview'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  tab: TabId
  data: any
  date?: string
}

const FORMATS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, desc: '1200 x 627', w: 1200, h: 627 },
  { id: 'instagram', label: 'Instagram', icon: Instagram, desc: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'story', label: 'Story', icon: Instagram, desc: '1080 x 1920', w: 1080, h: 1920 },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: '1200 x 630', w: 1200, h: 630 },
] as const

export function ShareModal({ open, onClose, tab, data, date }: ShareModalProps) {
  const [selected, setSelected] = useState<string>('linkedin')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const dims = FORMATS.find(f => f.id === selected) || FORMATS[0]

  const generate = useCallback(async () => {
    if (!previewRef.current) return
    setLoading(true)
    setError(null)
    setPreview(null)

    // Give DOM a tick to render the preview
    await new Promise(r => setTimeout(r, 100))

    try {
      const dataUrl = await toPng(previewRef.current, {
        width: dims.w,
        height: dims.h,
        pixelRatio: 2, // 2x for crisp output
        cacheBust: true,
        style: {
          position: 'static',
          left: '0',
          transform: 'none',
        },
      })
      setPreview(dataUrl)
    } catch (err: any) {
      console.error('Share image generation failed:', err)
      setError('Failed to generate image. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [dims])

  const handleFormatSelect = (format: string) => {
    setSelected(format)
    setPreview(null)
  }

  const handleGenerate = () => {
    generate()
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
        await navigator.share({ title: `WealthClaude Intelligence — ${tab}`, files: [file] })
      } else {
        handleDownload()
      }
    } catch {
      handleDownload()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Hidden render target — positioned offscreen, rendered at actual dimensions */}
      <SharePreview
        ref={previewRef}
        tab={tab}
        data={data}
        date={date}
        format={selected}
        dims={{ width: dims.w, height: dims.h }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold">Share Intelligence</h2>
              <p className="text-sm text-muted-foreground">Generate a branded image to share</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Format selector */}
          <div className="p-5 border-b border-border">
            <div className="grid grid-cols-4 gap-2">
              {FORMATS.map((f) => {
                const Icon = f.icon
                return (
                  <button
                    key={f.id}
                    onClick={() => handleFormatSelect(f.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      selected === f.id
                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
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

          {/* Content area */}
          <div className="p-5">
            {!preview && !loading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a premium branded image for {FORMATS.find(f => f.id === selected)?.label}
                </p>
                <button
                  onClick={handleGenerate}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Generate Image
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <span className="text-sm text-muted-foreground">Rendering premium image...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-red-400 mb-3">{error}</p>
                <button onClick={handleGenerate} className="text-sm text-primary hover:underline">Try again</button>
              </div>
            )}

            {preview && !loading && (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-border bg-black/50 shadow-lg">
                  <img src={preview} alt="Share preview" className="w-full h-auto" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-2 bg-secondary text-foreground rounded-xl px-5 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
