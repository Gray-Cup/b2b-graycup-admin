'use client'

import { PageHeader } from '@/app/components/page-header'
import { VaultDataTable } from '@/app/components/vault-data-table'
import { DownloadButton } from '@/app/components/download-button'

const columns = [
  { key: 'company_name', label: 'Company' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'product_id', label: 'Product' },
  { key: 'grade', label: 'Grade' },
  { key: 'quantity', label: 'Qty' },
]

export function VaultQuoteRequestsTable() {
  return (
    <>
      <PageHeader
        title="Vault - Quote Requests"
        description="Important quote requests saved for reference"
        action={<DownloadButton tableName="quote_requests" title="Vault - Quote Requests" isVault />}
      />
      <VaultDataTable
        tableName="quote_requests"
        columns={columns}
        title="Quote Requests"
      />
    </>
  )
}
