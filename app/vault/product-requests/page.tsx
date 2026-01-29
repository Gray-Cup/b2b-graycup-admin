import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultProductRequestsTable } from './table'

export default async function VaultProductRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultProductRequestsTable />
    </DashboardLayout>
  )
}
