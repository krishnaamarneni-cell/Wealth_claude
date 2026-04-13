'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, ChevronLeft, Download, Save, Plus, Trash2, Link, Sparkles, Send } from 'lucide-react'
import type { NewsTemplateType, MarketImpactItem, BigStat, TimelineEvent } from '@/src/types/database'
import { renderNewsImage } from '@/lib/news-image-renderers'

const TEMPLATE_META: Record<NewsTemplateType, { name: string; description: string; color: string; bestFor: string }> = {
  a: { name: 'Breaking Alert', description: 'Red alert bar, big headline, bullets, market impact row', color: 'bg-red-600', bestFor: 'Breaking news, urgent market events' },
  c: { name: 'Editorial + Data', description: 'Giant stat, quote box, stacked data cards', color: 'bg-emerald-600', bestFor: 'Analysis pieces with key statistics' },
  d: { name: 'Ticker Dashboard', description: 'Giant price move, ticker rows with prices', color: 'bg-blue-600', bestFor: 'Stock/crypto price movements' },
  e: { name: 'Timeline', description: 'Vertical event timeline, 3 stat boxes', color: 'bg-amber-600', bestFor: 'Events unfolding over time' },
  f: { name: 'Split Stat + Context', description: 'Giant price top zone, quote + context bottom', color: 'bg-purple-600', bestFor: 'Deep analysis with supporting context' },
}

type Step = 'pick-template' | 'edit'

interface BlogImageTabProps {
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

// Google Fonts needed by news image templates
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'

export default function BlogImageTab({ onMessage }: BlogImageTabProps) {
  const [step, setStep] = useState<Step>('pick-template')
  const [selectedTemplate, setSelectedTemplate] = useState<NewsTemplateType | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [articleUrl, setArticleUrl] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  // Load Google Fonts for template rendering
  useEffect(() => {
    if (!document.querySelector(`link[href*="fonts.googleapis"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = GOOGLE_FONTS_URL
      document.head.appendChild(link)
    }
  }, [])

  // Form fields
  const [headline, setHeadline] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [category, setCategory] = useState('MARKETS')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  const [keyPoints, setKeyPoints] = useState<string[]>(['', '', '', ''])
  const [quoteText, setQuoteText] = useState('')
  const [quoteAttr, setQuoteAttr] = useState('')
  const [marketImpact, setMarketImpact] = useState<MarketImpactItem[]>([
    { icon: '🛢️', name: 'Oil', change: '+0.0%', direction: 'up' },
    { icon: '💵', name: 'USD Index', change: '+0.0%', direction: 'up' },
    { icon: '🌍', name: 'EU Stocks', change: '-0.0%', direction: 'down' },
    { icon: '📈', name: 'S&P 500', change: '+0.0%', direction: 'up' },
  ])
  const [bigStat, setBigStat] = useState<BigStat>({ number: '0%', label: 'Change', color: '' })
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    { time: '9:00 AM', title: 'Event 1', description: 'Description here', color: '#EF4444' },
    { time: '11:00 AM', title: 'Event 2', description: 'Description here', color: '#FBBF24' },
    { time: '2:00 PM', title: 'Event 3', description: 'Description here', color: '#4ADE80' },
  ])
  const [contextPoints, setContextPoints] = useState<string[]>(['', '', ''])

  const selectTemplate = (type: NewsTemplateType) => {
    setSelectedTemplate(type)
    setStep('edit')
  }

  const goBack = () => {
    setStep('pick-template')
    setSelectedTemplate(null)
  }

  const updateKeyPoint = (idx: number, val: string) => {
    setKeyPoints(prev => { const n = [...prev]; n[idx] = val; return n })
  }
  const addKeyPoint = () => setKeyPoints(prev => [...prev, ''])
  const removeKeyPoint = (idx: number) => setKeyPoints(prev => prev.filter((_, i) => i !== idx))

  const updateMarketImpact = (idx: number, field: keyof MarketImpactItem, val: string) => {
    setMarketImpact(prev => {
      const n = [...prev]
      n[idx] = { ...n[idx], [field]: val }
      if (field === 'change') {
        n[idx].direction = val.startsWith('-') ? 'down' : 'up'
      }
      return n
    })
  }

  const updateTimeline = (idx: number, field: keyof TimelineEvent, val: string) => {
    setTimelineEvents(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n })
  }

  const updateContext = (idx: number, val: string) => {
    setContextPoints(prev => { const n = [...prev]; n[idx] = val; return n })
  }

  const getFormData = () => ({
    template_type: selectedTemplate,
    headline,
    source,
    source_url: sourceUrl,
    category,
    date,
    key_points: keyPoints.filter(k => k.trim()),
    quote: { text: quoteText, attribution: quoteAttr },
    market_impact: marketImpact,
    big_stat: bigStat,
    timeline_events: timelineEvents,
    context_points: contextPoints.filter(c => c.trim()),
  })

  const handleCrawlArticle = async () => {
    if (!articleUrl.trim()) {
      onMessage({ type: 'error', text: 'Paste a news article URL first' })
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
      const d = result.data
      // Auto-fill all form fields from AI extraction
      if (d.headline) setHeadline(d.headline)
      if (d.source) setSource(d.source)
      if (d.category) setCategory(d.category)
      if (d.date) setDate(d.date)
      if (d.key_points?.length) setKeyPoints(d.key_points)
      if (d.quote?.text) { setQuoteText(d.quote.text); setQuoteAttr(d.quote.attribution || '') }
      if (d.market_impact?.length) setMarketImpact(d.market_impact)
      if (d.big_stat?.number) setBigStat(d.big_stat)
      if (d.timeline_events?.length) setTimelineEvents(d.timeline_events)
      if (d.context_points?.length) setContextPoints(d.context_points)
      setSourceUrl(articleUrl)
      onMessage({ type: 'success', text: 'Article data extracted! Review and edit below.' })
    } catch {
      onMessage({ type: 'error', text: 'Failed to crawl article' })
    } finally {
      setIsCrawling(false)
    }
  }

  const handleExport = async () => {
    if (!selectedTemplate || !headline.trim()) {
      onMessage({ type: 'error', text: 'Enter a headline first' })
      return
    }
    setIsExporting(true)
    try {
      // Use html2canvas approach — render the preview div to a downloadable image
      const previewEl = previewRef.current
      if (previewEl) {
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(previewEl, {
          width: 420,
          height: 525,
          scale: 2.5714, // 420 * 2.5714 = 1080px output
          backgroundColor: '#0A0A08',
          useCORS: true,
        })
        // Download as PNG
        const link = document.createElement('a')
        link.download = `${headline.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}_${selectedTemplate}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        onMessage({ type: 'success', text: 'Image downloaded as PNG!' })
      } else {
        // Fallback: download as HTML file
        const res = await fetch('/api/social/export-news-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getFormData()),
        })
        const data = await res.json()
        if (data.error) {
          onMessage({ type: 'error', text: data.error })
        } else {
          // Download the HTML file
          const blob = new Blob([data.html_page], { type: 'text/html' })
          const link = document.createElement('a')
          link.download = `news_image_${selectedTemplate}.html`
          link.href = URL.createObjectURL(blob)
          link.click()
          URL.revokeObjectURL(link.href)
          onMessage({ type: 'success', text: 'HTML file downloaded! Open in browser and screenshot at 1080x1350.' })
        }
      }
    } catch {
      // Fallback to HTML download if html2canvas fails
      try {
        const res = await fetch('/api/social/export-news-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getFormData()),
        })
        const data = await res.json()
        if (!data.error) {
          const blob = new Blob([data.html_page], { type: 'text/html' })
          const link = document.createElement('a')
          link.download = `news_image_${selectedTemplate}.html`
          link.href = URL.createObjectURL(blob)
          link.click()
          URL.revokeObjectURL(link.href)
          onMessage({ type: 'success', text: 'HTML file downloaded (install html2canvas for direct PNG export).' })
        }
      } catch {
        onMessage({ type: 'error', text: 'Export failed' })
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate || !headline.trim()) {
      onMessage({ type: 'error', text: 'Enter a headline first' })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/social/news-image-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getFormData()),
      })
      const data = await res.json()
      if (data.error) {
        onMessage({ type: 'error', text: data.error })
      } else {
        onMessage({ type: 'success', text: 'Saved to Supabase!' })
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to save' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePostToSocial = async () => {
    if (!selectedTemplate || !headline.trim()) {
      onMessage({ type: 'error', text: 'Enter a headline first' })
      return
    }
    setIsPosting(true)
    onMessage({ type: 'success', text: 'Queuing for Instagram + LinkedIn...' })
    try {
      // Save to Supabase with status 'queued' so the local Python script picks it up
      const res = await fetch('/api/social/news-image-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...getFormData(), status: 'queued' }),
      })
      const data = await res.json()
      if (data.error) {
        onMessage({ type: 'error', text: data.error })
      } else {
        onMessage({ type: 'success', text: 'Queued! Local script will screenshot, upload to Cloudinary, and post to Instagram + LinkedIn.' })
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to queue post' })
    } finally {
      setIsPosting(false)
    }
  }

  const fieldClass = 'w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

  // ==========================================
  // STEP 1: Pick Template
  // ==========================================
  if (step === 'pick-template') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Choose News Image Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick a template style for your blog/news article image.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(TEMPLATE_META) as [NewsTemplateType, typeof TEMPLATE_META['a']][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => selectTemplate(type)}
                className="text-left p-4 rounded-xl border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${meta.color}`}>
                    {type.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{meta.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{meta.description}</p>
                <p className="text-xs text-muted-foreground/60">Best for: {meta.bestFor}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // STEP 2: Edit + Preview
  // ==========================================
  if (step === 'edit' && selectedTemplate) {
    const meta = TEMPLATE_META[selectedTemplate]

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${meta.color}`}>
            {selectedTemplate.toUpperCase()}
          </span>
          <h2 className="text-lg font-semibold">{meta.name}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* URL Auto-fill */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Auto-fill from Article URL
              </h3>
              <p className="text-xs text-muted-foreground">Paste a CNBC or news article link — AI will extract all the data automatically.</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={articleUrl}
                    onChange={e => setArticleUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCrawlArticle()}
                    className={fieldClass + ' pl-9'}
                    placeholder="https://www.cnbc.com/2026/04/08/..."
                  />
                </div>
                <button
                  onClick={handleCrawlArticle}
                  disabled={isCrawling || !articleUrl.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isCrawling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isCrawling ? 'Extracting...' : 'Extract'}
                </button>
              </div>
            </div>

            {/* Common fields */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold">Article Info</h3>
              <div>
                <label className={labelClass}>Headline *</label>
                <textarea value={headline} onChange={e => setHeadline(e.target.value)} className={fieldClass + ' resize-none'} rows={2} placeholder="Main headline text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Source</label>
                  <input value={source} onChange={e => setSource(e.target.value)} className={fieldClass} placeholder="e.g., CNBC" />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}>
                    <option>MARKETS</option>
                    <option>GEOPOLITICS</option>
                    <option>ECONOMY</option>
                    <option>CRYPTO</option>
                    <option>TECHNOLOGY</option>
                    <option>ENERGY</option>
                    <option>COMMODITIES</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
              </div>
            </div>

            {/* Key Points (for templates A, C, F) */}
            {['a', 'c', 'f'].includes(selectedTemplate) && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Key Points</h3>
                  <button onClick={addKeyPoint} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                {keyPoints.map((point, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={point} onChange={e => updateKeyPoint(i, e.target.value)} className={fieldClass} placeholder={`Point ${i + 1}`} />
                    {keyPoints.length > 1 && (
                      <button onClick={() => removeKeyPoint(i)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quote (for templates C, F) */}
            {['c', 'f'].includes(selectedTemplate) && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Quote</h3>
                <div>
                  <label className={labelClass}>Quote Text</label>
                  <textarea value={quoteText} onChange={e => setQuoteText(e.target.value)} className={fieldClass + ' resize-none'} rows={2} />
                </div>
                <div>
                  <label className={labelClass}>Attribution</label>
                  <input value={quoteAttr} onChange={e => setQuoteAttr(e.target.value)} className={fieldClass} placeholder="e.g., President Trump" />
                </div>
              </div>
            )}

            {/* Market Impact (for templates A, C, D) */}
            {['a', 'c', 'd'].includes(selectedTemplate) && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Market Impact</h3>
                {marketImpact.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <input value={item.icon} onChange={e => updateMarketImpact(i, 'icon', e.target.value)} className={fieldClass} placeholder="🛢️" />
                    <input value={item.name} onChange={e => updateMarketImpact(i, 'name', e.target.value)} className={fieldClass} placeholder="Oil" />
                    <input value={item.change} onChange={e => updateMarketImpact(i, 'change', e.target.value)} className={fieldClass} placeholder="+3.2%" />
                    <input value={item.price || ''} onChange={e => updateMarketImpact(i, 'price', e.target.value)} className={fieldClass} placeholder="$72.50" />
                  </div>
                ))}
              </div>
            )}

            {/* Big Stat (for templates C, D, F) */}
            {['c', 'd', 'f'].includes(selectedTemplate) && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Big Stat</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Number</label>
                    <input value={bigStat.number} onChange={e => setBigStat({ ...bigStat, number: e.target.value })} className={fieldClass} placeholder="50%" />
                  </div>
                  <div>
                    <label className={labelClass}>Label</label>
                    <input value={bigStat.label} onChange={e => setBigStat({ ...bigStat, label: e.target.value })} className={fieldClass} placeholder="tariff rate" />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Events (for template E) */}
            {selectedTemplate === 'e' && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Timeline Events</h3>
                {timelineEvents.map((evt, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-secondary/30">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={evt.time} onChange={e => updateTimeline(i, 'time', e.target.value)} className={fieldClass} placeholder="9:00 AM" />
                      <input value={evt.title} onChange={e => updateTimeline(i, 'title', e.target.value)} className={fieldClass} placeholder="Event title" />
                    </div>
                    <textarea value={evt.description} onChange={e => updateTimeline(i, 'description', e.target.value)} className={fieldClass + ' resize-none'} rows={1} placeholder="Event description" />
                    <div>
                      <label className={labelClass}>Color</label>
                      <input type="color" value={evt.color} onChange={e => updateTimeline(i, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Context Points (for template F) */}
            {selectedTemplate === 'f' && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Context Points</h3>
                {contextPoints.map((point, i) => (
                  <input key={i} value={point} onChange={e => updateContext(i, e.target.value)} className={fieldClass} placeholder={`Context point ${i + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Preview + Actions */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Live Preview</h3>
              <div
                ref={previewRef}
                className="mx-auto bg-black rounded-lg overflow-hidden"
                style={{ width: '100%', maxWidth: 420, aspectRatio: '4/5' }}
                dangerouslySetInnerHTML={{
                  __html: renderNewsImage(selectedTemplate, {
                    headline,
                    source,
                    category,
                    date,
                    key_points: keyPoints.filter(k => k.trim()),
                    quote: { text: quoteText, attribution: quoteAttr },
                    market_impact: marketImpact,
                    big_stat: bigStat,
                    timeline_events: timelineEvents,
                    context_points: contextPoints.filter(c => c.trim()),
                  }),
                }}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePostToSocial}
                disabled={isPosting}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isPosting ? 'Queuing...' : 'Post to Instagram + LinkedIn'}
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? 'Exporting...' : 'Export as PNG'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
