import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { deadlines } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.query.deadlines.findFirst({
    where: and(eq(deadlines.id, id), eq(deadlines.userId, userId)),
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await db
    .update(deadlines)
    .set({ isCompleted: !existing.isCompleted })
    .where(eq(deadlines.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await db.delete(deadlines).where(and(eq(deadlines.id, id), eq(deadlines.userId, userId)))
  return NextResponse.json({ ok: true })
}
