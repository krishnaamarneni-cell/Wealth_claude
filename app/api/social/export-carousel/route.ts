import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { renderCarouselSlide } from '@/lib/carousel-renderers'
import type { CarouselTemplateType } from '@/src/types/database'

/**
 * Export carousel slides as HTML.
 * Returns full HTML pages that can be rendered to PNG via Playwright or similar.
 * The actual screenshot capture can be done client-side or via a separate service.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json()
  const { template_type, title, slides } = body as {
    template_type: CarouselTemplateType
    title: string
    slides: any[]
  }

  if (!template_type || !slides || !Array.isArray(slides)) {
    return NextResponse.json({ error: 'template_type and slides array are required' }, { status: 400 })
  }

  // Generate full HTML pages for each slide (ready for screenshot)
  const htmlPages = slides.map((slide, index) => {
    const slideHtml = renderCarouselSlide(template_type, slide, index, slides.length)
    return wrapSlideHtml(slideHtml, template_type)
  })

  return NextResponse.json({
    title,
    template_type,
    slide_count: slides.length,
    html_pages: htmlPages,
    message: 'HTML pages generated. Use Playwright or a screenshot service to convert to PNG at 1080x1350.',
  })
}

function wrapSlideHtml(slideHtml: string, template: CarouselTemplateType): string {
  // Font imports based on template
  const fontMap: Record<string, string> = {
    v3: 'Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600;700',
    v5: 'Bricolage+Grotesque:wght@400;600;700;800',
    v6: 'Outfit:wght@300;400;500;600;700',
    v7: 'DM+Sans:wght@400;500;600;700',
    v8: 'Inter:wght@400;500;600;700',
    v9: 'Lora:wght@400;700&family=Nunito+Sans:wght@400;600;700',
    v10: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  }

  const fontUrl = fontMap[template] || fontMap.v8
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=${fontUrl}&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:420px;height:525px;overflow:hidden;">
${slideHtml}
</body></html>`
}
