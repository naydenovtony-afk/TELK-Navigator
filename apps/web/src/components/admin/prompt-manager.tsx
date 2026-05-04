'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface Prompt {
  id: string
  key: string
  content: string
  version: number
  updatedAt: Date | string
}

export function PromptManager({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const router = useRouter()
  const [prompts, setPrompts] = useState(initialPrompts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPrompts((prev) => prev.map((p) => p.id === id ? updated : p))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function remove(id: string) {
    await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' })
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    setConfirmDeleteId(null)
  }

  async function createPrompt() {
    if (!newKey.trim() || !newContent.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey.trim(), content: newContent.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      setPrompts((prev) => [...prev, created])
      setShowNew(false)
      setNewKey('')
      setNewContent('')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {prompts.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl border border-medical-border p-8 text-center">
          <p className="text-sm text-medical-slate mb-4">Няма добавени prompt модули</p>
        </div>
      )}

      {prompts.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl border border-medical-border overflow-hidden">
          <div className="px-5 py-3 bg-medical-surface border-b border-medical-border flex items-center justify-between">
            <div>
              <code className="text-sm font-mono text-medical-navy">{p.key}</code>
              <span className="ml-2 text-xs text-medical-slate">v{p.version}</span>
            </div>
            <div className="flex gap-2">
              {editingId === p.id ? (
                <>
                  <Button size="sm" onClick={() => saveEdit(p.id)} loading={saving}>Запази</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Отказ</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingId(p.id); setEditContent(p.content) }}>Редактирай</Button>
                  {confirmDeleteId === p.id ? (
                    <>
                      <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Потвърди</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Отказ</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteId(p.id)}>Изтрий</Button>
                  )}
                </>
              )}
            </div>
          </div>
          {editingId === p.id ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="w-full px-5 py-4 text-sm font-mono text-medical-navy focus:outline-none resize-y"
            />
          ) : (
            <pre className="px-5 py-4 text-xs text-medical-slate whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
              {p.content}
            </pre>
          )}
        </div>
      ))}

      {showNew ? (
        <div className="bg-white rounded-2xl border border-medical-border p-6 space-y-3">
          <h3 className="font-display text-lg text-medical-navy">Нов модул</h3>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="ключ (напр. nme_analysis)"
            className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Съдържание на промпта..."
            rows={8}
            className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40 resize-y"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowNew(false)}>Отказ</Button>
            <Button onClick={createPrompt} loading={saving} disabled={!newKey.trim() || !newContent.trim()}>Създай</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setShowNew(true)}>+ Нов prompt модул</Button>
      )}
    </div>
  )
}
