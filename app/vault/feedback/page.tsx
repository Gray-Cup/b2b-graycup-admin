import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultFeedbackTable } from './table'

export default async function VaultFeedbackPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultFeedbackTable />
    </DashboardLayout>
  )
}
