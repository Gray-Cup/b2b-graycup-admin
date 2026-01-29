'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button, Text, IconButton } from '@medusajs/ui'
import { BarsThree, XMark, ChevronDownMini } from '@medusajs/icons'
import { RealtimeProvider } from './realtime-provider'
import { useDashboardCounts, useVaultCounts } from '@/lib/hooks/use-submissions'

const submissionsNavigation = [
  { name: 'Contact Submissions', href: '/contact-submissions', table: 'contact_submissions' },
  { name: 'Quote Requests', href: '/quote-requests', table: 'quote_requests' },
  { name: 'Sample Requests', href: '/sample-requests', table: 'sample_requests' },
  { name: 'Feedback', href: '/feedback', table: 'feedback_submissions' },
  { name: 'Product Requests', href: '/product-requests', table: 'product_requests' },
  { name: 'Call Requests', href: '/call-requests', table: 'call_requests' },
]

const vaultNavigation = [
  { name: 'Call Requests', href: '/vault/call-requests', table: 'call_requests' },
  { name: 'Product Requests', href: '/vault/product-requests', table: 'product_requests' },
  { name: 'Feedback', href: '/vault/feedback', table: 'feedback_submissions' },
  { name: 'Sample Requests', href: '/vault/sample-requests', table: 'sample_requests' },
  { name: 'Quote Requests', href: '/vault/quote-requests', table: 'quote_requests' },
  { name: 'Contact Submissions', href: '/vault/contact-submissions', table: 'contact_submissions' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [submissionsOpen, setSubmissionsOpen] = useState(() => {
    // Auto-expand if current path is a submission page
    return submissionsNavigation.some(item => pathname === item.href)
  })
  const [vaultOpen, setVaultOpen] = useState(() => {
    // Auto-expand if current path is a vault page
    return pathname.startsWith('/vault')
  })
  const { counts } = useDashboardCounts()
  const { counts: vaultCounts } = useVaultCounts()

  // Get total unresolved count for the badge
  const totalUnresolved = counts.reduce((sum, c) => sum + c.count, 0)

  // Get total vaulted count for the badge
  const totalVaulted = vaultCounts.reduce((sum, c) => sum + c.count, 0)

  // Get count for a specific table
  const getCount = (table: string) => {
    const found = counts.find(c => c.table === table)
    return found?.count ?? 0
  }

  // Get vault count for a specific table
  const getVaultCount = (table: string) => {
    const found = vaultCounts.find(c => c.table === table)
    return found?.count ?? 0
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-ui-bg-subtle">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ui-bg-overlay z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-72 bg-ui-bg-base border-r border-ui-border-base z-50
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Close button */}
          <div className="p-3 lg:p-4 border-b border-ui-border-base flex items-center justify-between">
            <Text className="text-sm lg:text-base font-semibold text-ui-fg-base">GrayCup Admin</Text>
            <IconButton
              variant="transparent"
              className="lg:hidden"
              onClick={closeSidebar}
            >
              <XMark />
            </IconButton>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 lg:p-3 space-y-0.5 overflow-y-auto">
            {/* Dashboard */}
            <Link
              href="/"
              onClick={closeSidebar}
              className={`
                block px-3 py-2 text-sm rounded-md transition-colors
                ${pathname === '/'
                  ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                  : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                }
              `}
            >
              Dashboard
            </Link>

            {/* Submissions & Requests Collapsible */}
            <div>
              <button
                onClick={() => setSubmissionsOpen(!submissionsOpen)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                  ${submissionsNavigation.some(item => pathname === item.href)
                    ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                    : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  Submissions & Requests
                  {totalUnresolved > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-medium bg-orange-100 text-orange-700 rounded-full">
                      {totalUnresolved > 99 ? '99+' : totalUnresolved}
                    </span>
                  )}
                </span>
                <ChevronDownMini
                  className={`w-4 h-4 transition-transform ${submissionsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {submissionsOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-ui-border-base pl-3">
                  {submissionsNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const count = getCount(item.table)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        className={`
                          flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors
                          ${isActive
                            ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                            : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                          }
                        `}
                      >
                        <span>{item.name}</span>
                        {count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-medium bg-orange-100 text-orange-700 rounded-full">
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Vault Collapsible */}
            <div>
              <button
                onClick={() => setVaultOpen(!vaultOpen)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                  ${pathname.startsWith('/vault')
                    ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                    : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  Vault
                  {totalVaulted > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-medium bg-purple-100 text-purple-700 rounded-full">
                      {totalVaulted > 99 ? '99+' : totalVaulted}
                    </span>
                  )}
                </span>
                <ChevronDownMini
                  className={`w-4 h-4 transition-transform ${vaultOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {vaultOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-ui-border-base pl-3">
                  {vaultNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const count = getVaultCount(item.table)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        className={`
                          flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors
                          ${isActive
                            ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                            : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                          }
                        `}
                      >
                        <span>{item.name}</span>
                        {count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Analyze Feedback */}
            <Link
              href="/analyze"
              onClick={closeSidebar}
              className={`
                block px-3 py-2 text-sm rounded-md transition-colors
                ${pathname === '/analyze'
                  ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                  : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                }
              `}
            >
              Analyze Feedback
            </Link>

            {/* Backups */}
            <Link
              href="/backups"
              onClick={closeSidebar}
              className={`
                block px-3 py-2 text-sm rounded-md transition-colors
                ${pathname === '/backups'
                  ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                  : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                }
              `}
            >
              Backups
            </Link>

            {/* Connections */}
            <Link
              href="/connections"
              onClick={closeSidebar}
              className={`
                block px-3 py-2 text-sm rounded-md transition-colors
                ${pathname === '/connections'
                  ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                  : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                }
              `}
            >
              Connections
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-2 lg:p-3 border-t border-ui-border-base">
            <Button
              variant="secondary"
              className="w-full text-sm"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 lg:hidden bg-ui-bg-base border-b border-ui-border-base p-3 flex items-center gap-2">
          <IconButton variant="transparent" onClick={() => setSidebarOpen(true)}>
            <BarsThree />
          </IconButton>
          <Text className="text-sm font-semibold text-ui-fg-base">GrayCup Admin</Text>
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
      <RealtimeProvider />
    </div>
  )
}
