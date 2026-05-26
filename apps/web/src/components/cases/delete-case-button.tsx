'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/cases/${caseId}`, { method: 'DELETE' })
      router.push('/bg/dashboard')
      router.refresh()
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-medical-slate">Сигурни ли сте?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-critical-red bg-critical-red-bg px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {deleting ? '…' : 'Изтрий'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={deleting}
          className="text-xs font-semibold text-medical-slate bg-medical-surface px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
        >
          Отказ
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-medical-slate hover:text-critical-red transition-colors flex items-center gap-1.5"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Изтрий случай
    </button>
  )
}
