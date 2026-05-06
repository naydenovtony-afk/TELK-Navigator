import { Badge } from '@/components/ui'

interface IncompleteItem {
  id: string
  label: string
  note: string
}

interface MissingItem {
  id: string
  label: string
  reason: string
}

interface AnalysisCardProps {
  documentsOnFile: number
  documentsTotal: number
  covered: string[]
  incomplete: IncompleteItem[]
  missing: MissingItem[]
  patientSummary: string
  icd10Code?: string | null
}

export function AnalysisCard({
  documentsOnFile,
  documentsTotal,
  covered,
  incomplete,
  missing,
  patientSummary,
  icd10Code,
}: AnalysisCardProps) {
  const pct = documentsTotal > 0 ? Math.round((documentsOnFile / documentsTotal) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-medical-border divide-y divide-medical-border">
      {/* Summary header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-medical-navy">Резултат от анализа</h3>
          {icd10Code && (
            <Badge variant="info">МКБ-10: {icd10Code}</Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-medical-slate">Документи на ред</span>
          <span className="font-medium text-medical-navy">{documentsOnFile} / {documentsTotal}</span>
        </div>
        <div className="w-full h-2 bg-medical-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-vital-green' : pct >= 50 ? 'bg-clinical-amber' : 'bg-critical-red'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Patient summary */}
        <p className="mt-4 text-sm text-medical-slate leading-relaxed">{patientSummary}</p>
      </div>

      {/* Covered */}
      {covered.length > 0 && (
        <div className="p-4 sm:p-6">
          <h4 className="text-xs font-semibold text-vital-green uppercase tracking-wide mb-3">
            Налични елементи ({covered.length})
          </h4>
          <ul className="space-y-1">
            {covered.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-medical-navy">
                <span className="mt-0.5 text-vital-green shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Incomplete */}
      {incomplete.length > 0 && (
        <div className="p-4 sm:p-6">
          <h4 className="text-xs font-semibold text-clinical-amber uppercase tracking-wide mb-3">
            Непълни елементи ({incomplete.length})
          </h4>
          <ul className="space-y-3">
            {incomplete.map((item) => (
              <li key={item.id}>
                <p className="text-sm font-medium text-medical-navy">{item.label}</p>
                <p className="text-xs text-medical-slate mt-0.5">{item.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing */}
      {missing.length > 0 && (
        <div className="p-4 sm:p-6">
          <h4 className="text-xs font-semibold text-critical-red uppercase tracking-wide mb-3">
            Липсващи елементи ({missing.length})
          </h4>
          <ul className="space-y-3">
            {missing.map((item) => (
              <li key={item.id}>
                <p className="text-sm font-medium text-medical-navy">{item.label}</p>
                <p className="text-xs text-medical-slate mt-0.5">{item.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
