import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

const validTables = [
  'contact_submissions',
  'quote_requests',
  'sample_requests',
  'feedback_submissions',
  'product_requests',
  'call_requests',
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const table = searchParams.get('table')
  const resolved = searchParams.get('resolved')

  if (!table || !validTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (resolved === 'true') {
      query = query.eq('resolved', true)
    } else if (resolved === 'false') {
      query = query.eq('resolved', false)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${table}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { table, id, resolved } = body

  if (!table || !validTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from(table)
      .update({ resolved })
      .eq('id', id)

    if (error) {
      console.error(`Error updating ${table}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const table = searchParams.get('table')
  const id = searchParams.get('id')

  if (!table || !validTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting from ${table}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
