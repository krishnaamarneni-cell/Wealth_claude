import { NextResponse } from 'next/server'

/**
 * USGS Earthquake feed — public domain, no key needed.
 * https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 *
 * Returns magnitude 4.5+ earthquakes in the past day.
 */

interface USGSFeature {
  properties: {
    mag: number
    place: string
    time: number
    url: string
    tsunami: number
    felt: number | null
    title: string
  }
  geometry: {
    coordinates: [number, number, number] // lon, lat, depth
  }
  id: string
}

const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_MS = 10 * 60 * 1000 // 10 min

export async function GET() {
  const now = Date.now()
  const cached = cache.get('earthquakes')
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ ...(cached.data as object), fromCache: true })
  }

  try {
    // M4.5+ earthquakes in the past day — good signal-to-noise
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ earthquakes: [], error: `USGS returned ${res.status}` }, { status: 200 })
    }

    const data = await res.json()
    const features: USGSFeature[] = data.features || []

    const earthquakes = features
      .sort((a, b) => b.properties.time - a.properties.time)
      .slice(0, 15)
      .map(f => ({
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        tsunami: f.properties.tsunami === 1,
        felt: f.properties.felt,
        coordinates: {
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          depth: f.geometry.coordinates[2],
        },
      }))

    const result = { earthquakes, timestamp: now }
    cache.set('earthquakes', { data: result, expiresAt: now + CACHE_MS })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ earthquakes: [], error: err.message || 'Failed to fetch' }, { status: 200 })
  }
}
