import type { Session } from 'next-auth'

export function isAdmin(session: Session | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === 'admin'
}
