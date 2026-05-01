'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export function NewCaseButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  async function handleCreate() {
    if (!title.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? `Грешка ${res.status}`)
        return
      }
      setOpen(false)
      setTitle('')
      startTransition(() => router.push(`/bg/dashboard/cases/${data.id}`))
    } catch {
      setError('Мрежова грешка. Опитайте отново.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        + Нов случай
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-medical-border shadow-lg w-full max-w-md p-6">
            <h2 className="font-display text-xl text-medical-navy mb-1">Нов случай</h2>
            <p className="text-sm text-medical-slate mb-4">
              Дайте кратко описание на вашата преписка.
            </p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="напр. ТЕЛК преосвидетелстване 2026"
              autoFocus
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40 focus:border-medical-teal mb-4"
            />

            {error && (
              <p className="text-sm text-critical-red bg-critical-red-bg border border-critical-red/20 rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setOpen(false); setTitle(''); setError('') }}>
                Отказ
              </Button>
              <Button onClick={handleCreate} loading={loading} disabled={!title.trim() || loading}>
                Създай
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
