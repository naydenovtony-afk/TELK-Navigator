type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-medical-surface text-medical-slate border-medical-border',
  success: 'bg-vital-green-bg text-vital-green border-vital-green/20',
  warning: 'bg-clinical-amber-bg text-clinical-amber border-clinical-amber/20',
  error: 'bg-critical-red-bg text-critical-red border-critical-red/20',
  info: 'bg-medical-surface text-medical-navy border-medical-border',
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Maps DocumentStatus / AnalysisStatus to badge variants
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    uploading: { variant: 'info', label: 'Качване...' },
    processing: { variant: 'warning', label: 'Обработка...' },
    ready: { variant: 'success', label: 'Готов' },
    error: { variant: 'error', label: 'Грешка' },
    active: { variant: 'success', label: 'Активен' },
    submitted: { variant: 'info', label: 'Подаден' },
    closed: { variant: 'default', label: 'Приключен' },
  }

  const config = map[status] ?? { variant: 'default' as BadgeVariant, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
