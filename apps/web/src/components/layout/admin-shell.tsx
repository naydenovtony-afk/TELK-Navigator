'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SignOutButton } from './sign-out-button'

const navItems = [
  { href: '/bg/admin', label: 'Обзор' },
  { href: '/bg/admin/users', label: 'Потребители' },
  { href: '/bg/admin/prompts', label: 'Prompt модули' },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Admin</p>
        <span className="font-display text-xl text-white">ТЕЛК Навигатор</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <SignOutButton className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors" />
      </div>
    </>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-medical-surface">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-ocean-hero flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 bg-ocean-hero flex flex-col transition-transform duration-300 lg:hidden',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Затвори менюто"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent onNavigate={() => setMenuOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-ocean-hero border-b border-white/10 shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Отвори менюто"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-lg text-white">Admin</span>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
