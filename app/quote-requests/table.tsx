'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'

const columns = [
  { key: 'company_name', label: 'Company' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'product_id', label: 'Product' },
  { key: 'grade', label: 'Grade' },
  { key: 'quantity', label: 'Qty' },
]

export function QuoteRequestsTable() {
  return (
    <>
      <PageHeader
        title="Quote Requests"
        description="Product price quote requests"
      />
      <DataTable
        tableName="quote_requests"
        columns={columns}
        title="Quote Requests"
      />
    </>
  )
}
