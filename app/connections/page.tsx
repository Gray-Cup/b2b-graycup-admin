import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { ConnectionsPage } from './connections'

export default async function Connections() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <ConnectionsPage />
    </DashboardLayout>
  )
}
