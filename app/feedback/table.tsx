'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Input, Select, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, updateSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'
import { ForwardButton } from '@/app/components/forward-button'

interface Feedback {
  id: string
  company: string
  name: string
  email: string
  feedback_type: string
  rating: string
  feedback: string
  resolved: boolean
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

export function FeedbackTable() {
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved')
  const [search, setSearch] = useState('')

  const resolvedParam = filter === 'all' ? null : filter === 'resolved' ? 'true' : 'false'
  const { data, isLoading, isValidating } = useSubmissions({
    table: 'feedback_submissions',
    resolved: resolvedParam,
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

  const toggleResolved = async (id: string, currentValue: boolean) => {
    try {
      await updateSubmission('feedback_submissions', id, !currentValue, resolvedParam)
      toast.success(currentValue ? 'Marked as unresolved' : 'Marked as resolved')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSubmission('feedback_submissions', id, resolvedParam)
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
        title="Feedback"
        description="Customer feedback and ratings"
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
          <Text className="text-ui-fg-subtle">No feedback found</Text>
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
                  <Text className="font-medium text-ui-fg-base truncate">{item.company || 'No company'}</Text>
                  <Text className="text-sm text-ui-fg-subtle">{item.name}</Text>
                </div>
                <Badge color={item.resolved ? 'green' : 'orange'} className="shrink-0">
                  {item.resolved ? 'Resolved' : 'Pending'}
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
                <div className="flex gap-2">
                  <ForwardButton table="feedback_submissions" submission={item} />
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
