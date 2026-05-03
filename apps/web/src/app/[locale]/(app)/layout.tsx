import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/bg/sign-in')
  }

  const role = (session.user as { role?: string }).role ?? 'patient'
  return <AppShell role={role}>{children}</AppShell>
}
