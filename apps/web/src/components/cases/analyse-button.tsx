'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface AnalyseButtonProps {
  documentId: string
  disabled?: boolean
}

export function AnalyseButton({ documentId, disabled }: AnalyseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyse() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/documents/${documentId}/analyse`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Анализът не успя')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неочаквана грешка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="secondary"
        onClick={handleAnalyse}
        loading={loading}
        disabled={disabled || loading}
      >
        {loading ? 'Анализира се…' : 'Анализирай с AI'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
