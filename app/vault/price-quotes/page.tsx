import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { VaultPriceQuotesTable } from './table'

export default async function VaultPriceQuotesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <VaultPriceQuotesTable />
    </DashboardLayout>
  )
}
