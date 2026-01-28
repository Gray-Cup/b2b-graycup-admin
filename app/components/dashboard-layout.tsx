'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button, Text, IconButton } from '@medusajs/ui'
import { BarsThree, XMark } from '@medusajs/icons'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Contact Submissions', href: '/contact-submissions' },
  { name: 'Quote Requests', href: '/quote-requests' },
  { name: 'Sample Requests', href: '/sample-requests' },
  { name: 'Feedback', href: '/feedback' },
  { name: 'Product Requests', href: '/product-requests' },
  { name: 'Call Requests', href: '/call-requests' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          fixed inset-y-0 left-0 w-64 bg-ui-bg-base border-r border-ui-border-base z-50
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Close button */}
          <div className="p-4 lg:p-6 border-b border-ui-border-base flex items-center justify-between">
            <Text className="text-lg lg:text-xl font-semibold text-ui-fg-base">GrayCup Admin</Text>
            <IconButton
              variant="transparent"
              className="lg:hidden"
              onClick={closeSidebar}
            >
              <XMark />
            </IconButton>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`
                    block px-3 lg:px-4 py-2 text-sm rounded-md transition-colors
                    ${isActive
                      ? 'bg-ui-bg-subtle text-ui-fg-base font-medium'
                      : 'text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover'
                    }
                  `}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 lg:p-4 border-t border-ui-border-base">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 lg:hidden bg-ui-bg-base border-b border-ui-border-base p-4 flex items-center gap-3">
          <IconButton variant="transparent" onClick={() => setSidebarOpen(true)}>
            <BarsThree />
          </IconButton>
          <Text className="font-semibold text-ui-fg-base">GrayCup Admin</Text>
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
