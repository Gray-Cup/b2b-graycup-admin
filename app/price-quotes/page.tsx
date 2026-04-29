import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { PriceQuotesTable } from './table'

export default async function PriceQuotesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <PriceQuotesTable />
    </DashboardLayout>
  )
}
