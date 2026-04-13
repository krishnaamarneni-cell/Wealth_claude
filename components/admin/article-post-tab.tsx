'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Link, Send, Download, Eye, RefreshCw } from 'lucide-react'
import type { NewsTemplateType } from '@/src/types/database'
import { renderNewsImage } from '@/lib/news-image-renderers'

const TEMPLATES: { type: NewsTemplateType; name: string; color: string }[] = [
  { type: 'a', name: 'Breaking Alert', color: 'bg-red-600' },
  { type: 'c', name: 'Editorial + Data', color: 'bg-emerald-600' },
  { type: 'd', name: 'Ticker Dashboard', color: 'bg-blue-600' },
  { type: 'e', name: 'Timeline', color: 'bg-amber-600' },
  { type: 'f', name: 'Split Stat', color: 'bg-purple-600' },
]

interface ArticlePostTabProps {
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'

export default function ArticlePostTab({ onMessage }: ArticlePostTabProps) {
  const [articleUrl, setArticleUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NewsTemplateType>('d')
  const [articleData, setArticleData] = useState<any>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!document.querySelector(`link[href*="fonts.googleapis"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = GOOGLE_FONTS_URL
      document.head.appendChild(link)
    }
  }, [])

  const handleExtract = async () => {
    if (!articleUrl.trim()) {
      onMessage({ type: 'error', text: 'Paste an article URL first' })
      return
    }
    setIsCrawling(true)
    onMessage({ type: 'success', text: 'Crawling article and extracting data with AI...' })
    try {
      const res = await fetch('/api/social/crawl-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl }),
      })
      const result = await res.json()
      if (result.error) {
        onMessage({ type: 'error', text: result.error })
        return
      }
      setArticleData({ ...result.data, source_url: articleUrl })

      // Auto-pick template based on category
      const cat = (result.data.category || '').toUpperCase()
      if (cat.includes('BREAKING') || cat.includes('POLITIC') || cat.includes('GEOPOL')) setSelectedTemplate('a')
      else if (cat.includes('MARKET') || cat.includes('STOCK') || cat.includes('CRYPTO')) setSelectedTemplate('d')
      else if (cat.includes('ENERGY') || cat.includes('COMMODIT')) setSelectedTemplate('f')
      else if (cat.includes('ECONOMY') || cat.includes('FED') || cat.includes('RATE')) setSelectedTemplate('c')

      onMessage({ type: 'success', text: 'Article extracted! Review preview and post.' })
    } catch {
      onMessage({ type: 'error', text: 'Failed to crawl article' })
    } finally {
      setIsCrawling(false)
    }
  }

  const handlePost = async () => {
    if (!articleData) {
      onMessage({ type: 'error', text: 'Extract an article first' })
      return
    }
    setIsPosting(true)
    onMessage({ type: 'success', text: 'Queuing for Instagram + LinkedIn...' })
    try {
      const res = await fetch('/api/social/news-image-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedTemplate,
          headline: articleData.headline,
          source: articleData.source || 'News',
          source_url: articleData.source_url || articleUrl,
          category: articleData.category || 'MARKETS',
          date: articleData.date,
          key_points: articleData.key_points || [],
          quote: articleData.quote || {},
          market_impact: articleData.market_impact || [],
          big_stat: articleData.big_stat || {},
          timeline_events: articleData.timeline_events || [],
          context_points: articleData.context_points || [],
          status: 'queued',
        }),
      })
      const data = await res.json()
      if (data.error) {
        onMessage({ type: 'error', text: data.error })
      } else {
        onMessage({ type: 'success', text: 'Queued! Will be posted to Instagram + LinkedIn automatically.' })
        setArticleData(null)
        setArticleUrl('')
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to queue post' })
    } finally {
      setIsPosting(false)
    }
  }

  const handleExport = async () => {
    if (!articleData || !previewRef.current) return
    setIsExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(previewRef.current, {
        width: 420, height: 525, scale: 2.5714, backgroundColor: '#0A0A08', useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `${(articleData.headline || 'article').slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      onMessage({ type: 'success', text: 'Image downloaded!' })
    } catch {
      onMessage({ type: 'error', text: 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const previewHtml = articleData ? renderNewsImage(selectedTemplate, {
    headline: articleData.headline,
    source: articleData.source,
    category: articleData.category,
    date: articleData.date,
    key_points: articleData.key_points || [],
    quote: articleData.quote || {},
    market_impact: articleData.market_impact || [],
    big_stat: articleData.big_stat || {},
    timeline_events: articleData.timeline_events || [],
    context_points: articleData.context_points || [],
  }) : ''

  const fieldClass = 'w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-2">Article to Instagram + LinkedIn</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste any news article URL. AI extracts the data, generates a premium image, and posts to both platforms.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={articleUrl}
              onChange={e => setArticleUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExtract()}
              className={fieldClass + ' pl-10'}
              placeholder="https://www.cnbc.com/2026/04/12/..."
            />
          </div>
          <button
            onClick={handleExtract}
            disabled={isCrawling || !articleUrl.trim()}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors font-semibold inline-flex items-center gap-2 whitespace-nowrap"
          >
            {isCrawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {isCrawling ? 'Extracting...' : 'Extract & Preview'}
          </button>
        </div>
      </div>

      {/* Template Selector + Preview + Post */}
      {articleData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Info + Template */}
          <div className="space-y-4">
            {/* Extracted Info */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Extracted Article</h3>
              <div className="space-y-2">
                <p className="text-base font-bold">{articleData.headline}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-secondary">{articleData.source || 'News'}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary">{articleData.category}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary">{articleData.date}</span>
                </div>
                {articleData.key_points?.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    {articleData.key_points.slice(0, 4).map((p: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-green-500">*</span> {p}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Template Picker */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Template Style</h3>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setSelectedTemplate(t.type)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedTemplate === t.type
                        ? `${t.color} text-white ring-2 ring-white/30`
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePost}
                disabled={isPosting}
                className="w-full py-3.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold text-base inline-flex items-center justify-center gap-2"
              >
                {isPosting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isPosting ? 'Queuing...' : 'Post to Instagram + LinkedIn'}
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? 'Exporting...' : 'Download PNG Only'}
              </button>
              <button
                onClick={() => { setArticleData(null); setArticleUrl('') }}
                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Start Over
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Live Preview</h3>
            <div
              ref={previewRef}
              className="mx-auto bg-black rounded-lg overflow-hidden"
              style={{ width: '100%', maxWidth: 420, aspectRatio: '4/5' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
