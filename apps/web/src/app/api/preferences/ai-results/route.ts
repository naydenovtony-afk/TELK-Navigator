import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
    columns: { aiResults: true },
  })

  return NextResponse.json((row?.aiResults as Record<string, unknown>) ?? {})
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Load existing, merge the incoming key, write back
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
    columns: { aiResults: true },
  })

  const merged = { ...((existing?.aiResults as Record<string, unknown>) ?? {}), ...body }

  await db
    .insert(userPreferences)
    .values({ userId, aiResults: merged })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { aiResults: merged, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
