import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const tables = [
  { table: 'contact_submissions', label: 'Contact Submissions', href: '/contact-submissions' },
  { table: 'quote_requests', label: 'Quote Requests', href: '/quote-requests' },
  { table: 'sample_requests', label: 'Sample Requests', href: '/sample-requests' },
  { table: 'feedback_submissions', label: 'Feedback', href: '/feedback' },
  { table: 'product_requests', label: 'Product Requests', href: '/product-requests' },
  { table: 'call_requests', label: 'Call Requests', href: '/call-requests' },
]

export async function GET() {
  try {
    const counts = await Promise.all(
      tables.map(async ({ table, label, href }) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false)

        if (error) {
          console.error(`Error fetching ${table}:`, error)
          return { table, label, href, count: 0 }
        }

        return { table, label, href, count: count ?? 0 }
      })
    )

    return NextResponse.json(
      { counts },
      {
        headers: {
          'Cache-Control': 'private, max-age=31536000, stale-while-revalidate=31536000',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching counts:', error)
    // Return empty counts instead of error to prevent UI crash
    return NextResponse.json({
      counts: tables.map(({ table, label, href }) => ({ table, label, href, count: 0 }))
    })
  }
}
