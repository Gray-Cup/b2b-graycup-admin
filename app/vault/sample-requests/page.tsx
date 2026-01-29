import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultSampleRequestsTable } from './table'

export default async function VaultSampleRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultSampleRequestsTable />
    </DashboardLayout>
  )
}
