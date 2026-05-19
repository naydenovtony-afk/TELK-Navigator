import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileTokenFull } from '@/lib/mobile-auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyMobileTokenFull(req)
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === auth.userId) {
    return NextResponse.json({ error: 'Не можете да изтриете собствения си акаунт.' }, { status: 400 })
  }

  await db.delete(users).where(eq(users.id, id))

  return NextResponse.json({ ok: true })
}
