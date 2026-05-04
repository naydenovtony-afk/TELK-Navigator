'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-critical-red bg-critical-red-bg px-2 py-1 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {deleting ? '…' : 'Изтрий'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={deleting}
          className="text-xs font-semibold text-medical-slate bg-medical-surface px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
        >
          Отказ
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-medical-border hover:text-critical-red transition-colors shrink-0"
      aria-label="Изтрий документ"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
