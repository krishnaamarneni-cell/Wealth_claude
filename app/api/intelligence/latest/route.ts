import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('intelligence_briefs')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ brief: null })
    }

    return NextResponse.json({ brief: data })
  } catch (err: any) {
    console.error('[intelligence-latest] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
