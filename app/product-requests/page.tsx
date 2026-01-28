import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { ProductRequestsTable } from './table'

export default async function ProductRequestsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <ProductRequestsTable />
    </DashboardLayout>
  )
}
