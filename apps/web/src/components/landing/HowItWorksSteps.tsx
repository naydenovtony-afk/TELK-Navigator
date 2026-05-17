'use client'

import { useEffect, useRef, useState } from 'react'
import { UserPlus, FileUp, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Step {
  n: string
  label: string
  desc: string
}

const STEP_ICONS = [UserPlus, FileUp, Sparkles]

interface Props {
  steps: Step[]
  ctaLabel: string
}

export function HowItWorksSteps({ steps, ctaLabel }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <div className="relative flex gap-6 md:gap-10">
        {/* Connector line behind circles */}
        <div className="hidden md:block absolute top-7 left-[16.67%] right-[16.67%] h-px bg-medical-border" />

        {steps.map((s, i) => {
          const Icon = STEP_ICONS[i]
          return (
            <div
              key={s.n}
              className="flex-1 flex flex-col items-center text-center gap-4"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.6s ease ${i * 180}ms, transform 0.6s ease ${i * 180}ms`,
              }}
            >
              <div className="relative z-10 w-14 h-14 rounded-full bg-medical-teal flex items-center justify-center text-white font-medium text-xl">
                {s.n}
              </div>
              <Icon size={28} className="text-medical-teal" strokeWidth={1.5} />
              <p className="text-dark-text font-medium text-lg">{s.label}</p>
              <p className="text-medical-slate text-base leading-relaxed">{s.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/bg/sign-in"
          className="bg-medical-navy text-white px-10 py-4 rounded text-base font-medium hover:bg-medical-teal transition-colors inline-block"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
