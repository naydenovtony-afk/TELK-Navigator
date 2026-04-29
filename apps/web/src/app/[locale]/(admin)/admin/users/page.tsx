import { db } from '@/db'
import { users } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { UserTable } from '@/components/admin/user-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const rows = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    columns: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Потребители</h1>
        <p className="text-sm text-medical-slate mt-1">{rows.length} регистрирани акаунта</p>
      </div>
      <UserTable initialUsers={rows} />
    </div>
  )
}
