import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function LandingPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('landing')

  const features = [
    {
      key: 'ai',
      icon: '◈',
      title: t('features.ai.title'),
      desc: t('features.ai.desc'),
    },
    {
      key: 'rights',
      icon: '⊙',
      title: t('features.rights.title'),
      desc: t('features.rights.desc'),
    },
    {
      key: 'deadlines',
      icon: '◷',
      title: t('features.deadlines.title'),
      desc: t('features.deadlines.desc'),
    },
    {
      key: 'cases',
      icon: '▣',
      title: t('features.cases.title'),
      desc: t('features.cases.desc'),
    },
  ]

  const steps = [
    { n: '1', label: t('how.step1.label'), desc: t('how.step1.desc') },
    { n: '2', label: t('how.step2.label'), desc: t('how.step2.desc') },
    { n: '3', label: t('how.step3.label'), desc: t('how.step3.desc') },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-medical-surface">

      {/* Nav */}
      <header className="bg-ocean-hero border-b border-medical-border/20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-display text-lg text-white font-medium tracking-wide">
            ТЕЛК Навигатор
          </span>
          <Link
            href="/bg/sign-in"
            className="text-sm text-medical-border hover:text-white transition-colors"
          >
            {t('hero.signIn')}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ocean-hero px-6 py-24 text-center">
        <p className="text-medical-teal text-sm font-medium tracking-widest uppercase mb-6">
          За хора с увреждания в България
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-white font-medium leading-tight mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-medical-border text-xl mb-6 font-medium">
          {t('hero.subtitle')}
        </p>
        <p className="text-medical-slate text-base max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#8faec3' }}>
          {t('hero.description')}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/bg/sign-in"
            className="bg-medical-teal text-white px-8 py-3 rounded text-sm font-medium hover:bg-medical-navy transition-colors"
          >
            {t('hero.cta')}
          </Link>
          <Link
            href="#how"
            className="border border-medical-border/40 text-medical-border px-8 py-3 rounded text-sm font-medium hover:border-medical-border/80 transition-colors"
          >
            Как работи
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <h2 className="text-2xl font-medium text-center text-medical-navy mb-12">
          {t('features.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.key}
              className="bg-white border border-medical-border rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-medical-teal text-xl">{f.icon}</span>
                <span className="text-dark-text font-medium text-base">{f.title}</span>
              </div>
              <p className="text-medical-slate text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white border-t border-medical-border py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium text-center text-medical-navy mb-12">
            {t('how.title')}
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {steps.map((s) => (
              <div key={s.n} className="flex-1 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full border border-medical-border flex items-center justify-center text-medical-navy font-medium text-base">
                  {s.n}
                </div>
                <p className="text-dark-text font-medium text-base">{s.label}</p>
                <p className="text-medical-slate text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/bg/sign-in"
              className="bg-medical-navy text-white px-10 py-3 rounded text-sm font-medium hover:bg-medical-teal transition-colors inline-block"
            >
              {t('hero.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ocean-hero border-t border-medical-border/20 py-8 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-base text-medical-border font-medium">
            ТЕЛК Навигатор
          </span>
          <span className="text-xs text-medical-slate" style={{ color: '#4a6070' }}>
            © {new Date().getFullYear()} {t('footer.rights')}
          </span>
        </div>
      </footer>
    </div>
  )
}
