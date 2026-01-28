import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { ContactSubmissionsTable } from './table'

export default async function ContactSubmissionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayout>
      <ContactSubmissionsTable />
    </DashboardLayout>
  )
}
