'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Input, Checkbox, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, vaultSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'
import { BulkForwardDropdown } from '@/app/components/bulk-forward-dropdown'
import { DownloadButton } from '@/app/components/download-button'

interface CallRequest {
  id: string
  name: string
  phone: string
  company_name: string
  agenda: string
  resolved: boolean
  vaulted: boolean
  created_at: string
}

export function VaultCallRequestsTable() {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const { data, isLoading, isValidating } = useSubmissions({
    table: 'call_requests',
    vaulted: 'true',
  })

  const filteredData = useMemo(() => {
    if (!search) return data as CallRequest[]
    const searchLower = search.toLowerCase()
    return (data as CallRequest[]).filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchLower)
      )
    )
  }, [data, search])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [search])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredData.map((row) => row.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedIds(new Set())
    }
    setSelectMode(!selectMode)
  }

  const selectedSubmissions = useMemo(() => {
    return filteredData.filter((row) => selectedIds.has(row.id))
  }, [filteredData, selectedIds])

  const handleUnvault = async (id: string) => {
    try {
      await vaultSubmission('call_requests', id, false, null)
      toast.success('Removed from vault')
    } catch {
      toast.error('Failed to remove from vault')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSubmission('call_requests', id, null)
      toast.success('Deleted successfully')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  return (
    <>
      <PageHeader
        title="Vault - Call Requests"
        description="Important call requests saved for reference"
        action={<DownloadButton tableName="call_requests" title="Vault - Call Requests" isVault />}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          {isValidating && !isLoading && (
            <Text className="text-xs text-ui-fg-muted">Updating...</Text>
          )}

          <Button
            variant={selectMode ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleSelectMode}
          >
            {selectMode ? `${selectedIds.size} Selected` : 'Select'}
          </Button>

          {selectMode && filteredData.length > 0 && (
            <Button
              variant="secondary"
              size="small"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === filteredData.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}

          {selectMode && selectedIds.size > 0 && (
            <BulkForwardDropdown
              tableName="call_requests"
              selectedSubmissions={selectedSubmissions}
              onSuccess={clearSelection}
            />
          )}
        </div>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-full sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <Text className="text-ui-fg-subtle">Loading...</Text>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-8 text-center bg-ui-bg-base rounded-lg border border-ui-border-base">
          <Text className="text-ui-fg-subtle">No vaulted call requests</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className={`bg-ui-bg-base rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
                selectMode && selectedIds.has(item.id)
                  ? 'border-ui-border-interactive bg-ui-bg-subtle'
                  : 'border-ui-border-base'
              } ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleSelect(item.id) : undefined}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {selectMode && (
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Text className="font-medium text-ui-fg-base truncate">{item.name || 'No name'}</Text>
                    <Text className="text-sm text-ui-fg-subtle">{item.company_name || 'No company'}</Text>
                  </div>
                </div>
                <Badge color="purple" className="shrink-0">
                  Vaulted
                </Badge>
              </div>

              {/* Phone */}
              <div className="bg-ui-bg-subtle rounded-md p-3">
                <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">Phone</Text>
                <Text className="font-medium text-ui-fg-base">{item.phone || '-'}</Text>
              </div>

              {/* Agenda */}
              {item.agenda && (
                <div className="flex-1">
                  <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">Agenda</Text>
                  <Text className="text-sm text-ui-fg-subtle line-clamp-3">{item.agenda}</Text>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-ui-border-base mt-auto">
                <Text className="text-xs text-ui-fg-muted">{formatDate(item.created_at)}</Text>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <ForwardButton table="call_requests" submission={item} />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleUnvault(item.id)}
                  >
                    Unvault
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Text className="text-sm text-ui-fg-subtle">
          Showing {filteredData.length} of {data.length} items
        </Text>
      </div>
    </>
  )
}
