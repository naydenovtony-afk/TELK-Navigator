import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { cases } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.query.cases.findMany({
    where: eq(cases.userId, userId),
    orderBy: [desc(cases.createdAt)],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Полето "title" е задължително' }, { status: 400 })

  const [row] = await db.insert(cases).values({ userId, title }).returning()
  return NextResponse.json(row, { status: 201 })
}
