import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { cases } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSchema = z.object({
  title: z.string().min(1).max(200),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.query.cases.findMany({
    where: eq(cases.userId, session.user.id),
    orderBy: [desc(cases.createdAt)],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [newCase] = await db
    .insert(cases)
    .values({ userId: session.user.id, title: parsed.data.title })
    .returning()

  return NextResponse.json(newCase, { status: 201 })
}
