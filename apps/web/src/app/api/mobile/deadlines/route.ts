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
