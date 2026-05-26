import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { db } from '@/db'
import { documents, cases } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { deleteObject } from '@/lib/r2'

export const runtime = 'nodejs'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, doc.caseId), eq(cases.userId, userId)),
  })
  if (!caseRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.delete(documents).where(eq(documents.id, id))
  await deleteObject(doc.fileKey).catch(() => {})

  return NextResponse.json({ ok: true })
}
