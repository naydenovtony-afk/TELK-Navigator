import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { documents, cases } from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userCases = await db.query.cases.findMany({ where: eq(cases.userId, userId) })
  if (userCases.length === 0) return NextResponse.json([])

  const caseIds = userCases.map((c) => c.id)
  const caseMap = new Map(userCases.map((c) => [c.id, c.title]))

  const docs = await db.query.documents.findMany({
    where: inArray(documents.caseId, caseIds),
    orderBy: [desc(documents.uploadedAt)],
  })

  return NextResponse.json(
    docs.map((d) => ({
      id: d.id,
      caseId: d.caseId,
      caseTitle: caseMap.get(d.caseId) ?? '',
      fileName: d.fileName,
      mimeType: d.mimeType,
      status: d.status,
      uploadedAt: d.uploadedAt,
    }))
  )
}
