import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/session'
import { db } from '@/db'
import { promptModules } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const patchSchema = z.object({
  content: z.string().min(1),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(promptModules)
    .set({ content: parsed.data.content, version: db.$count(promptModules) })
    .where(eq(promptModules.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await db.delete(promptModules).where(eq(promptModules.id, id))
  return new NextResponse(null, { status: 204 })
}
