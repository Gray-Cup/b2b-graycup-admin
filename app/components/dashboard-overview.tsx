'use client'

import Link from 'next/link'
import { Heading, Text } from '@medusajs/ui'
import { useDashboardCounts } from '@/lib/hooks/use-submissions'

const tableConfig = [
  { table: 'contact_submissions', label: 'Contact Submissions', href: '/contact-submissions' },
  { table: 'quote_requests', label: 'Quote Requests', href: '/quote-requests' },
  { table: 'sample_requests', label: 'Sample Requests', href: '/sample-requests' },
  { table: 'feedback_submissions', label: 'Feedback', href: '/feedback' },
  { table: 'product_requests', label: 'Product Requests', href: '/product-requests' },
  { table: 'call_requests', label: 'Call Requests', href: '/call-requests' },
]

export function DashboardOverview() {
  const { counts, isLoading } = useDashboardCounts()

  const totalUnresolved = (counts ?? []).reduce((sum, item) => sum + (item.count ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Heading level="h1" className="mb-2">Dashboard</Heading>
        <Text className="text-ui-fg-subtle">
          Overview of all form submissions
        </Text>
      </div>

      {/* Summary Card */}
      <div className="mb-6 p-4 bg-ui-bg-base rounded-lg border border-ui-border-base ">
        <Text className="text-xs text-ui-fg-subtle mb-0.5">Total Unresolved</Text>
        <Text className="text-2xl font-semibold text-ui-fg-base">
          {isLoading ? '...' : totalUnresolved}
        </Text>
      </div>

      {/* Table Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tableConfig.map((config) => {
          const countData = (counts ?? []).find(c => c.table === config.table)
          const count = countData?.count ?? 0

          return (
            <Link
              key={config.table}
              href={config.href}
              className="block p-4 bg-ui-bg-base rounded-lg border border-ui-border-base transition-shadow"
            >
              <Text className="text-xs text-ui-fg-subtle mb-0.5">{config.label}</Text>
              <div className="flex items-baseline gap-1.5">
                <Text className="text-xl font-semibold text-ui-fg-base">
                  {isLoading ? '...' : count}
                </Text>
                <Text className="text-xs text-ui-fg-muted">unresolved</Text>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
