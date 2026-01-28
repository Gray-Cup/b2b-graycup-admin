'use client'

import { useState, useMemo } from 'react'
import { Table, Button, Badge, Text, Input, Select, toast } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions, updateSubmission, deleteSubmission } from '@/lib/hooks/use-submissions'

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
                <Table.Row key={row.id as string}>
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
                  <Table.Cell>
                    <div className="flex gap-2">
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
