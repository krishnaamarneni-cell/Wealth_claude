import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get scenarios with their allocations
    const { data: scenarios, error } = await supabase
      .from('rebalance_scenarios')
      .select(`
        id,
        name,
        rebalance_threshold,
        created_at,
        rebalance_allocations (
          symbol,
          target_percent
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error

    // Get last rebalance date
    const { data: history } = await supabase
      .from('rebalance_history')
      .select('last_rebalance_date')
      .eq('user_id', user.id)
      .single()

    const mapped = (scenarios || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      rebalanceThreshold: s.rebalance_threshold,
      targetAllocations: (s.rebalance_allocations || []).map((a: any) => ({
        symbol: a.symbol,
        targetPercent: a.target_percent,
      })),
    }))

    return NextResponse.json({
      scenarios: mapped,
      lastRebalanceDate: history?.last_rebalance_date || '',
    })
  } catch (err: any) {
    console.error('[/api/rebalance] GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { scenario, lastRebalanceDate } = body

    // Save last rebalance date if provided
    if (lastRebalanceDate !== undefined) {
      await supabase
        .from('rebalance_history')
        .upsert({
          user_id: user.id,
          last_rebalance_date: lastRebalanceDate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    // Save scenario if provided
    if (scenario) {
      const { data: savedScenario, error: scenarioError } = await supabase
        .from('rebalance_scenarios')
        .upsert({
          id: scenario.id,
          user_id: user.id,
          name: scenario.name,
          rebalance_threshold: scenario.rebalanceThreshold || 5,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single()

      if (scenarioError) throw scenarioError

      // Delete existing allocations and re-insert
      await supabase
        .from('rebalance_allocations')
        .delete()
        .eq('scenario_id', savedScenario.id)

      if (scenario.targetAllocations?.length > 0) {
        await supabase
          .from('rebalance_allocations')
          .insert(
            scenario.targetAllocations.map((a: any) => ({
              scenario_id: savedScenario.id,
              symbol: a.symbol,
              target_percent: a.targetPercent,
            }))
          )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/rebalance] POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenarioId } = await request.json()

    const { error } = await supabase
      .from('rebalance_scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/rebalance] DELETE error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}