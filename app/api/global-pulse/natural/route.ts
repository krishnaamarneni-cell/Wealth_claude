import { NextResponse } from 'next/server'

/**
 * NASA EONET — Earth Observatory Natural Events Tracker
 * https://eonet.gsfc.nasa.gov/docs/v3
 *
 * Public domain, no API key needed.
 * Returns active natural events (wildfires, storms, volcanoes, etc.)
 */

interface EONETEvent {
  id: string
  title: string
  description?: string
  link: string
  categories: { id: string; title: string }[]
  sources: { id: string; url: string }[]
  geometry: {
    date: string
    type: string
    coordinates: number[] | number[][]
  }[]
}

const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_MS = 30 * 60 * 1000 // 30 min — NASA updates hourly

// Category icons to match WealthClaude brand emoji style
const CATEGORY_ICON: Record<string, string> = {
  'Wildfires': '🔥',
  'Severe Storms': '🌀',
  'Volcanoes': '🌋',
  'Sea and Lake Ice': '🧊',
  'Drought': '🌵',
  'Floods': '🌊',
  'Landslides': '⛰️',
  'Earthquakes': '🌐',
  'Dust and Haze': '💨',
  'Snow': '❄️',
  'Temperature Extremes': '🌡️',
  'Water Color': '🌊',
  'Manmade': '🏭',
}

export async function GET() {
  const now = Date.now()
  const cached = cache.get('natural')
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ ...(cached.data as object), fromCache: true })
  }

  try {
    const res = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ events: [], error: `EONET returned ${res.status}` }, { status: 200 })
    }

    const data = await res.json()
    const rawEvents: EONETEvent[] = data.events || []

    const events = rawEvents.slice(0, 12).map(e => {
      const category = e.categories[0]?.title || 'Unknown'
      const latestGeo = e.geometry[e.geometry.length - 1]
      let coords: { lon: number; lat: number } | null = null
      if (latestGeo) {
        const c = latestGeo.coordinates
        if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
          coords = { lon: c[0] as number, lat: c[1] as number }
        }
      }

      return {
        id: e.id,
        title: e.title,
        category,
        icon: CATEGORY_ICON[category] || '📍',
        link: e.link,
        source: e.sources[0]?.url || e.link,
        date: latestGeo?.date || null,
        coordinates: coords,
      }
    })

    const result = { events, timestamp: now }
    cache.set('natural', { data: result, expiresAt: now + CACHE_MS })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err.message || 'Failed to fetch' }, { status: 200 })
  }
}
