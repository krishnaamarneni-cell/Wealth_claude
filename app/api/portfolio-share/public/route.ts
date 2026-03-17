import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch public portfolio by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const email = searchParams.get('email') // Check if user has paid

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Fetch portfolio
    const { data: portfolio, error } = await supabase
      .from('public_portfolios')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Check if user has paid
    let hasPaid = false
    if (email) {
      const { data: payment } = await supabase
        .from('portfolio_payments')
        .select('id')
        .eq('portfolio_id', portfolio.id)
        .eq('email', email.toLowerCase())
        .eq('status', 'completed')
        .single()

      hasPaid = !!payment
    }

    // Prepare response based on payment status
    const holdings = portfolio.holdings || []
    
    if (hasPaid) {
      // PAID: Return full data
      return NextResponse.json({
        displayName: portfolio.display_name,
        totalGainPercent: portfolio.total_gain_percent,
        todayGainPercent: portfolio.today_gain_percent,
        totalValue: portfolio.total_value,
        totalCost: portfolio.total_cost,
        holdings: holdings,
        updatedAt: portfolio.updated_at,
        hasPaid: true,
      })
    } else {
      // FREE: Return limited data (symbols and return % only)
      const freeHoldings = holdings.map((h: any) => ({
        symbol: h.symbol,
        totalGainPercent: h.totalGainPercent,
        todayGainPercent: h.todayGainPercent,
        sector: h.sector,
        // Hidden fields (set to null)
        shares: null,
        avgCost: null,
        currentPrice: null,
        marketValue: null,
        totalGain: null,
        todayGain: null,
        allocation: null,
      }))

      return NextResponse.json({
        displayName: portfolio.display_name,
        totalGainPercent: portfolio.total_gain_percent,
        todayGainPercent: portfolio.today_gain_percent,
        totalValue: null,        // Hidden
        totalCost: null,         // Hidden
        holdings: freeHoldings,
        updatedAt: portfolio.updated_at,
        hasPaid: false,
        portfolioId: portfolio.id, // For Stripe checkout
      })
    }

  } catch (error: any) {
    console.error('[public-portfolio] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
