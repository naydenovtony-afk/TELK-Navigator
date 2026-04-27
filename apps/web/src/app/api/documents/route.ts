import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { documents, cases } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSchema = z.object({
  caseId: z.string().uuid(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const caseId = req.nextUrl.searchParams.get('caseId')
  if (!caseId) {
    return NextResponse.json({ error: 'caseId required' }, { status: 400 })
  }

  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, caseId), eq(cases.userId, session.user.id)),
  })
  if (!caseRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const docs = await db.query.documents.findMany({
    where: eq(documents.caseId, caseId),
    orderBy: (d, { desc }) => [desc(d.uploadedAt)],
  })

  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId, fileKey, fileName, mimeType } = parsed.data

  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, caseId), eq(cases.userId, session.user.id)),
  })
  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found or access denied' }, { status: 403 })
  }

  const [doc] = await db
    .insert(documents)
    .values({ caseId, fileKey, fileName, mimeType, status: 'uploading' })
    .returning()

  return NextResponse.json(doc, { status: 201 })
}
