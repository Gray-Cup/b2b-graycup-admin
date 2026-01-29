import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultQuoteRequestsTable } from './table'

export default async function VaultQuoteRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultQuoteRequestsTable />
    </DashboardLayout>
  )
}
