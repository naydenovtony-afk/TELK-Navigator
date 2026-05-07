'use client'

import { useState } from 'react'

const TELK_SITUATION_LABELS: Record<string, string> = {
  preparing: 'Подготвям се за ТЕЛК',
  hasDecision: 'Имам решение на ТЕЛК',
  appealing: 'Обжалвам решение',
  helpingRelative: 'Помагам на близък',
}

const DIAGNOSIS_CATEGORY_LABELS: Record<string, string> = {
  respiratory: 'Дихателна система',
  cardiovascular: 'Сърдечно-съдова система',
  neurological: 'Нервна система',
  musculoskeletal: 'Опорно-двигателен апарат',
  endocrine: 'Ендокринна система',
  psychiatric: 'Психично здраве',
  oncological: 'Онкологични заболявания',
  renal: 'Бъбречна система',
  other: 'Друго',
}

type Prefs = {
  telkSituation?: string | null
  mainDiagnosisCategory?: string | null
  hasEpicrisis?: boolean | null
  telkExpiresAt?: string | null
}

export function PreferencesForm({ initial }: { initial: Prefs | null }) {
  const [situation, setSituation] = useState(initial?.telkSituation ?? '')
  const [diagnosis, setDiagnosis] = useState(initial?.mainDiagnosisCategory ?? '')
  const [hasEpicrisis, setHasEpicrisis] = useState<boolean | null>(initial?.hasEpicrisis ?? null)
  const [expiresAt, setExpiresAt] = useState(
    initial?.telkExpiresAt
      ? new Date(initial.telkExpiresAt).toISOString().split('T')[0]
      : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await fetch('/api/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telkSituation: situation || null,
        mainDiagnosisCategory: diagnosis || null,
        hasEpicrisis: hasEpicrisis,
        telkExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* TELK situation */}
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

      {/* Diagnosis category */}
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

      {/* Has epicrisis */}
      <div>
        <label className="block text-sm text-medical-slate mb-1.5">
          Имате ли епикриза?
        </label>
        <div className="flex gap-4 text-sm">
          {[
            { label: 'Да', value: true },
            { label: 'Не', value: false },
          ].map(({ label, value }) => (
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

      {/* TELK expiry date */}
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

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-medical-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-medical-navy/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Запазване…' : 'Запази предпочитания'}
        </button>
        {saved && (
          <span className="text-sm text-green-600">Запазено успешно</span>
        )}
      </div>
    </form>
  )
}
