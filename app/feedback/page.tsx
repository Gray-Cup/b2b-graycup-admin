import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { FeedbackTable } from './table'

export default async function FeedbackPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <FeedbackTable />
    </DashboardLayout>
  )
}
