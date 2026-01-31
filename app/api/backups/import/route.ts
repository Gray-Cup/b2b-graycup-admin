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

const BATCH_INSERT_SIZE = 50 // Insert 50 records at a time to Supabase

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, data, skipDuplicates = true } = body

    if (!table || !validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const supabase = getSupabase()
    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Get existing emails to check for duplicates
    let existingEmails: Set<string> = new Set()
    if (skipDuplicates) {
      const { data: existingData } = await supabase
        .from(table)
        .select('email')

      if (existingData) {
        existingEmails = new Set(
          existingData
            .map((item: { email?: string }) => item.email?.toLowerCase())
            .filter((email): email is string => Boolean(email))
        )
      }
    }

    // Process and clean all items first
    const cleanedItems: Record<string, unknown>[] = []

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

        // Check for duplicates based on email
        if (skipDuplicates && processedItem.email) {
          const email = String(processedItem.email).toLowerCase()
          if (existingEmails.has(email)) {
            skippedCount++
            continue
          }
          // Add to existing emails to prevent duplicates within the same import
          existingEmails.add(email)
        }

        cleanedItems.push(processedItem)
      } catch (itemError) {
        failedCount++
        if (errors.length < 10) {
          errors.push(`Row processing error: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
        }
      }
    }

    // Batch insert for better performance with large datasets
    for (let i = 0; i < cleanedItems.length; i += BATCH_INSERT_SIZE) {
      const batch = cleanedItems.slice(i, i + BATCH_INSERT_SIZE)

      try {
        const { error, data: insertedData } = await supabase
          .from(table)
          .insert(batch)
          .select('id')

        if (error) {
          // If batch insert fails, try individual inserts
          for (const item of batch) {
            const { error: singleError } = await supabase
              .from(table)
              .insert(item)

            if (singleError) {
              failedCount++
              if (errors.length < 10) {
                errors.push(`Row failed: ${singleError.message}`)
              }
            } else {
              successCount++
            }
          }
        } else {
          successCount += insertedData?.length || batch.length
        }
      } catch (batchError) {
        // If batch fails completely, count all as failed
        failedCount += batch.length
        if (errors.length < 10) {
          errors.push(`Batch insert error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      errors
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', success: 0, failed: 0, skipped: 0, errors: ['Server error'] },
      { status: 500 }
    )
  }
}
