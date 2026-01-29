'use client'

import { useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { revalidateAllCaches } from '@/lib/hooks/use-submissions'
import { RealtimeChannel } from '@supabase/supabase-js'

const TABLES = [
  'contact_submissions',
  'quote_requests',
  'sample_requests',
  'feedback_submissions',
  'product_requests',
  'call_requests',
]

export function RealtimeProvider() {
  useEffect(() => {
    const channels: RealtimeChannel[] = []

    // Subscribe to each table for realtime updates
    for (const table of TABLES) {
      const channel = supabaseClient
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`Realtime update on ${table}:`, payload.eventType)
            // Revalidate caches for this table
            revalidateAllCaches(table)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} realtime`)
          }
        })

      channels.push(channel)
    }

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach((channel) => {
        supabaseClient.removeChannel(channel)
      })
    }
  }, [])

  return null
}
