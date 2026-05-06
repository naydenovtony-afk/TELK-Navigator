import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { cases, documents, deadlines } from '@/db/schema'
import { eq, desc, count, inArray, and, lt } from 'drizzle-orm'
import { Badge } from '@/components/ui'
import { NewCaseButton } from '@/components/cases/new-case-button'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  submitted: 'Подаден',
  closed: 'Приключен',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  submitted: 'warning',
  closed: 'default',
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/bg/sign-in')
  const rows = await db.query.cases.findMany({
    where: eq(cases.userId, userId),
    orderBy: [desc(cases.createdAt)],
  })

  const caseIds = rows.map((c) => c.id)
  const [docsByCase, overdueResult] = await Promise.all([
    caseIds.length
      ? db.select({ caseId: documents.caseId, value: count() })
          .from(documents)
          .where(inArray(documents.caseId, caseIds))
          .groupBy(documents.caseId)
      : Promise.resolve([] as { caseId: string; value: number }[]),
    db.select({ value: count() }).from(deadlines).where(
      and(eq(deadlines.userId, userId), eq(deadlines.isCompleted, false), lt(deadlines.dueAt, new Date()))
    ),
  ])
  const docCountByCaseId = Object.fromEntries(docsByCase.map((r) => [r.caseId, Number(r.value)]))
  const docCount = Object.values(docCountByCaseId).reduce((s, n) => s + n, 0)
  const overdueCount = Number(overdueResult[0]?.value ?? 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Моите случаи</h1>
          <p className="text-sm text-medical-slate mt-1">
            Управлявайте вашите ТЕЛК преписки
          </p>
        </div>
        <NewCaseButton />
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 sm:mb-6 text-sm">
          <span>
            <span className="font-medium text-medical-navy">{rows.length}</span>
            <span className="text-medical-slate ml-1">{rows.length === 1 ? 'случай' : 'случая'}</span>
          </span>
          <span className="text-medical-border">·</span>
          <span>
            <span className="font-medium text-medical-navy">{docCount}</span>
            <span className="text-medical-slate ml-1">{docCount === 1 ? 'документ' : 'документа'}</span>
          </span>
          {overdueCount > 0 && (
            <>
              <span className="text-medical-border">·</span>
              <span className="font-medium text-critical-red">
                {overdueCount} просрочени {overdueCount === 1 ? 'срок' : 'срока'}
              </span>
            </>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderIcon />
          <h2 className="font-display text-xl text-medical-navy mt-4 mb-2">
            Нямате създадени случаи
          </h2>
          <p className="text-sm text-medical-slate mb-6 max-w-sm">
            Създайте първия си случай, за да започнете да качвате документи и да следите процеса.
          </p>
          <NewCaseButton />
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/bg/dashboard/cases/${c.id}`}
              className="bg-white rounded-2xl border border-medical-border p-6 hover:border-medical-teal/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-medium text-medical-navy text-sm leading-snug group-hover:text-medical-teal transition-colors line-clamp-2">
                  {c.title}
                </h3>
                <Badge variant={STATUS_VARIANT[c.status] ?? 'default'} className="shrink-0">
                  {STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-medical-slate">
                  {new Date(c.createdAt).toLocaleDateString('bg-BG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {(docCountByCaseId[c.id] ?? 0) > 0 && (
                  <p className="text-xs text-medical-teal font-medium">
                    {docCountByCaseId[c.id]} {docCountByCaseId[c.id] === 1 ? 'документ' : 'документа'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function FolderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-medical-border">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
