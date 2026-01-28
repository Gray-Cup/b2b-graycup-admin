'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { Text } from '@medusajs/ui'

const columns = [
  { key: 'company', label: 'Company' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'category', label: 'Category' },
  { key: 'product_name', label: 'Product' },
  { key: 'quantity', label: 'Qty' },
  {
    key: 'details',
    label: 'Details',
    render: (value: unknown) => (
      <Text className="max-w-xs truncate text-sm">{String(value ?? '-')}</Text>
    ),
  },
]

export function ProductRequestsTable() {
  return (
    <>
      <PageHeader
        title="Product Requests"
        description="Requests for products not in catalog"
      />
      <DataTable
        tableName="product_requests"
        columns={columns}
        title="Product Requests"
      />
    </>
  )
}
