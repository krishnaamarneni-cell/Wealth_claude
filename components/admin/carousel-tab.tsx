'use client'

import { useState, useEffect } from 'react'
import { Loader2, ChevronRight, ChevronLeft, Download, Save, RotateCcw } from 'lucide-react'
import type {
  CarouselTemplateType,
  CarouselContentPack,
  CarouselContentPackInsert,
  CarouselSlideBase,
  CarouselSlideV6,
  CarouselSlideV7,
  CarouselSlideV8,
  CarouselSlideV9,
  CarouselSlideV10,
} from '@/src/types/database'
import { allCarouselPacks } from '@/lib/carousel-seed-data'
import { renderCarouselSlide } from '@/lib/carousel-renderers'

const TEMPLATE_META: Record<CarouselTemplateType, { name: string; description: string; color: string; fonts: string }> = {
  v3: { name: 'Bold Editorial', description: 'Large type, editorial numbers, green accent bar', color: 'bg-emerald-600', fonts: 'Libre Baskerville + Work Sans' },
  v5: { name: 'Bold Type', description: 'UPPERCASE, ghost numbers, Nike energy', color: 'bg-orange-600', fonts: 'Bricolage Grotesque' },
  v6: { name: 'Data Viz', description: 'Charts, stat callouts, progress meters', color: 'bg-blue-600', fonts: 'Outfit' },
  v7: { name: 'Before/After', description: 'Stacked comparison cards with red→green', color: 'bg-purple-600', fonts: 'DM Sans' },
  v8: { name: 'Myth Busting', description: 'MYTH stamp (red X) + FACT stamp (green ✓)', color: 'bg-red-600', fonts: 'Inter' },
  v9: { name: 'Story Journey', description: 'Vertical timeline, chapters, first-person', color: 'bg-amber-600', fonts: 'Lora + Nunito Sans' },
  v10: { name: 'This vs That', description: 'Split-screen comparison, VS divider', color: 'bg-cyan-600', fonts: 'Plus Jakarta Sans' },
}

type Step = 'pick-template' | 'pick-pack' | 'edit' | 'preview'

interface CarouselTabProps {
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

// All Google Fonts used by carousel templates
const CAROUSEL_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap'

export default function CarouselTab({ onMessage }: CarouselTabProps) {
  const [step, setStep] = useState<Step>('pick-template')
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplateType | null>(null)
  const [selectedPack, setSelectedPack] = useState<CarouselContentPackInsert | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load Google Fonts for carousel template rendering
  useEffect(() => {
    if (!document.querySelector(`link[href*="fonts.googleapis"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = CAROUSEL_FONTS_URL
      document.head.appendChild(link)
    }
  }, [])

  // Editable slide data
  const [editTitle, setEditTitle] = useState('')
  const [editSlides, setEditSlides] = useState<any[]>([])

  // Filter packs by selected template
  const filteredPacks = selectedTemplate
    ? allCarouselPacks.filter(p => p.template_type === selectedTemplate)
    : []

  const selectTemplate = (type: CarouselTemplateType) => {
    setSelectedTemplate(type)
    setStep('pick-pack')
    setCurrentSlide(0)
  }

  const selectPack = (pack: CarouselContentPackInsert) => {
    setSelectedPack(pack)
    setEditTitle(pack.title)
    setEditSlides(JSON.parse(JSON.stringify(pack.slides)))
    setCurrentSlide(0)
    setStep('edit')
  }

  const startBlank = () => {
    if (!selectedTemplate) return
    const blankSlides = getBlankSlides(selectedTemplate)
    setSelectedPack(null)
    setEditTitle('Untitled Carousel')
    setEditSlides(blankSlides)
    setCurrentSlide(0)
    setStep('edit')
  }

  const goBack = () => {
    if (step === 'preview') setStep('edit')
    else if (step === 'edit') setStep('pick-pack')
    else if (step === 'pick-pack') { setStep('pick-template'); setSelectedTemplate(null) }
  }

  const resetAll = () => {
    setStep('pick-template')
    setSelectedTemplate(null)
    setSelectedPack(null)
    setEditSlides([])
    setEditTitle('')
    setCurrentSlide(0)
  }

  const updateSlideField = (slideIdx: number, field: string, value: any) => {
    setEditSlides(prev => {
      const updated = [...prev]
      updated[slideIdx] = { ...updated[slideIdx], [field]: value }
      return updated
    })
  }

  const updateNestedField = (slideIdx: number, parent: string, field: string, value: any) => {
    setEditSlides(prev => {
      const updated = [...prev]
      updated[slideIdx] = {
        ...updated[slideIdx],
        [parent]: { ...updated[slideIdx][parent], [field]: value },
      }
      return updated
    })
  }

  const updateListItem = (slideIdx: number, parent: string, itemIdx: number, value: string) => {
    setEditSlides(prev => {
      const updated = [...prev]
      const list = [...(updated[slideIdx][parent] || [])]
      list[itemIdx] = value
      updated[slideIdx] = { ...updated[slideIdx], [parent]: list }
      return updated
    })
  }

  const handleExport = async () => {
    if (!selectedTemplate) return
    setIsExporting(true)
    try {
      const res = await fetch('/api/social/export-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedTemplate,
          title: editTitle,
          slides: editSlides,
        }),
      })
      const data = await res.json()
      if (data.error) {
        onMessage({ type: 'error', text: data.error })
      } else {
        onMessage({ type: 'success', text: `Exported ${data.images?.length || 0} slides as PNG!` })
      }
    } catch {
      onMessage({ type: 'error', text: 'Export failed. Make sure the export API is running.' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/social/carousel-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedTemplate,
          title: editTitle,
          slides: editSlides,
          category: selectedPack?.category || 'product',
        }),
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

  // ==========================================
  // STEP 1: Pick Template
  // ==========================================
  if (step === 'pick-template') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Choose Carousel Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Each template has a unique visual style. Pick one to start.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(TEMPLATE_META) as [CarouselTemplateType, typeof TEMPLATE_META['v3']][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => selectTemplate(type)}
                className="text-left p-4 rounded-xl border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${meta.color}`}>
                    {type.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{meta.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{meta.description}</p>
                <p className="text-xs text-muted-foreground/60">Fonts: {meta.fonts}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // STEP 2: Pick Content Pack or Start Blank
  // ==========================================
  if (step === 'pick-pack' && selectedTemplate) {
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

        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4">Pre-built Content Packs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {filteredPacks.map((pack, idx) => (
              <button
                key={idx}
                onClick={() => selectPack(pack)}
                className="text-left p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  {pack.is_featured && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500">FEATURED</span>
                  )}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">{pack.category}</span>
                </div>
                <p className="text-sm font-medium mb-1">{pack.title}</p>
                <p className="text-xs text-muted-foreground">{pack.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">{(pack.slides as any[]).length} slides</p>
              </button>
            ))}
          </div>

          <div className="relative flex items-center my-4">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <button
            onClick={startBlank}
            className="w-full p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
          >
            <p className="text-sm font-medium">Start from scratch</p>
            <p className="text-xs text-muted-foreground mt-1">Create a blank carousel with {selectedTemplate.toUpperCase()} template</p>
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // STEP 3: Edit Content + Live Preview
  // ==========================================
  if ((step === 'edit' || step === 'preview') && selectedTemplate) {
    const meta = TEMPLATE_META[selectedTemplate]
    const totalSlides = editSlides.length

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={goBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${meta.color}`}>
            {selectedTemplate.toUpperCase()}
          </span>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 flex-1 min-w-[200px]"
          />
          <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Slide navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              {editSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    idx === currentSlide
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                Slide {currentSlide + 1} of {totalSlides}
              </span>
            </div>

            {/* Slide editor form */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              {renderSlideEditor(selectedTemplate, editSlides, currentSlide, updateSlideField, updateNestedField, updateListItem)}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Live Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">{currentSlide + 1}/{totalSlides}</span>
                  <button
                    onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                    disabled={currentSlide === totalSlides - 1}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* The rendered slide preview */}
              <div
                className="mx-auto bg-black rounded-lg overflow-hidden"
                style={{ width: '100%', maxWidth: 420, aspectRatio: '4/5' }}
                dangerouslySetInnerHTML={{
                  __html: renderCarouselSlide(selectedTemplate, editSlides[currentSlide], currentSlide, totalSlides),
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? 'Exporting...' : 'Export All Slides as PNG'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save to Library'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ============================================
// Slide Editor — renders form fields based on template type
// ============================================
function renderSlideEditor(
  template: CarouselTemplateType,
  slides: any[],
  idx: number,
  updateField: (i: number, field: string, value: any) => void,
  updateNested: (i: number, parent: string, field: string, value: any) => void,
  updateList: (i: number, parent: string, itemIdx: number, value: string) => void,
) {
  const slide = slides[idx]
  if (!slide) return <p className="text-sm text-muted-foreground">No slide data</p>

  const fieldClass = 'w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

  // Common fields: tag, heading, body
  const commonFields = (
    <>
      <div>
        <label className={labelClass}>Tag / Label</label>
        <input value={slide.tag || ''} onChange={e => updateField(idx, 'tag', e.target.value)} className={fieldClass} placeholder="e.g., MISTAKE #01" />
      </div>
      <div>
        <label className={labelClass}>Heading</label>
        <textarea value={slide.heading || ''} onChange={e => updateField(idx, 'heading', e.target.value)} className={fieldClass + ' resize-none'} rows={2} placeholder="Main heading text" />
      </div>
    </>
  )

  switch (template) {
    case 'v3':
    case 'v5':
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Body</label>
            <textarea value={slide.body || ''} onChange={e => updateField(idx, 'body', e.target.value)} className={fieldClass + ' resize-none'} rows={3} placeholder="Description text" />
          </div>
          {template === 'v3' && (
            <div>
              <label className={labelClass}>Fix / Solution (optional)</label>
              <input value={slide.fix || ''} onChange={e => updateField(idx, 'fix', e.target.value)} className={fieldClass} placeholder="e.g., Track performance vs. benchmarks." />
            </div>
          )}
        </>
      )

    case 'v6': {
      const s = slide as CarouselSlideV6
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Body</label>
            <textarea value={s.body || ''} onChange={e => updateField(idx, 'body', e.target.value)} className={fieldClass + ' resize-none'} rows={3} />
          </div>
          <div>
            <label className={labelClass}>Stats (JSON array)</label>
            <textarea
              value={JSON.stringify(s.stats || [], null, 2)}
              onChange={e => {
                try { updateField(idx, 'stats', JSON.parse(e.target.value)) } catch { /* ignore invalid JSON */ }
              }}
              className={fieldClass + ' resize-none font-mono text-xs'}
              rows={4}
              placeholder='[{"label": "Markets", "value": "51"}]'
            />
          </div>
        </>
      )
    }

    case 'v7': {
      const s = slide as CarouselSlideV7
      return (
        <>
          <div>
            <label className={labelClass}>Tag</label>
            <input value={s.tag || ''} onChange={e => updateField(idx, 'tag', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Heading</label>
            <input value={s.heading || ''} onChange={e => updateField(idx, 'heading', e.target.value)} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Before Title</label>
              <input value={s.before?.title || ''} onChange={e => updateNested(idx, 'before', 'title', e.target.value)} className={fieldClass} />
              <label className={`${labelClass} mt-3`}>Before Items</label>
              {(s.before?.items || []).map((item, i) => (
                <input key={i} value={item} onChange={e => updateList(idx, 'before.items', i, e.target.value)} className={fieldClass + ' mb-1.5'} />
              ))}
            </div>
            <div>
              <label className={labelClass}>After Title</label>
              <input value={s.after?.title || ''} onChange={e => updateNested(idx, 'after', 'title', e.target.value)} className={fieldClass} />
              <label className={`${labelClass} mt-3`}>After Items</label>
              {(s.after?.items || []).map((item, i) => (
                <input key={i} value={item} onChange={e => updateList(idx, 'after.items', i, e.target.value)} className={fieldClass + ' mb-1.5'} />
              ))}
            </div>
          </div>
        </>
      )
    }

    case 'v8': {
      const s = slide as CarouselSlideV8
      return (
        <>
          <div>
            <label className={labelClass}>Tag</label>
            <input value={s.tag || ''} onChange={e => updateField(idx, 'tag', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Myth</label>
            <textarea value={s.myth || ''} onChange={e => updateField(idx, 'myth', e.target.value)} className={fieldClass + ' resize-none'} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Fact</label>
            <textarea value={s.fact || ''} onChange={e => updateField(idx, 'fact', e.target.value)} className={fieldClass + ' resize-none'} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Evidence</label>
            <textarea value={s.evidence || ''} onChange={e => updateField(idx, 'evidence', e.target.value)} className={fieldClass + ' resize-none'} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Verdict</label>
            <input value={s.verdict || ''} onChange={e => updateField(idx, 'verdict', e.target.value)} className={fieldClass} />
          </div>
        </>
      )
    }

    case 'v9': {
      const s = slide as CarouselSlideV9
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tag</label>
              <input value={s.tag || ''} onChange={e => updateField(idx, 'tag', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Chapter #</label>
              <input type="number" value={s.chapter || 1} onChange={e => updateField(idx, 'chapter', parseInt(e.target.value))} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Heading</label>
            <textarea value={s.heading || ''} onChange={e => updateField(idx, 'heading', e.target.value)} className={fieldClass + ' resize-none'} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Body (narrative)</label>
            <textarea value={s.body || ''} onChange={e => updateField(idx, 'body', e.target.value)} className={fieldClass + ' resize-none'} rows={4} />
          </div>
          <div>
            <label className={labelClass}>Date / Timeframe</label>
            <input value={s.date || ''} onChange={e => updateField(idx, 'date', e.target.value)} className={fieldClass} placeholder="e.g., Month 6" />
          </div>
        </>
      )
    }

    case 'v10': {
      const s = slide as CarouselSlideV10
      return (
        <>
          <div>
            <label className={labelClass}>Category / Topic</label>
            <input value={s.category || ''} onChange={e => updateField(idx, 'category', e.target.value)} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Left Summary</label>
              <input value={s.left_summary || ''} onChange={e => updateField(idx, 'left_summary', e.target.value)} className={fieldClass} />
              <label className={`${labelClass} mt-3`}>Left Items</label>
              {(s.left_items || []).map((item, i) => (
                <input key={i} value={item} onChange={e => updateList(idx, 'left_items', i, e.target.value)} className={fieldClass + ' mb-1.5'} />
              ))}
            </div>
            <div>
              <label className={labelClass}>Right Summary</label>
              <input value={s.right_summary || ''} onChange={e => updateField(idx, 'right_summary', e.target.value)} className={fieldClass} />
              <label className={`${labelClass} mt-3`}>Right Items</label>
              {(s.right_items || []).map((item, i) => (
                <input key={i} value={item} onChange={e => updateList(idx, 'right_items', i, e.target.value)} className={fieldClass + ' mb-1.5'} />
              ))}
            </div>
          </div>
        </>
      )
    }

    default:
      return <p className="text-sm text-muted-foreground">Unknown template type</p>
  }
}

// ============================================
// Blank slide generators per template
// ============================================
function getBlankSlides(template: CarouselTemplateType): any[] {
  const count = 5
  switch (template) {
    case 'v3':
    case 'v5':
      return Array.from({ length: count }, (_, i) => ({ tag: `SLIDE #${String(i + 1).padStart(2, '0')}`, heading: '', body: '', fix: '' }))
    case 'v6':
      return Array.from({ length: count }, (_, i) => ({ tag: `STAT #${String(i + 1).padStart(2, '0')}`, heading: '', body: '', stats: [], chart_data: [] }))
    case 'v7':
      return Array.from({ length: count }, (_, i) => ({ tag: `COMPARE #${i + 1}`, heading: '', before: { title: 'Before', items: ['', '', '', ''] }, after: { title: 'After', items: ['', '', '', ''] } }))
    case 'v8':
      return Array.from({ length: count }, (_, i) => ({ tag: `MYTH #${i + 1}`, myth: '', fact: '', evidence: '', verdict: '' }))
    case 'v9':
      return Array.from({ length: count }, (_, i) => ({ tag: `CHAPTER ${i + 1}`, chapter: i + 1, heading: '', body: '', date: '' }))
    case 'v10':
      return Array.from({ length: count }, () => ({ category: '', left_items: ['', '', '', '', ''], right_items: ['', '', '', '', ''], left_summary: '', right_summary: '' }))
    default:
      return Array.from({ length: count }, () => ({ tag: '', heading: '', body: '' }))
  }
}
