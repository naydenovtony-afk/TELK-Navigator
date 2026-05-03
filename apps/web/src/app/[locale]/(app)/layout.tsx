import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/bg/sign-in')

  const role = (session.user as { role?: string }).role ?? 'patient'
  if (role === 'admin') redirect('/bg/admin')

  return <AppShell>{children}</AppShell>
}
