'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heading, Text } from '@medusajs/ui'

interface TableCount {
  table: string
  label: string
  href: string
  count: number
}

const tableConfig = [
  { table: 'contact_submissions', label: 'Contact Submissions', href: '/contact-submissions' },
  { table: 'quote_requests', label: 'Quote Requests', href: '/quote-requests' },
  { table: 'sample_requests', label: 'Sample Requests', href: '/sample-requests' },
  { table: 'feedback_submissions', label: 'Feedback', href: '/feedback' },
  { table: 'product_requests', label: 'Product Requests', href: '/product-requests' },
  { table: 'call_requests', label: 'Call Requests', href: '/call-requests' },
]

export function DashboardOverview() {
  const [counts, setCounts] = useState<TableCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/dashboard/counts')
        const data = await res.json()
        setCounts(data.counts)
      } catch (error) {
        console.error('Failed to fetch counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  const totalUnresolved = counts.reduce((sum, item) => sum + item.count, 0)

  return (
    <div>
      <div className="mb-8">
        <Heading level="h1" className="mb-2">Dashboard</Heading>
        <Text className="text-ui-fg-subtle">
          Overview of all form submissions
        </Text>
      </div>

      {/* Summary Card */}
      <div className="mb-8 p-6 bg-ui-bg-base rounded-lg border border-ui-border-base shadow-elevation-card-rest">
        <Text className="text-sm text-ui-fg-subtle mb-1">Total Unresolved</Text>
        <Text className="text-3xl font-semibold text-ui-fg-base">
          {loading ? '...' : totalUnresolved}
        </Text>
      </div>

      {/* Table Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tableConfig.map((config) => {
          const countData = counts.find(c => c.table === config.table)
          const count = countData?.count ?? 0

          return (
            <Link
              key={config.table}
              href={config.href}
              className="block p-6 bg-ui-bg-base rounded-lg border border-ui-border-base shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-shadow"
            >
              <Text className="text-sm text-ui-fg-subtle mb-1">{config.label}</Text>
              <div className="flex items-baseline gap-2">
                <Text className="text-2xl font-semibold text-ui-fg-base">
                  {loading ? '...' : count}
                </Text>
                <Text className="text-sm text-ui-fg-muted">unresolved</Text>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
