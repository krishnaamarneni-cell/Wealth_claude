import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' })

    if (error) {
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
