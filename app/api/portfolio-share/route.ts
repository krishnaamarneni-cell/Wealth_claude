import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Helper to generate slug from name
function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()
  return base
}

// POST: Create or update shared portfolio
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, holdings, totalValue, totalGainPercent, totalCost, todayGainPercent } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
    }

    // Check if user already has a shared portfolio
    const { data: existing } = await supabase
      .from('public_portfolios')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()

    let slug = generateSlug(firstName, lastName)
    
    // If creating new, check for duplicate slugs
    if (!existing) {
      const { data: slugExists } = await supabase
        .from('public_portfolios')
        .select('slug')
        .eq('slug', slug)
        .single()

      if (slugExists) {
        // Find next available number
        let counter = 2
        while (true) {
          const testSlug = `${slug}-${counter}`
          const { data: exists } = await supabase
            .from('public_portfolios')
            .select('slug')
            .eq('slug', testSlug)
            .single()
          
          if (!exists) {
            slug = testSlug
            break
          }
          counter++
        }
      }
    } else {
      // Keep existing slug if updating
      slug = existing.slug
    }

    // Prepare holdings data (sanitize for public view)
    const publicHoldings = holdings.map((h: any) => ({
      symbol: h.symbol,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      totalGain: h.totalGain,
      totalGainPercent: h.totalGainPercent,
      todayGain: h.todayGain,
      todayGainPercent: h.todayGainPercent,
      allocation: h.allocation,
      sector: h.sector || 'Unknown',
    }))

    const portfolioData = {
      user_id: user.id,
      slug,
      display_name: `${firstName} ${lastName}`,
      holdings: publicHoldings,
      total_value: totalValue,
      total_gain_percent: totalGainPercent,
      total_cost: totalCost,
      today_gain_percent: todayGainPercent,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('public_portfolios')
        .update(portfolioData)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('public_portfolios')
        .insert(portfolioData)
        .select()
        .single()
      
      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      slug: result.slug,
      url: `/u/${result.slug}/portfolio`,
      isNew: !existing,
    })

  } catch (error: any) {
    console.error('[portfolio-share] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to share portfolio' }, { status: 500 })
  }
}

// GET: Get user's shared portfolio status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: portfolio } = await supabase
      .from('public_portfolios')
      .select('id, slug, display_name, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (!portfolio) {
      return NextResponse.json({ shared: false })
    }

    return NextResponse.json({
      shared: true,
      slug: portfolio.slug,
      displayName: portfolio.display_name,
      isActive: portfolio.is_active,
      url: `/u/${portfolio.slug}/portfolio`,
      createdAt: portfolio.created_at,
      updatedAt: portfolio.updated_at,
    })

  } catch (error: any) {
    console.error('[portfolio-share] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Stop sharing portfolio
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('public_portfolios')
      .update({ is_active: false })
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[portfolio-share] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
