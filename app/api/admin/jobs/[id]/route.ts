import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const ALLOWED_JOB_FIELDS = new Set([
  'title', 'location', 'contract', 'description',
  'responsibilities', 'skills', 'status',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_JOB_FIELDS.has(key)) updateData[key] = value
    }

    const { data, error } = await auth.supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('[jobs] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = await params

    const { error } = await auth.supabase.from('jobs').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
