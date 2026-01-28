'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { Badge } from '@medusajs/ui'

const columns = [
  { key: 'company_name', label: 'Company' },
  { key: 'category', label: 'Category' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'gst', label: 'GST' },
  {
    key: 'payment_status',
    label: 'Payment',
    render: (value: unknown) => {
      const status = String(value ?? 'pending')
      const color = status === 'paid' ? 'green' : status === 'failed' ? 'red' : 'orange'
      return <Badge color={color}>{status}</Badge>
    },
  },
  {
    key: 'selected_products',
    label: 'Products',
    render: (value: unknown) => {
      const products = Array.isArray(value) ? value : []
      return `${products.length} items`
    },
  },
]

export function SampleRequestsTable() {
  return (
    <>
      <PageHeader
        title="Sample Requests"
        description="Free sample requests with payment"
      />
      <DataTable
        tableName="sample_requests"
        columns={columns}
        title="Sample Requests"
      />
    </>
  )
}
