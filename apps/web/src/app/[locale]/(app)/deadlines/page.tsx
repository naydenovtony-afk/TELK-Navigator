import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { deadlines } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { DeadlineList } from '@/components/deadlines/deadline-list'
import { NewDeadlineButton } from '@/components/deadlines/new-deadline-button'

export const dynamic = 'force-dynamic'

export default async function DeadlinesPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/bg/sign-in')

  const rows = await db.query.deadlines.findMany({
    where: eq(deadlines.userId, userId),
    orderBy: [asc(deadlines.dueAt)],
  })

  const overdue = rows.filter((d) => !d.isCompleted && new Date(d.dueAt) < new Date()).length
  const upcoming = rows.filter((d) => !d.isCompleted && new Date(d.dueAt) >= new Date()).length

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-medical-navy">Срокове</h1>
          <p className="text-sm text-medical-slate mt-1">
            {overdue > 0
              ? `${overdue} просрочени · ${upcoming} предстоящи`
              : upcoming > 0
              ? `${upcoming} предстоящи срока`
              : 'Всички срокове са наред'}
          </p>
        </div>
        <NewDeadlineButton />
      </div>

      <DeadlineList initialDeadlines={rows.map((d) => ({
        ...d,
        dueAt: d.dueAt.toISOString(),
      }))} />
    </div>
  )
}
