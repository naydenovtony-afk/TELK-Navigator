import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileTokenFull } from '@/lib/mobile-auth'
import { db } from '@/db'
import { users, cases } from '@/db/schema'
import { desc, count } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await verifyMobileTokenFull(req)
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allUsers = await db.query.users.findMany({ orderBy: [desc(users.createdAt)] })

  const caseCounts = await db
    .select({ userId: cases.userId, total: count() })
    .from(cases)
    .groupBy(cases.userId)

  const countMap = new Map(caseCounts.map((r) => [r.userId, r.total]))

  return NextResponse.json(
    allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      caseCount: countMap.get(u.id) ?? 0,
    }))
  )
}
