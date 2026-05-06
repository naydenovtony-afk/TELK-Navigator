'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'telk_employer_letter'

type Accommodation = 'leave' | 'hours' | 'dismissal' | 'adaptation' | 'parking'

const ACCOMMODATIONS: { id: Accommodation; label: string; minPercent: number }[] = [
  { id: 'leave', label: 'Допълнителен платен отпуск — 25 дни (КТ чл.319)', minPercent: 50 },
  { id: 'dismissal', label: 'Закрила при уволнение (КТ чл.333)', minPercent: 50 },
  { id: 'hours', label: 'Намалено работно време (КТ чл.137)', minPercent: 71 },
  { id: 'adaptation', label: 'Адаптация на работното място (ЗИХУ чл.39)', minPercent: 50 },
  { id: 'parking', label: 'Паркомясто за хора с увреждания', minPercent: 71 },
]

export default function EmployerLetterPage() {
  const [percent, setPercent] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [employerName, setEmployerName] = useState('')
  const [selected, setSelected] = useState<Accommodation[]>([])
  const [notes, setNotes] = useState('')
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { setLetter(JSON.parse(saved)); setRestored(true) }
    } catch {}
  }, [])

  const pct = parseInt(percent, 10)
  const available = isNaN(pct) ? [] : ACCOMMODATIONS.filter((a) => pct >= a.minPercent)

  function toggle(id: Accommodation) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    setError('')
    setLetter('')
    if (!percent || !employeeName.trim() || !employerName.trim()) {
      setError('Моля, попълнете всички задължителни полета.')
      return
    }
    if (pct < 50) {
      setError('Минималният праг за социални права е 50% трайна неработоспособност.')
      return
    }
    if (selected.length === 0) {
      setError('Изберете поне едно искане.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/employer-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percent: pct,
          employeeName: employeeName.trim(),
          employerName: employerName.trim(),
          accommodations: selected,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Грешка при генериране')
      setLetter(data.letter)
      setRestored(false)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.letter)) } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Писмо до работодател</h1>
        <p className="text-sm text-medical-slate mt-1">
          Генерирайте официално писмо с цитирани членове от КТ и ЗИХУ
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4 sm:mb-6 space-y-4 sm:space-y-5" data-print-hide>
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide">
          Данни за писмото
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Вашите имена <span className="text-critical-red">*</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Иван Иванов"
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Работодател <span className="text-critical-red">*</span>
            </label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder='"Фирма" ЕООД'
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Процент трайна неработоспособност <span className="text-critical-red">*</span>
          </label>
          <div className="flex items-center gap-2 w-32">
            <input
              type="number"
              min={50}
              max={100}
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value)
                setSelected([])
              }}
              placeholder="75"
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
            />
            <span className="text-sm text-medical-slate">%</span>
          </div>
        </div>

        {available.length > 0 && (
          <div>
            <label className="block text-sm text-medical-slate mb-2">
              Исканите облекчения <span className="text-critical-red">*</span>
            </label>
            <div className="space-y-2.5">
              {available.map((a) => (
                <label key={a.id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggle(a.id)}
                    className="mt-0.5 accent-medical-teal"
                  />
                  <span className="text-sm text-dark-text group-hover:text-medical-teal transition-colors">
                    {a.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Допълнителни обстоятелства
            <span className="text-medical-slate/60 ml-1">(по избор)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Специфични условия, предишни откази, конкретни нужди..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-critical-red bg-critical-red-bg rounded-lg px-4 py-2.5 border border-critical-red/20">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-medical-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-medical-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              Генерира се...
            </>
          ) : (
            'Генерирай писмо'
          )}
        </button>
      </div>

      {letter && (
        <div className="bg-white rounded-2xl border border-medical-border overflow-hidden" data-print-content>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-medical-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-dark-text">Генерирано писмо</span>
              {restored && (
                <span className="text-xs text-medical-slate bg-medical-surface px-2 py-0.5 rounded-full">
                  от последна сесия
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setLetter(''); setRestored(false); try { localStorage.removeItem(STORAGE_KEY) } catch {} }}
                className="text-xs text-medical-slate hover:text-critical-red transition-colors"
              >
                Изчисти
              </button>
              <button
                onClick={() => window.print()}
                className="text-sm text-medical-slate hover:text-medical-navy transition-colors font-medium"
              >
                Принтирай
              </button>
              <button
                onClick={handleCopy}
                className="text-sm text-medical-teal hover:text-medical-navy transition-colors font-medium flex items-center gap-1.5"
              >
                {copied ? '✓ Копирано' : 'Копирай'}
              </button>
            </div>
          </div>
          <pre className="p-4 sm:p-6 text-sm text-dark-text leading-relaxed whitespace-pre-wrap font-sans">
            {letter}
          </pre>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
