import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { cases } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

function serializeCase(row: typeof cases.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    caseType: row.caseType ?? null,
    diagnoses: row.diagnoses ?? null,
    previousPercent: row.previousPercent ?? null,
    appealReason: row.appealReason ?? null,
    commissionDecision: row.commissionDecision ?? null,
    createdAt: row.createdAt,
  }
}

export async function GET(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.query.cases.findMany({
    where: eq(cases.userId, userId),
    orderBy: [desc(cases.createdAt)],
  })

  return NextResponse.json(rows.map(serializeCase))
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  caseType: z.enum(['initial', 'reexamination', 'appeal']).nullable().optional(),
  diagnoses: z.string().max(1000).nullable().optional(),
  previousPercent: z.number().int().min(0).max(100).nullable().optional(),
  appealReason: z.string().max(1000).nullable().optional(),
  commissionDecision: z.string().max(1000).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, caseType, diagnoses, previousPercent, appealReason, commissionDecision } = parsed.data

  const [row] = await db
    .insert(cases)
    .values({ userId, title, caseType, diagnoses, previousPercent, appealReason, commissionDecision })
    .returning()

  return NextResponse.json(serializeCase(row), { status: 201 })
}
