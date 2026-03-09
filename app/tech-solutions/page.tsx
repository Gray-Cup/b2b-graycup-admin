import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { TechSolutionsTable } from './table'

export default async function TechSolutionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <TechSolutionsTable />
    </DashboardLayout>
  )
}
