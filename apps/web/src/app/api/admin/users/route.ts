import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/session'
import { db } from '@/db'
import { users } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    columns: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
  })

  return NextResponse.json(rows)
}
