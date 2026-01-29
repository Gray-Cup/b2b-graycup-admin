'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Input, Select, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, updateSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'

interface CallRequest {
  id: string
  name: string
  phone: string
  company_name: string
  agenda: string
  resolved: boolean
  created_at: string
}

export function CallRequestsTable() {
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved')
  const [search, setSearch] = useState('')

  const resolvedParam = filter === 'all' ? null : filter === 'resolved' ? 'true' : 'false'
  const { data, isLoading, isValidating } = useSubmissions({
    table: 'call_requests',
    resolved: resolvedParam,
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

  const toggleResolved = async (id: string, currentValue: boolean) => {
    try {
      await updateSubmission('call_requests', id, !currentValue, resolvedParam)
      toast.success(currentValue ? 'Marked as unresolved' : 'Marked as resolved')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSubmission('call_requests', id, resolvedParam)
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
        title="Call Requests"
        description="Callback requests from sales team"
      />

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
          <Text className="text-ui-fg-subtle">No call requests found</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Text className="font-medium text-ui-fg-base truncate">{item.name || 'No name'}</Text>
                  <Text className="text-sm text-ui-fg-subtle">{item.company_name || 'No company'}</Text>
                </div>
                <Badge color={item.resolved ? 'green' : 'orange'} className="shrink-0">
                  {item.resolved ? 'Resolved' : 'Pending'}
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
                <div className="flex gap-2">
                  <ForwardButton table="call_requests" submission={item} />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => toggleResolved(item.id, item.resolved)}
                  >
                    {item.resolved ? 'Unresolve' : 'Resolve'}
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
