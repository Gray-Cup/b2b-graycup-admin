'use client'

import { PageHeader } from '@/app/components/page-header'
import { VaultDataTable } from '@/app/components/vault-data-table'
import { DownloadButton } from '@/app/components/download-button'
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

export function VaultContactSubmissionsTable() {
  return (
    <>
      <PageHeader
        title="Vault - Contact Submissions"
        description="Important contact submissions saved for reference"
        action={<DownloadButton tableName="contact_submissions" title="Vault - Contact Submissions" isVault />}
      />
      <VaultDataTable
        tableName="contact_submissions"
        columns={columns}
        title="Contact Submissions"
      />
    </>
  )
}
