import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Natural events — reads from Supabase cache populated by /api/cron/refresh-pulse.
 * Only the cron endpoint hits NASA EONET directly.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('global_pulse_cache')
      .select('data, updated_at')
      .eq('key', 'natural')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({
        events: [],
        cacheEmpty: !data,
      }, { status: 200 })
    }

    return NextResponse.json({
      ...(data.data as object),
      cacheUpdatedAt: data.updated_at,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err.message }, { status: 200 })
  }
}
