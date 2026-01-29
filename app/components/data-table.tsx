'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Table, Button, Badge, Text, Input, Select, Checkbox, toast } from '@medusajs/ui'
import { ArrowUpRightOnBox } from '@medusajs/icons'
import { format } from 'date-fns'
import { useSubmissions, updateSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'
import { useWebhooks, bulkForwardToDiscord } from '@/lib/hooks/use-webhooks'

interface Column {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface DataTableProps {
  tableName: string
  columns: Column[]
  title: string
}

export function DataTable({ tableName, columns, title }: DataTableProps) {
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const resolvedParam = filter === 'all' ? null : filter === 'resolved' ? 'true' : 'false'
  const { data, isLoading, isValidating } = useSubmissions({
    table: tableName,
    resolved: resolvedParam,
  })

  const filteredData = useMemo(() => {
    if (!search) return data
    const searchLower = search.toLowerCase()
    return data.filter((row: Record<string, unknown>) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchLower)
      )
    )
  }, [data, search])

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, search])

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
      setSelectedIds(new Set(filteredData.map((row: Record<string, unknown>) => row.id as string)))
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
    return filteredData.filter((row: Record<string, unknown>) => selectedIds.has(row.id as string))
  }, [filteredData, selectedIds])

  const toggleResolved = async (id: string, currentValue: boolean) => {
    try {
      await updateSubmission(tableName, id, !currentValue, resolvedParam)
      toast.success(currentValue ? 'Marked as unresolved' : 'Marked as resolved')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteSubmission(tableName, id, resolvedParam)
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
    <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 items-center">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <Select.Trigger>
              <Select.Value placeholder="Filter" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="unresolved">Unresolved</Select.Item>
              <Select.Item value="resolved">Resolved</Select.Item>
              <Select.Item value="all">All</Select.Item>
            </Select.Content>
          </Select>
          {isValidating && !isLoading && (
            <Text className="text-xs text-ui-fg-muted">Updating...</Text>
          )}

          {/* Select mode toggle and forward button */}
          <Button
            variant={selectMode ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleSelectMode}
          >
            {selectMode ? `${selectedIds.size} Selected` : 'Select'}
          </Button>

          {selectMode && selectedIds.size > 0 && (
            <ForwardDropdown
              tableName={tableName}
              selectedSubmissions={selectedSubmissions}
              onSuccess={clearSelection}
            />
          )}
        </div>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <Text className="text-ui-fg-subtle">Loading...</Text>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-8 text-center bg-ui-bg-base rounded-lg border border-ui-border-base">
          <Text className="text-ui-fg-subtle">No {title.toLowerCase()} found</Text>
        </div>
      ) : (
        <div className="bg-ui-bg-base rounded-lg border border-ui-border-base overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                {selectMode && (
                  <Table.HeaderCell className="w-10">
                    <Checkbox
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </Table.HeaderCell>
                )}
                <Table.HeaderCell>Status</Table.HeaderCell>
                {columns.map((col) => (
                  <Table.HeaderCell key={col.key}>{col.label}</Table.HeaderCell>
                ))}
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredData.map((row: Record<string, unknown>) => (
                <Table.Row
                  key={row.id as string}
                  className={selectMode && selectedIds.has(row.id as string) ? 'bg-ui-bg-subtle' : ''}
                  onClick={selectMode ? () => toggleSelect(row.id as string) : undefined}
                  style={selectMode ? { cursor: 'pointer' } : undefined}
                >
                  {selectMode && (
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(row.id as string)}
                        onCheckedChange={() => toggleSelect(row.id as string)}
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <Badge color={row.resolved ? 'green' : 'orange'}>
                      {row.resolved ? 'Resolved' : 'Pending'}
                    </Badge>
                  </Table.Cell>
                  {columns.map((col) => (
                    <Table.Cell key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as string) ?? '-'}
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <Text className="text-sm text-ui-fg-subtle">
                      {formatDate(row.created_at as string)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <ForwardButton table={tableName} submission={row} />
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => toggleResolved(row.id as string, row.resolved as boolean)}
                      >
                        {row.resolved ? 'Unresolve' : 'Resolve'}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(row.id as string)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      <div className="mt-4">
        <Text className="text-sm text-ui-fg-subtle">
          Showing {filteredData.length} of {data.length} items
        </Text>
      </div>
    </div>
  )
}

// Forward Dropdown Component
function ForwardDropdown({
  tableName,
  selectedSubmissions,
  onSuccess,
}: {
  tableName: string
  selectedSubmissions: Record<string, unknown>[]
  onSuccess: () => void
}) {
  const { data: webhooks, isLoading } = useWebhooks()
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBulkForward = async (webhookId: string, webhookName: string) => {
    setIsSending(true)
    try {
      const result = await bulkForwardToDiscord(webhookId, {
        table: tableName,
        submissions: selectedSubmissions,
      })
      if (result.failed > 0) {
        toast.warning(`Sent ${result.succeeded}/${result.total} to ${webhookName}`)
      } else {
        toast.success(`Sent ${result.succeeded} items to ${webhookName}`)
      }
      setIsOpen(false)
      onSuccess()
    } catch {
      toast.error('Failed to forward')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || webhooks.length === 0) {
    return (
      <Button variant="secondary" size="small" disabled>
        <ArrowUpRightOnBox className="w-4 h-4 mr-2" />
        Forward
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSending}
      >
        <ArrowUpRightOnBox className="w-4 h-4 mr-2" />
        {isSending ? 'Sending...' : 'Forward'}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted font-medium">Send to Discord</Text>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {webhooks.map((webhook) => (
              <button
                key={webhook.id}
                onClick={() => handleBulkForward(webhook.id, webhook.name)}
                disabled={isSending}
                className="w-full px-3 py-2 text-left text-sm text-ui-fg-base hover:bg-ui-bg-subtle transition-colors disabled:opacity-50"
              >
                {webhook.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
