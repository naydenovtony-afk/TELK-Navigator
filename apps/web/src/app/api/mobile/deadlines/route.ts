import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { deadlines } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.query.deadlines.findMany({
    where: eq(deadlines.userId, userId),
    orderBy: [asc(deadlines.dueAt)],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const dueAt = typeof body.dueAt === 'string' ? new Date(body.dueAt) : null

  if (!label) return NextResponse.json({ error: 'Полето "label" е задължително' }, { status: 400 })
  if (!dueAt || isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Невалидна дата' }, { status: 400 })

  const [row] = await db.insert(deadlines).values({ userId, label, dueAt }).returning()
  return NextResponse.json(row, { status: 201 })
}
