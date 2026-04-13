import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderNewsImage } from '@/lib/news-image-renderers'
import type { NewsTemplateType } from '@/src/types/database'

/**
 * NEWS QUEUE — Polled by local Python script.
 *
 * GET  → Fetch next queued news image to process (returns HTML + data)
 * POST → Mark as completed with Cloudinary URL
 *
 * Same pattern as /api/video/poll + /api/video/complete
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  // Support both: Authorization header OR ?secret= query param
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const qSecret = req.nextUrl.searchParams.get('secret')
  if (qSecret === secret) return true
  return false
}

// GET — Fetch next queued news image
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('news_image_posts')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ post: null, message: 'No queued news images' })
  }

  // Mark as 'processing'
  await supabase
    .from('news_image_posts')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', data.id)

  // Generate the full HTML page for Playwright to screenshot
  const template = data.template_type as NewsTemplateType
  const html = renderNewsImage(template, {
    headline: data.headline,
    source: data.source,
    category: data.category,
    date: data.date,
    key_points: data.key_points,
    quote: data.quote,
    market_impact: data.market_impact,
    big_stat: data.big_stat,
    timeline_events: data.timeline_events,
    context_points: data.context_points,
  })

  const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0A0A08;}</style>
</head><body style="width:420px;height:525px;overflow:hidden;">
${html}
</body></html>`

  return NextResponse.json({
    post: data,
    html: fullHtml,
    screenshot: {
      width: 420,
      height: 525,
      scale: 2.5714, // 420 * 2.5714 = 1080px
      output_width: 1080,
      output_height: 1350,
    },
  })
}

// POST — Mark as completed with Cloudinary URL
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { post_id, cloudinary_url, status, error: errorMsg } = body

  if (!post_id) {
    return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  if (status === 'error') {
    updates.status = 'error'
  } else if (cloudinary_url) {
    updates.exported_url = cloudinary_url
    updates.status = 'exported'
  }

  const { error } = await supabase
    .from('news_image_posts')
    .update(updates)
    .eq('id', post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If exported, send to Make.com webhook for Instagram + LinkedIn posting
  if (cloudinary_url && process.env.MAKE_WEBHOOK_URL) {
    try {
      // Get the full post data for rich captions
      const { data: post } = await supabase
        .from('news_image_posts')
        .select('headline, category, source, source_url, key_points, quote, market_impact, big_stat, context_points')
        .eq('id', post_id)
        .single()

      if (!post) throw new Error('Post not found')

      const category = (post.category || 'MARKETS').toUpperCase()
      const src = post.source || 'CNBC'
      const keyPoints = (post.key_points as string[]) || []
      const quote = (post.quote as { text?: string; attribution?: string }) || {}
      const bigStat = (post.big_stat as { number?: string; label?: string }) || {}
      const marketImpact = (post.market_impact as { icon?: string; name?: string; change?: string }[]) || []
      const contextPoints = (post.context_points as string[]) || []

      // --- Instagram caption (engaging, visual, hashtag-heavy) ---
      const igParts: string[] = []
      // Hook line
      igParts.push(`${post.headline}`)
      igParts.push('')
      // Big stat if available
      if (bigStat.number) {
        igParts.push(`${bigStat.number} — ${bigStat.label || ''}`)
        igParts.push('')
      }
      // Key points as bullet list
      if (keyPoints.length > 0) {
        igParts.push('Here\'s what you need to know:')
        keyPoints.slice(0, 4).forEach(p => igParts.push(`- ${p}`))
        igParts.push('')
      }
      // Market movers
      if (marketImpact.length > 0) {
        const movers = marketImpact.slice(0, 4).map(m => `${m.icon || ''} ${m.name}: ${m.change}`).join('\n')
        igParts.push(movers)
        igParts.push('')
      }
      // Quote
      if (quote.text) {
        igParts.push(`"${quote.text}" — ${quote.attribution || ''}`)
        igParts.push('')
      }
      // CTA + hashtags
      igParts.push(`Follow @wealthclaude for daily market updates`)
      igParts.push('')
      igParts.push(`Source: ${src}`)
      igParts.push('')
      const igHashtags = `#${category.toLowerCase()} #finance #investing #stockmarket #wealthclaude #news #money #trading #economy #markets`
      igParts.push(igHashtags)
      const igCaption = igParts.join('\n')

      // --- LinkedIn caption (professional, insightful) ---
      const liParts: string[] = []
      // Hook line
      liParts.push(`${post.headline}`)
      liParts.push('')
      // Big stat
      if (bigStat.number) {
        liParts.push(`${bigStat.number} — ${bigStat.label || ''}`)
        liParts.push('')
      }
      // Key takeaways
      if (keyPoints.length > 0) {
        liParts.push('Key takeaways:')
        liParts.push('')
        keyPoints.slice(0, 5).forEach(p => liParts.push(`- ${p}`))
        liParts.push('')
      }
      // Market impact
      if (marketImpact.length > 0) {
        liParts.push('Market impact:')
        marketImpact.slice(0, 4).forEach(m => {
          liParts.push(`${m.icon || ''} ${m.name}: ${m.change}`)
        })
        liParts.push('')
      }
      // Quote
      if (quote.text) {
        liParts.push(`"${quote.text}"`)
        if (quote.attribution) liParts.push(`— ${quote.attribution}`)
        liParts.push('')
      }
      // Context
      if (contextPoints.length > 0) {
        contextPoints.slice(0, 3).forEach(c => liParts.push(`${c}`))
        liParts.push('')
      }
      // Source + CTA
      liParts.push(`Source: ${src}`)
      if (post.source_url) liParts.push(`Read more: ${post.source_url}`)
      liParts.push('')
      liParts.push('Follow Wealth Claude for daily market intelligence.')
      liParts.push('')
      const liHashtags = `#${category.toLowerCase()} #finance #investing #wealthclaude #news #economy`
      liParts.push(liHashtags)
      const liCaption = liParts.join('\n')

      // Generate LinkedIn-sized image via Cloudinary transformation
      // Original: 1080x1350 (4:5 Instagram) → LinkedIn: 1200x627 (1.91:1 landscape)
      // Crops from top (where headline + key info is) and pads if needed
      const linkedinImageUrl = cloudinary_url.replace(
        '/upload/',
        '/upload/c_fill,w_1200,h_627,g_north/'
      )

      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: igCaption,
          linkedin_text: liCaption,
          image_url: cloudinary_url,
          linkedin_image_url: linkedinImageUrl,
          platforms: ['instagram', 'linkedin'],
          content_type: 'image',
          timestamp: new Date().toISOString(),
          source: 'auto-news',
        }),
      })

      // Update status to 'posted'
      await supabase
        .from('news_image_posts')
        .update({ status: 'posted', updated_at: new Date().toISOString() })
        .eq('id', post_id)

    } catch (e) {
      console.error('Make.com webhook failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
