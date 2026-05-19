'use client'

import { useState } from 'react'

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function reset() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setError(''); setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false)

    if (!currentPw) { setError('Въведете текущата парола.'); return }
    if (newPw.length < 8) { setError('Новата парола трябва да е поне 8 символа.'); return }
    if (newPw !== confirmPw) { setError('Паролите не съвпадат.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setError(json.error ?? 'Грешка при смяна на паролата.'); return }
      setSuccess(true)
      reset()
      setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
    } catch {
      setError('Мрежова грешка. Опитайте отново.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); reset() }}
        className="flex items-center justify-between w-full text-left py-1"
      >
        <span className="text-sm font-medium text-dark-text">🔒 Промяна на парола</span>
        <span className="text-xs text-medical-slate">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            placeholder="Текуща парола"
            autoComplete="current-password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="w-full border border-medical-border rounded-xl px-4 py-2.5 text-sm text-dark-text placeholder:text-medical-slate focus:outline-none focus:ring-2 focus:ring-medical-navy/20 bg-medical-surface"
          />
          <input
            type="password"
            placeholder="Нова парола (мин. 8 символа)"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full border border-medical-border rounded-xl px-4 py-2.5 text-sm text-dark-text placeholder:text-medical-slate focus:outline-none focus:ring-2 focus:ring-medical-navy/20 bg-medical-surface"
          />
          <input
            type="password"
            placeholder="Потвърди новата парола"
            autoComplete="new-password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full border border-medical-border rounded-xl px-4 py-2.5 text-sm text-dark-text placeholder:text-medical-slate focus:outline-none focus:ring-2 focus:ring-medical-navy/20 bg-medical-surface"
          />

          {error && <p className="text-sm text-red-700">{error}</p>}
          {success && <p className="text-sm text-green-700 font-medium">✓ Паролата е сменена успешно</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-medical-navy text-white text-sm font-semibold rounded-xl px-5 py-2 hover:bg-medical-navy/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Запазване…' : 'Смени паролата'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => { setOpen(false); reset() }}
              className="bg-medical-surface text-medical-slate text-sm font-medium rounded-xl px-5 py-2 hover:bg-medical-border transition-colors"
            >
              Отказ
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
