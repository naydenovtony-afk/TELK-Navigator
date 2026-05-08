import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { PreferencesForm } from '@/components/settings/preferences-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/bg/sign-in')

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
  })

  if (!user) redirect('/bg/sign-in')

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Настройки</h1>
        <p className="text-sm text-medical-slate mt-1">Профил и предпочитания</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide mb-4">
          Профил
        </h2>
        <div className="flex items-center gap-4 mb-6">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Потребител'}
              width={56}
              height={56}
              className="rounded-full border border-medical-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-medical-surface border border-medical-border flex items-center justify-center text-medical-navy font-medium text-lg">
              {(user.name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-dark-text">{user.name ?? '—'}</p>
            <p className="text-sm text-medical-slate">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <Row label="Имейл" value={user.email} />
          <Row label="Роля" value={user.role === 'admin' ? 'Администратор' : 'Пациент'} />
          <Row
            label="Регистриран на"
            value={new Date(user.createdAt).toLocaleDateString('bg-BG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-sm font-medium text-medical-slate uppercase tracking-wide mb-4">
          Предпочитания
        </h2>
        <PreferencesForm
          initial={
            prefs
              ? {
                  telkSituation: prefs.telkSituation,
                  mainDiagnosisCategory: prefs.mainDiagnosisCategory,
                  hasEpicrisis: prefs.hasEpicrisis,
                  telkExpiresAt: prefs.telkExpiresAt?.toISOString() ?? null,
                }
              : null
          }
        />
      </div>

    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-medical-border last:border-0">
      <span className="text-medical-slate">{label}</span>
      <span className="text-dark-text font-medium">{value}</span>
    </div>
  )
}
