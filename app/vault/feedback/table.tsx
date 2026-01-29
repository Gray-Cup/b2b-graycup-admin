'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Input, Checkbox, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, vaultSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'
import { BulkForwardDropdown } from '@/app/components/bulk-forward-dropdown'
import { DownloadButton } from '@/app/components/download-button'

interface Feedback {
  id: string
  company: string
  name: string
  email: string
  feedback_type: string
  rating: string
  feedback: string
  resolved: boolean
  vaulted: boolean
  created_at: string
}

const ratingColors: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'grey'> = {
  Excellent: 'green',
  Good: 'blue',
  Average: 'orange',
  Poor: 'red',
}

const ratingEmoji: Record<string, string> = {
  Excellent: '5/5',
  Good: '4/5',
  Average: '3/5',
  Poor: '2/5',
}

export function VaultFeedbackTable() {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const { data, isLoading, isValidating } = useSubmissions({
    table: 'feedback_submissions',
    vaulted: 'true',
  })

  const filteredData = useMemo(() => {
    if (!search) return data as Feedback[]
    const searchLower = search.toLowerCase()
    return (data as Feedback[]).filter((row) =>
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
      await vaultSubmission('feedback_submissions', id, false, null)
      toast.success('Removed from vault')
    } catch {
      toast.error('Failed to remove from vault')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSubmission('feedback_submissions', id, null)
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
        title="Vault - Feedback"
        description="Important feedback saved for reference"
        action={<DownloadButton tableName="feedback_submissions" title="Vault - Feedback" isVault />}
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
              tableName="feedback_submissions"
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
          <Text className="text-ui-fg-subtle">No vaulted feedback</Text>
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
                    <Text className="font-medium text-ui-fg-base truncate">{item.company || 'No company'}</Text>
                    <Text className="text-sm text-ui-fg-subtle">{item.name}</Text>
                  </div>
                </div>
                <Badge color="purple" className="shrink-0">
                  Vaulted
                </Badge>
              </div>

              {/* Rating & Type */}
              <div className="bg-ui-bg-subtle rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Text className="text-xs text-ui-fg-muted uppercase tracking-wide">Type</Text>
                  <Text className="text-sm font-medium text-ui-fg-base">{item.feedback_type || 'General'}</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-xs text-ui-fg-muted uppercase tracking-wide">Rating</Text>
                  <div className="flex items-center gap-2">
                    <Badge color={ratingColors[item.rating] ?? 'grey'}>
                      {item.rating || 'N/A'}
                    </Badge>
                    <Text className="text-sm text-ui-fg-muted">{ratingEmoji[item.rating] || ''}</Text>
                  </div>
                </div>
              </div>

              {/* Feedback Content */}
              {item.feedback && (
                <div className="flex-1">
                  <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">Feedback</Text>
                  <Text className="text-sm text-ui-fg-subtle line-clamp-3">{item.feedback}</Text>
                </div>
              )}

              {/* Contact Info */}
              <div className="text-sm">
                <div className="flex gap-2">
                  <Text className="text-ui-fg-muted shrink-0">Email:</Text>
                  <Text className="text-ui-fg-base truncate">{item.email || '-'}</Text>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-ui-border-base mt-auto">
                <Text className="text-xs text-ui-fg-muted">{formatDate(item.created_at)}</Text>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <ForwardButton table="feedback_submissions" submission={item} />
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
