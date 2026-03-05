import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(null, { status: 401 })

    const { data, error } = await supabase.from('user_financial_settings').select('*').eq('user_id', user.id).single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return NextResponse.json(null)

    return NextResponse.json({
      monthlyIncome: data.monthly_income,
      monthlyExpenses: data.monthly_expenses,
      includePortfolio: data.include_portfolio,
      includeDividends: data.include_dividends,
    })
  } catch (e) {
    console.error('[user-financial-settings] GET error:', e)
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
    const { error } = await supabase.from('user_financial_settings').upsert({
      user_id: user.id,
      monthly_income: body.monthlyIncome,
      monthly_expenses: body.monthlyExpenses,
      include_portfolio: body.includePortfolio,
      include_dividends: body.includeDividends,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[user-financial-settings] PUT error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
