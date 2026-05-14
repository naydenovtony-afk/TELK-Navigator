import Link from 'next/link'
import { db } from '@/db'
import { cases, users } from '@/db/schema'
import { count, desc, eq } from 'drizzle-orm'
import { CasesTable } from '@/components/admin/cases-table'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: cases.id,
        title: cases.title,
        status: cases.status,
        createdAt: cases.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(cases)
      .leftJoin(users, eq(cases.userId, users.id))
      .orderBy(desc(cases.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(cases),
  ])

  const totalCount = Number(total)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Случаи</h1>
        <p className="text-sm text-medical-slate mt-1">{totalCount} случая в системата</p>
      </div>

      <CasesTable initialCases={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-xs text-medical-slate">
            Страница {page} от {totalPages} · {totalCount} случая
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-medical-border hover:border-medical-teal text-medical-navy transition-colors"
              >
                ← Предишна
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-medical-border hover:border-medical-teal text-medical-navy transition-colors"
              >
                Следваща →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
