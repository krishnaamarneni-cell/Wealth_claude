import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GDELT events — reads from Supabase cache populated by /api/cron/refresh-pulse.
 * Falls back to empty response if cache is missing (before first cron run).
 *
 * This design avoids GDELT's 1-request-per-5-seconds rate limit because
 * only the cron endpoint hits GDELT directly, not end users.
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
      .eq('key', 'gdelt-events')
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        events: [],
        categories: {},
        error: error.message,
      }, { status: 200 })
    }

    if (!data) {
      // Cache empty — cron hasn't run yet
      return NextResponse.json({
        events: [],
        categories: {},
        cacheEmpty: true,
        message: 'Cache not yet populated. Cron job will fill it shortly.',
      }, { status: 200 })
    }

    return NextResponse.json({
      ...(data.data as object),
      cacheUpdatedAt: data.updated_at,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err: any) {
    return NextResponse.json({
      events: [], categories: {}, error: err.message,
    }, { status: 200 })
  }
}
