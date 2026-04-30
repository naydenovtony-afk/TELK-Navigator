import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/session'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!isAdmin(session)) {
    redirect('/bg/sign-in')
  }

  return (
    <div className="flex min-h-screen bg-medical-surface">
      <aside className="w-56 shrink-0 bg-ocean-hero flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Admin</p>
          <span className="font-display text-xl text-white">ТЕЛК Навигатор</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/bg/admin', label: 'Обзор' },
            { href: '/bg/admin/users', label: 'Потребители' },
            { href: '/bg/admin/prompts', label: 'Prompt модули' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <Link href="/bg/dashboard" className="flex items-center px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            ← Към приложението
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
