import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

const tableLabels: Record<string, string> = {
  contact_submissions: 'Contact Submission',
  quote_requests: 'Quote Request',
  sample_requests: 'Sample Request',
  feedback_submissions: 'Feedback',
  product_requests: 'Product Request',
  call_requests: 'Call Request',
}

function formatSubmissionForDiscord(table: string, submission: Record<string, unknown>) {
  const label = tableLabels[table] || table
  const fields: { name: string; value: string; inline?: boolean }[] = []

  // Common fields
  if (submission.name) fields.push({ name: 'Name', value: String(submission.name), inline: true })
  if (submission.email) fields.push({ name: 'Email', value: String(submission.email), inline: true })
  if (submission.phone) fields.push({ name: 'Phone', value: String(submission.phone), inline: true })
  if (submission.company) fields.push({ name: 'Company', value: String(submission.company), inline: true })

  // Table-specific fields
  switch (table) {
    case 'contact_submissions':
      if (submission.size) fields.push({ name: 'Company Size', value: String(submission.size), inline: true })
      if (submission.message) fields.push({ name: 'Message', value: String(submission.message) })
      break

    case 'quote_requests':
      if (submission.product) fields.push({ name: 'Product', value: String(submission.product), inline: true })
      if (submission.grade) fields.push({ name: 'Grade', value: String(submission.grade), inline: true })
      if (submission.quantity) fields.push({ name: 'Quantity', value: String(submission.quantity), inline: true })
      if (submission.details) fields.push({ name: 'Details', value: String(submission.details) })
      break

    case 'sample_requests':
      if (submission.products) {
        const products = Array.isArray(submission.products)
          ? submission.products.join(', ')
          : String(submission.products)
        fields.push({ name: 'Products', value: products })
      }
      if (submission.payment_status) fields.push({ name: 'Payment Status', value: String(submission.payment_status), inline: true })
      break

    case 'feedback_submissions':
      if (submission.feedback_type) fields.push({ name: 'Type', value: String(submission.feedback_type), inline: true })
      if (submission.rating) fields.push({ name: 'Rating', value: String(submission.rating), inline: true })
      if (submission.feedback) fields.push({ name: 'Feedback', value: String(submission.feedback) })
      break

    case 'product_requests':
      if (submission.category) fields.push({ name: 'Category', value: String(submission.category), inline: true })
      if (submission.product_name) fields.push({ name: 'Product', value: String(submission.product_name), inline: true })
      if (submission.quantity) fields.push({ name: 'Quantity', value: String(submission.quantity), inline: true })
      if (submission.details) fields.push({ name: 'Details', value: String(submission.details) })
      break

    case 'call_requests':
      if (submission.agenda) fields.push({ name: 'Agenda', value: String(submission.agenda) })
      break
  }

  // Add timestamp
  if (submission.created_at) {
    const date = new Date(String(submission.created_at))
    fields.push({ name: 'Submitted', value: date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }), inline: true })
  }

  return {
    embeds: [{
      title: `New ${label}`,
      color: 0x5865F2,
      fields: fields.map(f => ({
        name: f.name,
        value: f.value.substring(0, 1024), // Discord field value limit
        inline: f.inline ?? false,
      })),
      footer: {
        text: 'GrayCup Admin',
      },
      timestamp: new Date().toISOString(),
    }],
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { webhookId, table, submission } = body

  if (!webhookId || !table || !submission) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Get webhook URL from database
    const supabase = getSupabase()
    const { data: webhook, error: webhookError } = await supabase
      .from('discord_webhooks')
      .select('url')
      .eq('id', webhookId)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Format and send to Discord
    const discordPayload = formatSubmissionForDiscord(table, submission)

    const discordResponse = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('Discord API error:', errorText)
      return NextResponse.json({ error: 'Failed to send to Discord' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error forwarding to Discord:', error)
    return NextResponse.json({ error: 'Failed to forward to Discord' }, { status: 500 })
  }
}
