import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { BulkGreenCoffeeTable } from './table'

export default async function BulkGreenCoffeePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <BulkGreenCoffeeTable />
    </DashboardLayout>
  )
}
