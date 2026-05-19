'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function CredentialsForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Паролите не съвпадат.')
        return
      }
      setLoading(true)
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json() as { error?: string }
        if (!res.ok) { setError(json.error ?? 'Грешка при регистрация.'); return }
      } finally {
        setLoading(false)
      }
    }

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
    <div>
      {/* Tab toggle */}
      <div className="flex rounded-xl border border-medical-border overflow-hidden mb-5">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-medical-navy text-white'
              : 'bg-white text-medical-slate hover:bg-medical-surface'
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'register'
              ? 'bg-medical-navy text-white'
              : 'bg-white text-medical-slate hover:bg-medical-surface'
          }`}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-medical-slate mb-1.5">Имейл</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="вашият@имейл.bg"
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
            placeholder={mode === 'register' ? 'Минимум 8 символа' : ''}
            className="w-full border border-medical-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">Потвърди паролата</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-medical-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
            />
          </div>
        )}

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
          {loading
            ? (mode === 'register' ? 'Регистрация...' : 'Влизане...')
            : (mode === 'register' ? 'Създай акаунт' : 'Вход с имейл')}
        </button>
      </form>
    </div>
  )
}
