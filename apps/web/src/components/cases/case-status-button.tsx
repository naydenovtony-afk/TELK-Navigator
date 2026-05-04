'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type CaseStatus = 'active' | 'submitted' | 'closed'

const OPTIONS: { value: CaseStatus; label: string; cls: string }[] = [
  { value: 'active',    label: 'Активен',    cls: 'text-vital-green' },
  { value: 'submitted', label: 'Подаден',    cls: 'text-clinical-amber' },
  { value: 'closed',    label: 'Приключен',  cls: 'text-medical-slate' },
]

const BADGE_CLS: Record<CaseStatus, string> = {
  active:    'bg-vital-green-bg text-vital-green',
  submitted: 'bg-clinical-amber-bg text-clinical-amber',
  closed:    'bg-medical-surface text-medical-slate',
}

export function CaseStatusButton({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const [current, setCurrent] = useState<CaseStatus>(status)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function pick(next: CaseStatus) {
    if (next === current) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setCurrent(next)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const label = OPTIONS.find((o) => o.value === current)?.label ?? current

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 ${BADGE_CLS[current]}`}
      >
        {saving ? '…' : label}
        <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-medical-border shadow-lg z-10 overflow-hidden">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-medical-surface transition-colors ${o.cls} ${o.value === current ? 'font-semibold' : ''}`}
            >
              {o.value === current && <span className="mr-1">✓</span>}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
