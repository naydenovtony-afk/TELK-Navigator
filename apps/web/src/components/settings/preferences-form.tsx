'use client'

import { useState } from 'react'

const TELK_SITUATION_LABELS: Record<string, string> = {
  preparing:      'Подготвям се за ТЕЛК',
  hasDecision:    'Имам решение на ТЕЛК',
  appealing:      'Обжалвам решение',
  helpingRelative:'Помагам на близък',
}

const DIAGNOSIS_CATEGORY_LABELS: Record<string, string> = {
  respiratory:    'Дихателна система',
  cardiovascular: 'Сърдечно-съдова система',
  neurological:   'Нервна система',
  musculoskeletal:'Опорно-двигателен апарат',
  endocrine:      'Ендокринна система',
  psychiatric:    'Психично здраве',
  oncological:    'Онкологични заболявания',
  renal:          'Бъбречна система',
  other:          'Друго',
}

type Prefs = {
  telkSituation?: string | null
  mainDiagnosisCategory?: string | null
  hasEpicrisis?: boolean | null
  telkExpiresAt?: string | null
}

export function PreferencesForm({ initial }: { initial: Prefs | null }) {
  const hasInitial = !!(
    initial?.telkSituation ||
    initial?.mainDiagnosisCategory ||
    initial?.hasEpicrisis != null ||
    initial?.telkExpiresAt
  )

  const [editing, setEditing] = useState(!hasInitial)
  const [situation, setSituation]   = useState(initial?.telkSituation ?? '')
  const [diagnosis, setDiagnosis]   = useState(initial?.mainDiagnosisCategory ?? '')
  const [hasEpicrisis, setHasEpicrisis] = useState<boolean | null>(initial?.hasEpicrisis ?? null)
  const [expiresAt, setExpiresAt]   = useState(
    initial?.telkExpiresAt
      ? new Date(initial.telkExpiresAt).toISOString().split('T')[0]
      : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telkSituation: situation || null,
          mainDiagnosisCategory: diagnosis || null,
          hasEpicrisis,
          telkExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      })
      if (!res.ok) { setError('Грешка при запазване.'); return }
      setEditing(false)
    } catch {
      setError('Мрежова грешка. Опитайте отново.')
    } finally {
      setSaving(false)
    }
  }

  // ── View mode ────────────────────────────────────────────────────────────────
  if (!editing) {
    const epicrisisLabel =
      hasEpicrisis === true ? 'Да' : hasEpicrisis === false ? 'Не' : 'Не знам'
    const expiresLabel = expiresAt
      ? new Date(expiresAt).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—'

    return (
      <div>
        <div className="grid gap-3 text-sm mb-4">
          <ViewRow label="Ситуация с ТЕЛК"      value={TELK_SITUATION_LABELS[situation] ?? '—'} />
          <ViewRow label="Диагнозна категория"  value={DIAGNOSIS_CATEGORY_LABELS[diagnosis] ?? '—'} />
          <ViewRow label="Имате епикриза?"      value={epicrisisLabel} />
          <ViewRow label="Изтичане на решението" value={expiresLabel} />
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-medical-teal hover:text-medical-navy transition-colors"
        >
          Редактирай
        </button>
      </div>
    )
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label className="block text-sm text-medical-slate mb-1.5">
          Текуща ситуация с ТЕЛК
        </label>
        <select
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          className="w-full border border-medical-border rounded-lg px-3 py-2 text-sm text-dark-text bg-white focus:outline-none focus:border-medical-navy"
        >
          <option value="">— Изберете —</option>
          {Object.entries(TELK_SITUATION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-medical-slate mb-1.5">
          Основна диагнозна категория
        </label>
        <select
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full border border-medical-border rounded-lg px-3 py-2 text-sm text-dark-text bg-white focus:outline-none focus:border-medical-navy"
        >
          <option value="">— Изберете —</option>
          {Object.entries(DIAGNOSIS_CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-medical-slate mb-1.5">
          Имате ли епикриза?
        </label>
        <div className="flex gap-4 text-sm">
          {([{ label: 'Да', value: true }, { label: 'Не', value: false }] as const).map(({ label, value }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasEpicrisis"
                checked={hasEpicrisis === value}
                onChange={() => setHasEpicrisis(value)}
                className="accent-medical-navy"
              />
              <span className="text-dark-text">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hasEpicrisis"
              checked={hasEpicrisis === null}
              onChange={() => setHasEpicrisis(null)}
              className="accent-medical-navy"
            />
            <span className="text-dark-text">Не знам</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm text-medical-slate mb-1.5">
          Изтичане на решението (ако приложимо)
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full border border-medical-border rounded-lg px-3 py-2 text-sm text-dark-text bg-white focus:outline-none focus:border-medical-navy"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-medical-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-medical-navy/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Запазване…' : 'Запази'}
        </button>
        {hasInitial && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-medical-slate hover:text-medical-navy transition-colors"
          >
            Отказ
          </button>
        )}
      </div>
    </form>
  )
}

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-medical-border last:border-0">
      <span className="text-medical-slate">{label}</span>
      <span className="text-dark-text font-medium">{value}</span>
    </div>
  )
}
