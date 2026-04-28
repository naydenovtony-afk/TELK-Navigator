import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { deadlines } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const patchSchema = z.object({
  label: z.string().min(1).max(300).optional(),
  dueAt: z.string().datetime().optional(),
  isCompleted: z.boolean().optional(),
})

async function getOwned(id: string, userId: string) {
  return db.query.deadlines.findFirst({
    where: and(eq(deadlines.id, id), eq(deadlines.userId, userId)),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await getOwned(id, userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const update: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.dueAt) update.dueAt = new Date(parsed.data.dueAt)

  const [updated] = await db.update(deadlines).set(update).where(eq(deadlines.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await getOwned(id, userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(deadlines).where(eq(deadlines.id, id))
  return new NextResponse(null, { status: 204 })
}
