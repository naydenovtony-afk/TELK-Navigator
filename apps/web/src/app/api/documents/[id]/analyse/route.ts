import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { documents, cases, analysisReports } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { extractTextFromKey } from '@/lib/pdf'
import { analyseDocument } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: documentId } = await params

  // Verify document belongs to the user via case ownership
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    with: { case: true },
  })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, doc.caseId), eq(cases.userId, userId)),
  })
  if (!caseRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (doc.mimeType !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF documents can be analysed' }, { status: 400 })
  }

  // Mark as processing
  await db.update(documents).set({ status: 'processing' }).where(eq(documents.id, documentId))

  try {
    // Extract text from R2
    const text = await extractTextFromKey(doc.fileKey)

    if (!text || text.length < 50) {
      await db.update(documents).set({ status: 'error' }).where(eq(documents.id, documentId))
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 })
    }

    // Run AI analysis
    const result = await analyseDocument(text)

    // Persist analysis report
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

    // Update document: mark ready + store ICD-10 and extracted text
    await db
      .update(documents)
      .set({
        status: 'ready',
        icd10Code: result.icd10Code ?? null,
        textContent: text,
      })
      .where(eq(documents.id, documentId))

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    await db.update(documents).set({ status: 'error' }).where(eq(documents.id, documentId))
    const msg = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
