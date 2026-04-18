import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * App Settings API
 *
 * GET  → public, returns all app settings (used by tier-context on every page)
 * POST → admin-only, updates a setting
 *
 * Uses service role key so RLS doesn't block writes.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — Public read of all app settings
// Cached for 30s so we don't hammer the DB on every page load
export async function GET() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten into { key: value } for easy client consumption
  const settings: Record<string, any> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  // Default values for missing keys
  if (!('plans_enabled' in settings)) {
    settings.plans_enabled = false
  }

  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}

// POST — Admin-only update
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }
    if (value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, key, value })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update setting' }, { status: 500 })
  }
}
