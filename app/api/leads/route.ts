import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Capture new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, interestedInBook2, source = 'start_page' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('leads')
      .select('id, interested_in_book2')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      // Update existing lead if they're now interested in book 2
      if (interestedInBook2 && !existing.interested_in_book2) {
        await supabase
          .from('leads')
          .update({ 
            interested_in_book2: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Welcome back!',
        isReturning: true 
      })
    }

    // Create new lead
    const { error } = await supabase.from('leads').insert({
      email: email.toLowerCase(),
      name: name || null,
      interested_in_book2: interestedInBook2 || false,
      source,
    })

    if (error) {
      console.error('[leads] Insert error:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome! You now have access to all free content.',
      isReturning: false 
    })

  } catch (error: any) {
    console.error('[leads] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save lead' }, { status: 500 })
  }
}

// GET: Check if email has already signed up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, interested_in_book2, created_at')
      .eq('email', email.toLowerCase())
      .single()

    if (!lead) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ 
      exists: true,
      name: lead.name,
      interestedInBook2: lead.interested_in_book2,
      createdAt: lead.created_at,
    })

  } catch (error: any) {
    console.error('[leads] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
