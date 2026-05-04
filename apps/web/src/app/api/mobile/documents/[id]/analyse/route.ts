import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { documents, cases, analysisReports } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getPublicUrl } from '@/lib/r2'
import { analyseDocumentBuffer } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let documentId: string | undefined

  try {
    const userId = await verifyMobileToken(_req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    documentId = (await params).id

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const caseRow = await db.query.cases.findFirst({
      where: and(eq(cases.id, doc.caseId), eq(cases.userId, userId)),
    })
    if (!caseRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(doc.mimeType)) {
      return NextResponse.json({ error: 'Неподдържан тип файл за анализ' }, { status: 400 })
    }

    await db.update(documents).set({ status: 'processing' }).where(eq(documents.id, documentId))

    const url = getPublicUrl(doc.fileKey)
    const fileRes = await fetch(url)
    if (!fileRes.ok) throw new Error(`Failed to fetch file from storage: ${fileRes.status}`)
    const buffer = Buffer.from(await fileRes.arrayBuffer())

    const result = await analyseDocumentBuffer(buffer, doc.mimeType)

    const confidence =
      result.documentsTotal > 0 ? result.documentsOnFile / result.documentsTotal : 0

    const [report] = await db
      .insert(analysisReports)
      .values({
        documentId,
        nmeModuleVersion: result.nmeModuleVersion,
        documentsOnFile: result.documentsOnFile,
        documentsTotal: result.documentsTotal,
        confidence,
        covered: result.covered,
        incomplete: result.incomplete,
        missing: result.missing,
        patientSummary: result.patientSummary,
        doctorSummary: result.doctorSummary,
        scorePrediction: result.scorePrediction,
      })
      .returning()

    await db
      .update(documents)
      .set({ status: 'ready', icd10Code: result.icd10Code ?? null })
      .where(eq(documents.id, documentId))

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[mobile/analyse] failed:', msg)
    if (documentId) {
      await db.update(documents).set({ status: 'ready' }).where(eq(documents.id, documentId)).catch(() => {})
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
