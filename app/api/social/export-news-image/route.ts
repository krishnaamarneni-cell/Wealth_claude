import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { renderNewsImage } from '@/lib/news-image-renderers'
import type { NewsTemplateType } from '@/src/types/database'

/**
 * Export a news image as HTML.
 * Returns a full HTML page ready for screenshot at 1080x1350 via Playwright.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json()
  const { template_type, headline } = body as {
    template_type: NewsTemplateType
    headline: string
  }

  if (!template_type || !headline) {
    return NextResponse.json({ error: 'template_type and headline are required' }, { status: 400 })
  }

  const slideHtml = renderNewsImage(template_type, {
    headline,
    source: body.source,
    category: body.category,
    date: body.date,
    key_points: body.key_points,
    quote: body.quote,
    market_impact: body.market_impact,
    big_stat: body.big_stat,
    timeline_events: body.timeline_events,
    context_points: body.context_points,
  })

  const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:420px;height:525px;overflow:hidden;">
${slideHtml}
</body></html>`

  return NextResponse.json({
    template_type,
    headline,
    html_page: fullHtml,
    message: 'HTML page generated. Use Playwright to screenshot at 1080x1350 (device_scale_factor=2.5714).',
  })
}
