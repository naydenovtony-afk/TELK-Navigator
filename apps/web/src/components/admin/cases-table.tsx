'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui'

interface CaseRow {
  id: string
  title: string
  status: 'active' | 'submitted' | 'closed'
  createdAt: Date | string
  userName: string | null
  userEmail: string | null
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  submitted: 'Подаден',
  closed: 'Приключен',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  submitted: 'warning',
  closed: 'default',
}

export function CasesTable({ initialCases }: { initialCases: CaseRow[] }) {
  const [rows, setRows] = useState(initialCases)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function deleteCase(id: string) {
    setDeletingId(id)
    setConfirmId(null)
    try {
      await fetch(`/api/admin/cases/${id}`, { method: 'DELETE' })
      setRows((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-medical-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-medical-border bg-medical-surface">
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide">Случай</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide hidden md:table-cell">Потребител</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide">Статус</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide hidden sm:table-cell">Създаден</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-medical-border">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-medical-slate">
                Няма случаи на тази страница
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-medical-surface/50 transition-colors">
              <td className="px-5 py-4 max-w-xs">
                <p className="font-medium text-medical-navy truncate">{c.title}</p>
                <p className="text-xs text-medical-slate font-mono mt-0.5 truncate">{c.id.slice(0, 8)}…</p>
              </td>
              <td className="px-5 py-4 hidden md:table-cell">
                <p className="text-medical-navy truncate max-w-[180px]">{c.userName ?? '—'}</p>
                <p className="text-xs text-medical-slate truncate max-w-[180px]">{c.userEmail ?? '—'}</p>
              </td>
              <td className="px-5 py-4">
                <Badge variant={STATUS_VARIANT[c.status] ?? 'default'}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </td>
              <td className="px-5 py-4 text-medical-slate hidden sm:table-cell text-xs">
                {new Date(c.createdAt).toLocaleDateString('bg-BG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-5 py-4 text-right">
                {confirmId === c.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => deleteCase(c.id)}
                      disabled={deletingId === c.id}
                      className="text-xs font-semibold text-white bg-critical-red px-2 py-1 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
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
                    onClick={() => setConfirmId(c.id)}
                    disabled={deletingId === c.id}
                    className="text-xs text-critical-red hover:underline disabled:opacity-50"
                  >
                    Изтрий
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
