'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'telk_appeal'

export default function AppealPage() {
  const [applicantName, setApplicantName] = useState('')
  const [telkCity, setTelkCity] = useState('')
  const [receivedPercent, setReceivedPercent] = useState('')
  const [expectedPercent, setExpectedPercent] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [grounds, setGrounds] = useState('')
  const [missingDocuments, setMissingDocuments] = useState('')
  const [appeal, setAppeal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { setAppeal(JSON.parse(saved)); setRestored(true) }
    } catch {}
  }, [])

  async function handleGenerate() {
    setError('')
    setAppeal('')
    const rPct = parseInt(receivedPercent, 10)
    const ePct = parseInt(expectedPercent, 10)

    if (!applicantName.trim()) { setError('Въведете вашите имена.'); return }
    if (!telkCity.trim()) { setError('Въведете град на ТЕЛК комисията.'); return }
    if (isNaN(rPct) || rPct < 0 || rPct > 100) { setError('Въведете валиден получен процент.'); return }
    if (isNaN(ePct) || ePct < 1 || ePct > 100) { setError('Въведете валиден очакван процент.'); return }
    if (ePct <= rPct) { setError('Очакваният процент трябва да е по-висок от получения.'); return }
    if (!diagnosis.trim()) { setError('Въведете диагноза.'); return }
    if (grounds.trim().length < 10) { setError('Опишете основанията за обжалване (мин. 10 символа).'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantName.trim(),
          telkCity: telkCity.trim(),
          receivedPercent: rPct,
          expectedPercent: ePct,
          diagnosisDescription: diagnosis.trim(),
          groundsForAppeal: grounds.trim(),
          missingDocuments: missingDocuments.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Грешка')
      setAppeal(data.appeal)
      setRestored(false)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.appeal)) } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(appeal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Асистент за обжалване</h1>
        <p className="text-sm text-medical-slate mt-1">
          Генерирайте официална жалба против решение на ТЕЛК с цитирани правни основания
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-medical-border p-6 mb-6 space-y-5">
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide">Данни за жалбата</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Вашите имена <span className="text-critical-red">*</span>
            </label>
            <input
              type="text" value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Иван Петров Иванов"
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Град на ТЕЛК комисията <span className="text-critical-red">*</span>
            </label>
            <input
              type="text" value={telkCity}
              onChange={(e) => setTelkCity(e.target.value)}
              placeholder="София, Пловдив..."
              className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Получена оценка <span className="text-critical-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} value={receivedPercent}
                onChange={(e) => setReceivedPercent(e.target.value)}
                placeholder="50"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-medical-slate mb-1.5">
              Справедлива оценка (исканата) <span className="text-critical-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={100} value={expectedPercent}
                onChange={(e) => setExpectedPercent(e.target.value)}
                placeholder="71"
                className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-medical-teal"
              />
              <span className="text-sm text-medical-slate shrink-0">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Диагноза / МКБ код <span className="text-critical-red">*</span>
          </label>
          <input
            type="text" value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Напр. M47.26 Спондилоза с радикулопатия, лумбален дял"
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Основания за обжалване <span className="text-critical-red">*</span>
          </label>
          <textarea
            value={grounds}
            onChange={(e) => setGrounds(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Опишете защо смятате, че решението е неправилно — напр. не са взети предвид всички документи, функционалният статус е подценен, не е спазена НМЕ процедура..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-medical-slate mb-1.5">
            Непризнати документи или обстоятелства
            <span className="text-medical-slate/60 ml-1">(по избор)</span>
          </label>
          <textarea
            value={missingDocuments}
            onChange={(e) => setMissingDocuments(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Епикризи, изследвания или специализирани консултации, непотвърдени от комисията..."
            className="w-full border border-medical-border rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder:text-medical-slate/60 focus:outline-none focus:border-medical-teal resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-critical-red bg-critical-red-bg rounded-lg px-4 py-2.5 border border-critical-red/20">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate} disabled={loading}
          className="bg-medical-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-medical-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <><Spinner />Генерира се...</> : 'Генерирай жалба'}
        </button>
      </div>

      {appeal && (
        <div className="bg-white rounded-2xl border border-medical-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-medical-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-dark-text">Жалба до съда</span>
              {restored && (
                <span className="text-xs text-medical-slate bg-medical-surface px-2 py-0.5 rounded-full">
                  от последна сесия
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setAppeal(''); setRestored(false); try { localStorage.removeItem(STORAGE_KEY) } catch {} }}
                className="text-xs text-medical-slate hover:text-critical-red transition-colors"
              >
                Изчисти
              </button>
              <button
                onClick={handleCopy}
                className="text-sm text-medical-teal hover:text-medical-navy transition-colors font-medium"
              >
                {copied ? '✓ Копирано' : 'Копирай'}
              </button>
            </div>
          </div>
          <pre className="p-6 text-sm text-dark-text leading-relaxed whitespace-pre-wrap font-sans">
            {appeal}
          </pre>
          <div className="px-6 py-4 border-t border-medical-border bg-clinical-amber-bg">
            <p className="text-xs text-clinical-amber">
              Жалбата е генерирана от AI и трябва да се прегледа от адвокат преди подаване. Срокът за обжалване е 14 дни от получаване на решението (АПК чл.149).
            </p>
          </div>
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
