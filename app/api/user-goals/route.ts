import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(null, { status: 401 })

    const { data, error } = await supabase.from('user_goals').select('*').eq('user_id', user.id).single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return NextResponse.json(null)

    return NextResponse.json({
      targetValue: data.target_value,
      currentSavings: data.current_savings,
      contributionAmount: data.contribution_amount,
      contributionType: data.contribution_type,
      expectedReturn: data.expected_return,
      includePortfolio: data.include_portfolio,
    })
  } catch (e) {
    console.error('[user-goals] GET error:', e)
    return NextResponse.json(null)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { error } = await supabase.from('user_goals').upsert({
      user_id: user.id,
      target_value: body.targetValue,
      current_savings: body.currentSavings,
      contribution_amount: body.contributionAmount,
      contribution_type: body.contributionType,
      expected_return: body.expectedReturn,
      include_portfolio: body.includePortfolio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[user-goals] PUT error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
