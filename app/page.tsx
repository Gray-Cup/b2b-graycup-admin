import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { DashboardOverview } from '@/app/components/dashboard-overview'

export default async function Page() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}
