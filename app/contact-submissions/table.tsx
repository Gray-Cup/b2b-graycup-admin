'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { Text } from '@medusajs/ui'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'company_size', label: 'Size' },
  {
    key: 'message',
    label: 'Message',
    render: (value: unknown) => (
      <Text className="max-w-xs truncate text-sm">{String(value ?? '')}</Text>
    ),
  },
]

export function ContactSubmissionsTable() {
  return (
    <>
      <PageHeader
        title="Contact Submissions"
        description="General inquiries from the contact form"
      />
      <DataTable
        tableName="contact_submissions"
        columns={columns}
        title="Contact Submissions"
      />
    </>
  )
}
