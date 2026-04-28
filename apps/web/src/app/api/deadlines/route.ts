import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { deadlines } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSchema = z.object({
  label: z.string().min(1).max(300),
  dueAt: z.string().datetime(),
})

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.query.deadlines.findMany({
    where: eq(deadlines.userId, userId),
    orderBy: [asc(deadlines.dueAt)],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [row] = await db
    .insert(deadlines)
    .values({ userId, label: parsed.data.label, dueAt: new Date(parsed.data.dueAt) })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
