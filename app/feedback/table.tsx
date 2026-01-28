'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Text } from '@medusajs/ui'

const ratingColors: Record<string, 'green' | 'blue' | 'orange' | 'red'> = {
  Excellent: 'green',
  Good: 'blue',
  Average: 'orange',
  Poor: 'red',
}

const columns = [
  { key: 'company', label: 'Company' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'feedback_type', label: 'Type' },
  {
    key: 'rating',
    label: 'Rating',
    render: (value: unknown) => {
      const rating = String(value ?? '')
      return <Badge color={ratingColors[rating] ?? 'grey'}>{rating}</Badge>
    },
  },
  {
    key: 'feedback',
    label: 'Feedback',
    render: (value: unknown) => (
      <Text className="max-w-xs truncate text-sm">{String(value ?? '')}</Text>
    ),
  },
]

export function FeedbackTable() {
  return (
    <>
      <PageHeader
        title="Feedback"
        description="Customer feedback and ratings"
      />
      <DataTable
        tableName="feedback_submissions"
        columns={columns}
        title="Feedback"
      />
    </>
  )
}
