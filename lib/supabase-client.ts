import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client for realtime subscriptions
// Uses the publishable key for client-side access (safe to expose)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Prefer new publishable key format, fall back to legacy anon key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or Supabase client key. ' +
    'Set either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy)'
  )
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
