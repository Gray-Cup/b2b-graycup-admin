import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { AnalyzePage } from './analyze'

export default async function Analyze() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <AnalyzePage />
    </DashboardLayout>
  )
}
