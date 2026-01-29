import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { BackupsPage } from './backups'

export default async function Backups() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <BackupsPage />
    </DashboardLayout>
  )
}
