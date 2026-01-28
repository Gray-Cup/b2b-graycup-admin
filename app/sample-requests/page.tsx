import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { SampleRequestsTable } from './table'

export default async function SampleRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <SampleRequestsTable />
    </DashboardLayout>
  )
}
