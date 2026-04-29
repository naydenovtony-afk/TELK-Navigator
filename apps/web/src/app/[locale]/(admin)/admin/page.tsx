import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, cases, documents, analysisReports, promptModules } from '@/db/schema'
import { count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const session = await auth()

  const [[{ total: totalUsers }], [{ total: totalCases }], [{ total: totalDocs }], [{ total: totalReports }], [{ total: totalPrompts }]] =
    await Promise.all([
      db.select({ total: count() }).from(users),
      db.select({ total: count() }).from(cases),
      db.select({ total: count() }).from(documents),
      db.select({ total: count() }).from(analysisReports),
      db.select({ total: count() }).from(promptModules),
    ])

  const stats = [
    { label: 'Потребители', value: totalUsers },
    { label: 'Случаи', value: totalCases },
    { label: 'Документи', value: totalDocs },
    { label: 'AI анализи', value: totalReports },
    { label: 'Prompt модули', value: totalPrompts },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Административен панел</h1>
        <p className="text-sm text-medical-slate mt-1">
          Добре дошли, {session?.user?.name ?? session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-medical-border p-6">
            <p className="text-3xl font-display text-medical-navy">{s.value}</p>
            <p className="text-sm text-medical-slate mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/bg/admin/users" className="bg-white rounded-2xl border border-medical-border p-6 hover:border-medical-teal/50 hover:shadow-sm transition-all group block">
          <h2 className="font-display text-lg text-medical-navy group-hover:text-medical-teal transition-colors">Управление на потребители</h2>
          <p className="text-sm text-medical-slate mt-1">Промяна на роли, преглед на акаунти</p>
        </Link>
        <Link href="/bg/admin/prompts" className="bg-white rounded-2xl border border-medical-border p-6 hover:border-medical-teal/50 hover:shadow-sm transition-all group block">
          <h2 className="font-display text-lg text-medical-navy group-hover:text-medical-teal transition-colors">Prompt модули</h2>
          <p className="text-sm text-medical-slate mt-1">Редактиране на AI промптове за анализ</p>
        </Link>
      </div>
    </div>
  )
}
