'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dark-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2.5 rounded-xl border bg-white text-dark-text text-sm',
            'placeholder:text-medical-slate/60',
            'focus:outline-none focus:ring-2 focus:ring-medical-teal focus:border-medical-teal',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-critical-red focus:ring-critical-red'
              : 'border-medical-border',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-critical-red">{error}</p>}
        {hint && !error && <p className="text-xs text-medical-slate">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
