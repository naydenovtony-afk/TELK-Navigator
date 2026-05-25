'use client'

import { useState, useEffect } from 'react'
import type { ScorePredictorResult } from '@/lib/ai'

const DB_KEY = 'scorePredictor'

const LIMITATIONS = [
  'Затруднено ходене / нужда от помощно средство',
  'Невъзможност за самообслужване',
  'Затруднено дишане в покой или при минимално усилие',
  'Хронична болка, ограничаваща движенията',
  'Когнитивни нарушения / нарушения на паметта',
  'Нарушено зрение или слух',
  'Нарушена реч или комуникация',
  'Зависимост от чужда помощ за ежедневни дейности',
  'Невъзможност за работа в обичайната специалност',
]

export default function ScorePredictorPage() {
  const [diagnosis, setDiagnosis] = useState('')
  const [age, setAge] = useState('')
  const [limitations, setLimitations] = useState<string[]>([])
  const [previousPercent, setPreviousPercent] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [result, setResult] = useState<ScorePredictorResult | null>(null)
  const [restored, setRestored] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/preferences/ai-results')
      .then((r) => r.json())
      .then((data) => { if (data[DB_KEY]) { setResult(data[DB_KEY]); setRestored(true) } })
      .catch(() => {})
  }, [])

  function toggleLimitation(l: string) {
    setLimitations((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l])
  }

  async function handlePredict() {
    setError('')
    setResult(null)
    const ageN = parseInt(age, 10)
    if (!diagnosis.trim()) { setError('Въведете диагноза.'); return }
    if (isNaN(ageN) || ageN < 1) { setError('Въведете валидна възраст.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/score-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisDescription: diagnosis.trim(),
          functionalLimitations: limitations,
          age: ageN,
          previousPercent: previousPercent ? parseInt(previousPercent, 10) : undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Грешка')
      setResult(data as ScorePredictorResult)
      setRestored(false)
      fetch('/api/preferences/ai-results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [DB_KEY]: data }),
      }).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Прогноза за ТЕЛК решение</h1>
        <p className="text-sm text-medical-slate mt-1">
          Ориентировъчен диапазон на очакваната оценка въз основа на диагнозата и ограниченията
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4 sm:mb-6 space-y-4 sm:space-y-5">
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide">Данни</h2>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Диагноза / МКБ код <span className="text-critical-red">*</span>
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Напр. M47 Спондилоза с радикулопатия, лумбален дял; или G35 Множествена склероза..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Възраст <span className="text-critical-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={120} value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="52"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">год.</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Предишна ТЕЛК оценка
              <span className="text-medical-slate/60 ml-1">(ако има)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} value={previousPercent}
                onChange={(e) => setPreviousPercent(e.target.value)}
                placeholder="50"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-2">
            Функционални ограничения
          </label>
          <div className="space-y-2">
            {LIMITATIONS.map((l) => (
              <label key={l} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={limitations.includes(l)}
                  onChange={() => toggleLimitation(l)}
                  className="mt-0.5 accent-medical-teal"
                />
                <span className="text-sm text-dark-text">{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Допълнителен контекст
            <span className="text-medical-slate/60 ml-1">(по избор)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Операции, хоспитализации, специфични обстоятелства..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-critical-red bg-critical-red-bg rounded-lg px-4 py-2.5 border border-critical-red/20">
            {error}
          </p>
        )}

        <button
          onClick={handlePredict} disabled={loading}
          className="bg-medical-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-medical-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <><Spinner />Анализира се...</> : 'Прогнозирай оценката'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {restored && (
            <div className="flex items-center justify-between bg-medical-surface rounded-xl px-4 py-2.5">
              <span className="text-xs text-medical-slate">Резултат от последна сесия</span>
              <button
                onClick={() => {
                  setResult(null); setRestored(false)
                  fetch('/api/preferences/ai-results', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [DB_KEY]: null }),
                  }).catch(() => {})
                }}
                className="text-xs text-medical-slate hover:text-critical-red transition-colors font-medium"
              >
                Изчисти
              </button>
            </div>
          )}
          {/* Range card */}
          <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6">
            <p className="text-sm text-medical-slate mb-1">Очаквана оценка</p>
            <p className="font-display text-4xl sm:text-5xl text-medical-navy font-medium">{result.rangeLabel}</p>
            <p className="text-sm text-medical-slate mt-3 leading-relaxed">{result.summary}</p>
          </div>

          {/* Factors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-5">
              <h3 className="text-xs font-medium text-vital-green uppercase tracking-wide mb-3">
                Фактори в полза
              </h3>
              <ul className="space-y-2">
                {result.keyFactors.positive.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-text">
                    <span className="text-vital-green mt-0.5 shrink-0">+</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-5">
              <h3 className="text-xs font-medium text-clinical-amber uppercase tracking-wide mb-3">
                Рискови фактори
              </h3>
              <ul className="space-y-2">
                {result.keyFactors.negative.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-text">
                    <span className="text-clinical-amber mt-0.5 shrink-0">−</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6">
            <h3 className="text-sm font-medium text-medical-slate uppercase tracking-wide mb-3">
              Какво да включите в документацията
            </h3>
            <ul className="space-y-2.5">
              {result.documentationTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-dark-text">
                  <span className="text-medical-teal font-medium shrink-0">{i + 1}.</span>{tip}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-medical-slate text-center">
            Прогнозата е ориентировъчна и не представлява официална медицинска или правна оценка.
          </p>
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
