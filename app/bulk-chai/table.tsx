'use client'

import { DataTable } from '@/app/components/data-table'
import { PageHeader } from '@/app/components/page-header'
import { DownloadButton } from '@/app/components/download-button'

const columns = [
  { key: 'company_name', label: 'Company' },
  { key: 'name', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'quantity_kg', label: 'Qty (kg)' },
  { key: 'estimated_amount', label: 'Est. Amount' },
]

export function BulkChaiTable() {
  return (
    <>
      <PageHeader
        title="Bulk Chai Price Quotes"
        description="Price quote requests from BulkChai website"
        action={<DownloadButton tableName="bulk_chai_price_quotes" title="Bulk Chai Quotes" />}
      />
      <DataTable
        tableName="bulk_chai_price_quotes"
        columns={columns}
        title="Bulk Chai Price Quotes"
      />
    </>
  )
}
