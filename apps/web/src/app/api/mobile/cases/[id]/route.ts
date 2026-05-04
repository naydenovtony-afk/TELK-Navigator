import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { cases } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'submitted', 'closed']).optional(),
})

async function getOwnedCase(id: string, userId: string) {
  return db.query.cases.findFirst({
    where: and(eq(cases.id, id), eq(cases.userId, userId)),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedCase(id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(cases)
    .set(parsed.data)
    .where(eq(cases.id, id))
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
  const existing = await getOwnedCase(id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(cases).where(eq(cases.id, id))
  return NextResponse.json({ ok: true })
}
