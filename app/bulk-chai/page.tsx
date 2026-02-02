import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { BulkChaiTable } from './table'

export default async function BulkChaiPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <BulkChaiTable />
    </DashboardLayout>
  )
}
