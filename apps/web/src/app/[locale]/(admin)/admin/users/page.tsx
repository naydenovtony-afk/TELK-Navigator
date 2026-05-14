import Link from 'next/link'
import { db } from '@/db'
import { users } from '@/db/schema'
import { count, desc } from 'drizzle-orm'
import { UserTable } from '@/components/admin/user-table'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const [rows, [{ total }]] = await Promise.all([
    db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      columns: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(users),
  ])

  const totalCount = Number(total)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Потребители</h1>
        <p className="text-sm text-medical-slate mt-1">{totalCount} регистрирани акаунта</p>
      </div>

      <UserTable initialUsers={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-xs text-medical-slate">
            Страница {page} от {totalPages} · {totalCount} потребителя
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
