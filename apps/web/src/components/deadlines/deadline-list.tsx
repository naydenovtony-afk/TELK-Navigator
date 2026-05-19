'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Deadline {
  id: string
  label: string
  dueAt: string | Date
  isCompleted: boolean
}

function getDaysLeft(dueAt: string | Date) {
  const diff = new Date(dueAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getUrgency(daysLeft: number, isCompleted: boolean) {
  if (isCompleted) return 'completed'
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 7) return 'soon'
  return 'upcoming'
}

const URGENCY_STYLES = {
  completed: 'border-medical-border opacity-60',
  overdue: 'border-critical-red/40 bg-critical-red-bg',
  soon: 'border-clinical-amber/40 bg-clinical-amber-bg',
  upcoming: 'border-medical-border bg-white',
}

function getBadge(urgency: string, daysLeft: number): { text: string; cls: string } {
  if (urgency === 'completed') return { text: 'Завършен', cls: 'bg-medical-surface text-medical-slate' }
  if (urgency === 'overdue') return { text: `−${Math.abs(daysLeft)} дни`, cls: 'bg-critical-red-bg text-critical-red' }
  if (daysLeft === 0) return { text: 'Днес', cls: 'bg-critical-red-bg text-critical-red font-semibold' }
  if (daysLeft === 1) return { text: 'Утре', cls: 'bg-clinical-amber-bg text-clinical-amber' }
  if (urgency === 'soon') return { text: `${daysLeft} дни`, cls: 'bg-clinical-amber-bg text-clinical-amber' }
  return { text: `${daysLeft} дни`, cls: 'bg-vital-green-bg text-vital-green' }
}

export function DeadlineList({ initialDeadlines }: { initialDeadlines: Deadline[] }) {
  const [items, setItems] = useState(initialDeadlines)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const router = useRouter()

  async function toggleComplete(id: string, current: boolean) {
    await fetch(`/api/deadlines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !current }),
    })
    setItems((prev) => prev.map((d) => d.id === id ? { ...d, isCompleted: !current } : d))
  }

  async function remove(id: string) {
    await fetch(`/api/deadlines/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((d) => d.id !== id))
    setConfirmId(null)
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-medical-border p-10 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-medical-surface flex items-center justify-center">
          <svg className="w-7 h-7 text-medical-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-medical-navy">Нямате добавени срокове</p>
          <p className="text-sm text-medical-slate mt-1 max-w-xs mx-auto">
            Следете важни дати — преосвидетелстване, обжалване, подаване на документи.
          </p>
        </div>
        <p className="text-xs text-medical-slate">
          Използвайте бутона <span className="font-semibold text-medical-navy">+ Нов срок</span> горе вдясно, за да добавите.
        </p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  })

  return (
    <ul className="space-y-3">
      {sorted.map((d) => {
        const daysLeft = getDaysLeft(d.dueAt)
        const urgency = getUrgency(daysLeft, d.isCompleted)
        const badge = getBadge(urgency, daysLeft)

        return (
          <li
            key={d.id}
            className={`rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all ${URGENCY_STYLES[urgency]}`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleComplete(d.id, d.isCompleted)}
              className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                d.isCompleted
                  ? 'bg-vital-green border-vital-green text-white'
                  : 'border-medical-border hover:border-medical-teal'
              }`}
              aria-label={d.isCompleted ? 'Маркирай като незавършен' : 'Маркирай като завършен'}
            >
              {d.isCompleted && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${d.isCompleted ? 'line-through text-medical-slate' : 'text-medical-navy'}`}>
                {d.label}
              </p>
              <p className="text-xs text-medical-slate mt-0.5">
                {new Date(d.dueAt).toLocaleDateString('bg-BG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>

            {/* Badge */}
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
              {badge.text}
            </span>

            {/* Delete */}
            {confirmId === d.id ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => remove(d.id)}
                  className="text-xs font-semibold text-critical-red bg-critical-red-bg px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                >
                  Изтрий
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs font-semibold text-medical-slate bg-medical-surface px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                >
                  Отказ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(d.id)}
                className="text-medical-border hover:text-critical-red transition-colors shrink-0"
                aria-label="Изтрий"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
