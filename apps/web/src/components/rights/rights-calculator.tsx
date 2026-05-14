'use client'

import { useState } from 'react'
import { calculateRights, BENEFIT_CATEGORIES } from '@/lib/rights'
import type { Benefit } from '@/lib/rights'

const CATEGORY_ICONS: Record<Benefit['category'], string> = {
  financial: '💰',
  transport: '🚌',
  healthcare: '🏥',
  employment: '💼',
  social: '🤝',
}

export function RightsCalculator() {
  const [percent, setPercent] = useState(50)
  const result = calculateRights(percent)

  const byCategory = result.benefits.reduce<Record<string, Benefit[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="bg-white rounded-2xl border border-medical-border p-6">
        <label className="block text-sm font-medium text-medical-navy mb-4">
          Степен на увреждане
        </label>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="flex-1 accent-medical-teal h-2"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, Number(e.target.value)))
                setPercent(v)
              }}
              className="w-16 px-2 py-1.5 text-sm text-center rounded-lg border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-teal/40"
            />
            <span className="text-sm text-medical-slate">%</span>
          </div>
        </div>

        {/* Tier markers */}
        <div className="flex justify-between text-xs text-medical-slate px-0.5">
          <span>0%</span>
          <span className={percent >= 50 ? 'text-medical-teal font-medium' : ''}>50%</span>
          <span className={percent >= 71 ? 'text-medical-teal font-medium' : ''}>71%</span>
          <span className={percent >= 91 ? 'text-medical-teal font-medium' : ''}>91%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Result summary */}
      {result.tier ? (
        <>
          <div className={`rounded-2xl border p-6 ${
            result.tier === 91
              ? 'bg-vital-green-bg border-vital-green/20'
              : result.tier === 71
              ? 'bg-clinical-amber-bg border-clinical-amber/20'
              : 'bg-medical-surface border-medical-border'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-medical-slate mb-1">
                  Категория
                </p>
                <h2 className="font-display text-xl text-medical-navy">{result.tierLabel}</h2>
              </div>
              {result.monthlyAllowance && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-medical-slate mb-1">Месечна добавка (чл. 70 ЗХУ)</p>
                  <p className="font-display text-2xl text-medical-navy">
                    {result.monthlyAllowance} лв.
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-medical-slate">
              При {result.percent}% степен на увреждане имате право на {result.benefits.length} социални придобивки.
            </p>
          </div>

          {/* Benefits by category */}
          <div className="space-y-4">
            {(Object.keys(BENEFIT_CATEGORIES) as Benefit['category'][]).map((cat) => {
              const items = byCategory[cat]
              if (!items?.length) return null
              return (
                <div key={cat} className="bg-white rounded-2xl border border-medical-border overflow-hidden">
                  <div className="px-5 py-3 bg-medical-surface border-b border-medical-border flex items-center gap-2">
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <h3 className="text-sm font-semibold text-medical-navy">
                      {BENEFIT_CATEGORIES[cat]}
                    </h3>
                    <span className="ml-auto text-xs text-medical-slate">{items.length}</span>
                  </div>
                  <ul className="divide-y divide-medical-border">
                    {items.map((b) => (
                      <li key={b.id} className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-medical-navy">{b.label}</p>
                          {b.legalRef && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-medical-teal/10 text-medical-teal border border-medical-teal/20 shrink-0">
                              {b.legalRef}
                            </span>
                          )}
                          {b.sourceUrl && (
                            <a
                              href={b.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium text-medical-teal hover:underline shrink-0 ml-auto"
                            >
                              → Виж
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-medical-slate mt-1 leading-relaxed">{b.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-medical-slate text-center">
            Правата са гарантирани от действащото законодателство (КТ, ЗХУ, ЗДДФЛ, ЗМДТ, ЗЗО). Паричните суми се актуализират ежегодно с акт на Министерския съвет.
          </p>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-medical-border p-10 text-center">
          <p className="font-display text-xl text-medical-navy mb-2">
            Под минималния праг
          </p>
          <p className="text-sm text-medical-slate max-w-sm mx-auto">
            Правата по Закона за хората с увреждания се прилагат при степен на увреждане от 50% и нагоре.
          </p>
        </div>
      )}
    </div>
  )
}
