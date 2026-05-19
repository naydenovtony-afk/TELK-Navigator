import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { documents, cases } from '@/db/schema'
import { eq, desc, inArray, and } from 'drizzle-orm'
import { z } from 'zod'
import { getPublicUrl } from '@/lib/r2'

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
      documentType: d.documentType ?? null,
      status: d.status,
      fileUrl: getPublicUrl(d.fileKey),
      uploadedAt: d.uploadedAt,
    }))
  )
}

const DOCUMENT_TYPES = ['telk_decision', 'epicrisis', 'outpatient_sheet', 'lab_results', 'imaging', 'specialist_opinion', 'other'] as const

const createSchema = z.object({
  caseId: z.string().uuid(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
})

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId, fileKey, fileName, mimeType, documentType } = parsed.data

  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, caseId), eq(cases.userId, userId)),
  })
  if (!caseRow) return NextResponse.json({ error: 'Case not found or access denied' }, { status: 403 })

  const [doc] = await db
    .insert(documents)
    .values({ caseId, fileKey, fileName, mimeType, documentType: documentType ?? null, status: 'ready' })
    .returning()

  return NextResponse.json(
    {
      id: doc.id,
      caseId: doc.caseId,
      caseTitle: caseRow.title,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
    },
    { status: 201 }
  )
}
