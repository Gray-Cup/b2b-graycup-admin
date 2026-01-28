import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { QuoteRequestsTable } from './table'

export default async function QuoteRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <QuoteRequestsTable />
    </DashboardLayout>
  )
}
