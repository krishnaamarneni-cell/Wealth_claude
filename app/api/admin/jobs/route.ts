import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerSideClient(cookieStore)
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[jobs] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const body = await request.json()

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title: body.title,
        location: body.location || 'Remote',
        contract: body.contract || 'Unpaid Internship',
        description: body.description || '',
        responsibilities: body.responsibilities || [],
        skills: body.skills || [],
        status: body.status || 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('[jobs] POST error:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
