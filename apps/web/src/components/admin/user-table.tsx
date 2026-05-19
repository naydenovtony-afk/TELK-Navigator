'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function toggleRole(id: string, current: 'patient' | 'admin') {
    const next = current === 'admin' ? 'patient' : 'admin'
    setLoadingId(id)
    setConfirmId(null)
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

  async function deleteUser(id: string) {
    setLoadingId(id)
    setDeleteConfirmId(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id))
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filtered = search.trim()
    ? users.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Търси по име или email…"
        className="w-full max-w-sm border border-medical-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
      />

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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-medical-slate">
                  Няма намерени потребители
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-medical-surface/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {u.image ? (
                      <Image src={u.image} alt="" width={32} height={32} className="rounded-full" />
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
                  {deleteConfirmId === u.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-critical-red mr-1">Сигурни ли сте?</span>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={loadingId === u.id}
                        className="text-xs font-semibold text-white bg-critical-red px-2 py-1 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        Изтрий
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs font-semibold text-medical-slate bg-medical-surface px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                      >
                        Отказ
                      </button>
                    </div>
                  ) : confirmId === u.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        disabled={loadingId === u.id}
                        className="text-xs font-semibold text-white bg-medical-navy px-2 py-1 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        Потвърди
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs font-semibold text-medical-slate bg-medical-surface px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                      >
                        Отказ
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setConfirmId(u.id)}
                        disabled={loadingId === u.id}
                        className="text-xs text-medical-teal hover:underline disabled:opacity-50"
                      >
                        {u.role === 'admin' ? 'Премахни админ' : 'Направи админ'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(u.id)}
                        disabled={loadingId === u.id}
                        className="text-xs text-critical-red hover:underline disabled:opacity-50"
                      >
                        Изтрий
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
