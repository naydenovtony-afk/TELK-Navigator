'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/bg/sign-in' })}
      className={className}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Изход
    </button>
  )
}
