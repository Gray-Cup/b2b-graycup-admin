'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { Text } from '@medusajs/ui'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'company_name', label: 'Company' },
  {
    key: 'agenda',
    label: 'Agenda',
    render: (value: unknown) => (
      <Text className="max-w-md text-sm">{String(value ?? '')}</Text>
    ),
  },
]

export function CallRequestsTable() {
  return (
    <>
      <PageHeader
        title="Call Requests"
        description="Callback requests from sales team"
      />
      <DataTable
        tableName="call_requests"
        columns={columns}
        title="Call Requests"
      />
    </>
  )
}
