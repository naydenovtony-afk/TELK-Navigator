'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export function NewDeadlineButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [loading, setLoading] = useState(false)

  const minDate = new Date().toISOString().split('T')[0]

  async function handleCreate() {
    if (!label.trim() || !dueAt) return
    setLoading(true)
    try {
      await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), dueAt: new Date(dueAt).toISOString() }),
      })
      setOpen(false)
      setLabel('')
      setDueAt('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Нов срок</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-medical-border shadow-lg w-full max-w-md p-6">
            <h2 className="font-display text-xl text-medical-navy mb-1">Нов краен срок</h2>
            <p className="text-sm text-medical-slate mb-4">
              Добавете важна дата — преосвидетелстване, обжалване, документ.
            </p>

            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="напр. Подаване на документи за преосвидетелстване"
                autoFocus
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40 focus:border-medical-teal"
              />
              <div>
                <label className="block text-xs text-medical-slate mb-1">Краен срок</label>
                <input
                  type="date"
                  value={dueAt}
                  min={minDate}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40 focus:border-medical-teal"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setOpen(false); setLabel(''); setDueAt('') }}>
                Отказ
              </Button>
              <Button onClick={handleCreate} loading={loading} disabled={!label.trim() || !dueAt}>
                Запази
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
