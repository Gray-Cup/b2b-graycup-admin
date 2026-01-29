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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, data } = body

    if (!table || !validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const supabase = getSupabase()
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const item of data) {
      try {
        // Clean the item - remove id and created_at to let DB generate them
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, Date: _, ID: __, ...cleanItem } = item as Record<string, unknown>

        // Convert formatted values back to original format
        const processedItem: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(cleanItem)) {
          // Skip empty values
          if (value === '' || value === null || value === undefined) continue

          // Convert camelCase or Title Case back to snake_case
          const snakeKey = key
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/\s+/g, '_')

          // Handle special formatted values
          if (snakeKey === 'status') {
            processedItem['resolved'] = value === 'Resolved'
          } else if (snakeKey === 'vaulted') {
            processedItem['vaulted'] = value === 'Yes' || value === true
          } else if (snakeKey !== 'date') {
            // Skip 'date' as it's derived from created_at
            processedItem[snakeKey] = value
          }
        }

        // Ensure required fields have defaults
        if (!('resolved' in processedItem)) {
          processedItem.resolved = false
        }
        if (!('vaulted' in processedItem)) {
          processedItem.vaulted = false
        }

        const { error } = await supabase
          .from(table)
          .insert(processedItem)

        if (error) {
          failedCount++
          if (errors.length < 10) {
            errors.push(`Row failed: ${error.message}`)
          }
        } else {
          successCount++
        }
      } catch (itemError) {
        failedCount++
        if (errors.length < 10) {
          errors.push(`Row processing error: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', success: 0, failed: 0, errors: ['Server error'] },
      { status: 500 }
    )
  }
}
