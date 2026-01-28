'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Text } from '@medusajs/ui'

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ui-bg-subtle">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-ui-bg-base border-r border-ui-border-base">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-ui-border-base">
            <Text className="text-xl font-semibold text-ui-fg-base">GrayCup Admin</Text>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-ui-border-base">
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
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
