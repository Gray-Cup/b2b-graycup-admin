import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { CallRequestsTable } from './table'

export default async function CallRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <CallRequestsTable />
    </DashboardLayout>
  )
}
