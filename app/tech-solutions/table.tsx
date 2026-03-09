'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Input, Checkbox, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'
import { BulkForwardDropdown } from '@/app/components/bulk-forward-dropdown'
import { DownloadButton } from '@/app/components/download-button'

interface TechSolutionsRequest {
  id: string
  name: string
  email: string
  company: string
  interest: 'farms' | 'd2c' | 'both'
  description: string
  phone?: string
  created_at: string
}

const interestLabel: Record<string, string> = {
  farms: 'Farms',
  d2c: 'D2C',
  both: 'Both',
}

const interestColor: Record<string, 'green' | 'blue' | 'purple'> = {
  farms: 'green',
  d2c: 'blue',
  both: 'purple',
}

export function TechSolutionsTable() {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const { data, isLoading, isValidating } = useSubmissions({
    table: 'tech_solutions_requests',
  })

  const filteredData = useMemo(() => {
    if (!search) return data as TechSolutionsRequest[]
    const searchLower = search.toLowerCase()
    return (data as TechSolutionsRequest[]).filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchLower)
      )
    )
  }, [data, search])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [search])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
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
    if (selectMode) setSelectedIds(new Set())
    setSelectMode(!selectMode)
  }

  const selectedSubmissions = useMemo(
    () => filteredData.filter((row) => selectedIds.has(row.id)),
    [filteredData, selectedIds]
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSubmission('tech_solutions_requests', id, null)
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
        title="Tech Solutions Leads"
        description="Inbound leads interested in tech solutions for farms and D2C"
        action={<DownloadButton tableName="tech_solutions_requests" title="Tech Solutions Leads" />}
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
            <Button variant="secondary" size="small" onClick={toggleSelectAll}>
              {selectedIds.size === filteredData.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}

          {selectMode && selectedIds.size > 0 && (
            <BulkForwardDropdown
              tableName="tech_solutions_requests"
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
          <Text className="text-ui-fg-subtle">No tech solutions leads found</Text>
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
                    <Text className="font-medium text-ui-fg-base truncate">{item.name}</Text>
                    <Text className="text-sm text-ui-fg-subtle truncate">{item.company}</Text>
                  </div>
                </div>
                <Badge color={interestColor[item.interest] ?? 'grey'} className="shrink-0">
                  {interestLabel[item.interest] ?? item.interest}
                </Badge>
              </div>

              {/* Contact info */}
              <div className="bg-ui-bg-subtle rounded-md p-3 space-y-1">
                <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">Contact</Text>
                <Text className="text-sm font-medium text-ui-fg-base">{item.email}</Text>
                {item.phone && (
                  <Text className="text-sm text-ui-fg-subtle">{item.phone}</Text>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <div className="flex-1">
                  <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">Description</Text>
                  <Text className="text-sm text-ui-fg-subtle line-clamp-3">{item.description}</Text>
                </div>
              )}

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-3 border-t border-ui-border-base mt-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Text className="text-xs text-ui-fg-muted">{formatDate(item.created_at)}</Text>
                <div className="flex gap-2">
                  <ForwardButton table="tech_solutions_requests" submission={item} />
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
