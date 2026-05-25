'use client'

import { useState, useEffect } from 'react'
import type { LifelongCheckResult } from '@/lib/ai'

const DB_KEY = 'lifelongCheck'

const VERDICT_STYLES = {
  likely: {
    bg: 'bg-vital-green-bg border-vital-green/20',
    text: 'text-vital-green',
    dot: 'bg-vital-green',
  },
  possible: {
    bg: 'bg-clinical-amber-bg border-clinical-amber/20',
    text: 'text-clinical-amber',
    dot: 'bg-clinical-amber',
  },
  unlikely: {
    bg: 'bg-critical-red-bg border-critical-red/20',
    text: 'text-critical-red',
    dot: 'bg-critical-red',
  },
}

export default function LifelongCheckPage() {
  const [percent, setPercent] = useState('')
  const [age, setAge] = useState('')
  const [diagnosisDescription, setDiagnosisDescription] = useState('')
  const [isIrreversible, setIsIrreversible] = useState(false)
  const [isProgressive, setIsProgressive] = useState(false)
  const [previousTelkYears, setPreviousTelkYears] = useState('')
  const [result, setResult] = useState<LifelongCheckResult | null>(null)
  const [restored, setRestored] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/preferences/ai-results')
      .then((r) => r.json())
      .then((data) => { if (data[DB_KEY]) { setResult(data[DB_KEY]); setRestored(true) } })
      .catch(() => {})
  }, [])

  async function handleCheck() {
    setError('')
    setResult(null)

    const pct = parseInt(percent, 10)
    const ageN = parseInt(age, 10)

    if (isNaN(pct) || pct < 1 || pct > 100) {
      setError('Въведете валиден процент (1–100).')
      return
    }
    if (isNaN(ageN) || ageN < 1 || ageN > 120) {
      setError('Въведете валидна възраст.')
      return
    }
    if (!diagnosisDescription.trim()) {
      setError('Въведете описание на диагнозата.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/lifelong-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percent: pct,
          age: ageN,
          diagnosisDescription: diagnosisDescription.trim(),
          isIrreversible,
          isProgressive,
          previousTelkYears: previousTelkYears ? parseInt(previousTelkYears, 10) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Грешка')
      setResult(data as LifelongCheckResult)
      setRestored(false)
      fetch('/api/preferences/ai-results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [DB_KEY]: data }),
      }).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка при проверката')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Проверка за пожизнено ТЕЛК</h1>
        <p className="text-sm text-medical-slate mt-1">
          Анализ дали отговаряте на критериите за решение без срок за преосвидетелстване
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4 sm:mb-6 space-y-4 sm:space-y-5">
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide">
          Данни за анализа
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Процент увреждане <span className="text-critical-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="75"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Възраст <span className="text-critical-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="55"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">год.</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Диагноза / МКБ код <span className="text-critical-red">*</span>
          </label>
          <textarea
            value={diagnosisDescription}
            onChange={(e) => setDiagnosisDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Напр. G35 Множествена склероза, вторично прогресираща форма; или ампутация на долен крайник..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-2">
            Характер на увреждането
          </label>
          <div className="space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isIrreversible}
                onChange={(e) => setIsIrreversible(e.target.checked)}
                className="mt-0.5 accent-medical-teal"
              />
              <span className="text-sm text-dark-text">
                Необратимо — морфологичните промени не подлежат на лечение или подобрение
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isProgressive}
                onChange={(e) => setIsProgressive(e.target.checked)}
                className="mt-0.5 accent-medical-teal"
              />
              <span className="text-sm text-dark-text">
                Прогресиращо — заболяването се влошава с времето
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Брой години с ТЕЛК решение
            <span className="text-medical-slate/60 ml-1">(по избор)</span>
          </label>
          <div className="flex items-center gap-2 w-36">
            <input
              type="number"
              min={0}
              max={80}
              value={previousTelkYears}
              onChange={(e) => setPreviousTelkYears(e.target.value)}
              placeholder="5"
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
            />
            <span className="text-sm text-medical-slate shrink-0">год.</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-critical-red bg-critical-red-bg rounded-lg px-4 py-2.5 border border-critical-red/20">
            {error}
          </p>
        )}

        <button
          onClick={handleCheck}
          disabled={loading}
          className="bg-medical-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-medical-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              Анализира се...
            </>
          ) : (
            'Провери критериите'
          )}
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
          {/* Verdict */}
          <div className={`rounded-2xl border p-6 ${VERDICT_STYLES[result.verdict].bg}`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-3 h-3 rounded-full ${VERDICT_STYLES[result.verdict].dot}`} />
              <span className={`font-medium text-base ${VERDICT_STYLES[result.verdict].text}`}>
                {result.verdictLabel}
              </span>
            </div>
            <p className="text-sm text-dark-text leading-relaxed">{result.explanation}</p>
          </div>

          {/* Criteria */}
          <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6">
            <h3 className="text-sm font-medium text-medical-slate uppercase tracking-wide mb-4">
              Оценка по критерии
            </h3>
            <div className="space-y-3">
              {result.criteria.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 text-base ${c.met ? 'text-vital-green' : 'text-medical-border'}`}>
                    {c.met ? '✓' : '○'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${c.met ? 'text-dark-text' : 'text-medical-slate'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-medical-slate mt-0.5 leading-relaxed">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6">
            <h3 className="text-sm font-medium text-medical-slate uppercase tracking-wide mb-3">
              Препоръка
            </h3>
            <p className="text-sm text-dark-text leading-relaxed mb-4">{result.recommendation}</p>
            <div className="border-t border-medical-border pt-4">
              <p className="text-xs text-medical-slate">
                <span className="font-medium">Правно основание:</span> {result.legalBasis}
              </p>
            </div>
          </div>

          <p className="text-xs text-medical-slate text-center">
            Резултатът е информативен и не замества становище на ТЕЛК комисия или правен съветник.
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
