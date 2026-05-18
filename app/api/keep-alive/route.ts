import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// This endpoint is hit daily by a cron job (e.g. Vercel Cron or external scheduler)
// to prevent Supabase from pausing the project due to inactivity.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('test_table')
      .insert({ pinged_at: new Date().toISOString() })

    if (error) {
      console.error('Keep-alive insert failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return NextResponse.json({ error: 'Failed to ping' }, { status: 500 })
  }
}
