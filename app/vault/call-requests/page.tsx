import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultCallRequestsTable } from './table'

export default async function VaultCallRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultCallRequestsTable />
    </DashboardLayout>
  )
}
