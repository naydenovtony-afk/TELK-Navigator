'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui'

interface User {
  id: string
  name: string | null
  email: string
  role: 'patient' | 'admin'
  createdAt: Date | string
  image: string | null
}

export function UserTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function toggleRole(id: string, current: 'patient' | 'admin') {
    const next = current === 'admin' ? 'patient' : 'admin'
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: next }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: next } : u))
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-medical-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-medical-border bg-medical-surface">
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide">Потребител</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide">Роля</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-medical-slate uppercase tracking-wide hidden sm:table-cell">Регистриран</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-medical-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-medical-surface/50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  {u.image ? (
                    <img src={u.image} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-medical-surface flex items-center justify-center text-xs font-bold text-medical-slate">
                      {(u.name ?? u.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-medical-navy truncate">{u.name ?? '—'}</p>
                    <p className="text-xs text-medical-slate truncate">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>
                  {u.role === 'admin' ? 'Админ' : 'Пациент'}
                </Badge>
              </td>
              <td className="px-5 py-4 text-medical-slate hidden sm:table-cell">
                {new Date(u.createdAt).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => toggleRole(u.id, u.role)}
                  disabled={loadingId === u.id}
                  className="text-xs text-medical-teal hover:underline disabled:opacity-50"
                >
                  {u.role === 'admin' ? 'Премахни админ' : 'Направи админ'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
