import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/session'
import { AdminShell } from '@/components/layout/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!isAdmin(session)) {
    redirect('/bg/sign-in')
  }

  return <AdminShell>{children}</AdminShell>
}
