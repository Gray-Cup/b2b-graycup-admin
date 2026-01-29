'use client'

import { PageHeader } from '@/app/components/page-header'
import { VaultDataTable } from '@/app/components/vault-data-table'
import { DownloadButton } from '@/app/components/download-button'
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

export function VaultSampleRequestsTable() {
  return (
    <>
      <PageHeader
        title="Vault - Sample Requests"
        description="Important sample requests saved for reference"
        action={<DownloadButton tableName="sample_requests" title="Vault - Sample Requests" isVault />}
      />
      <VaultDataTable
        tableName="sample_requests"
        columns={columns}
        title="Sample Requests"
      />
    </>
  )
}
