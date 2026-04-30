'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function CredentialsForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Невалиден имейл или парола.')
    } else {
      router.push('/bg/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-medical-slate mb-1.5">Имейл</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="demo@telk.bg"
          className="w-full border border-medical-border rounded-xl px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
        />
      </div>
      <div>
        <label className="block text-sm text-medical-slate mb-1.5">Парола</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-medical-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
        />
      </div>

      {error && (
        <p className="text-sm text-critical-red bg-critical-red-bg rounded-lg px-3 py-2 border border-critical-red/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-medical-navy text-white font-medium py-2.5 px-4 rounded-xl hover:bg-medical-teal transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Влизане...' : 'Вход с имейл'}
      </button>
    </form>
  )
}
