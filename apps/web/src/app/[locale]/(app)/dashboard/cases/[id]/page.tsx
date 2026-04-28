import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { cases, documents } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { Badge } from '@/components/ui'
import { FileUpload } from '@/components/upload/file-upload'
import { DocumentList } from '@/components/cases/document-list'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  submitted: 'Подаден',
  closed: 'Приключен',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  submitted: 'warning',
  closed: 'default',
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/bg/sign-in')
  const { id } = await params
  const caseRow = await db.query.cases.findFirst({
    where: and(eq(cases.id, id), eq(cases.userId, userId)),
  })
  if (!caseRow) notFound()

  const docs = await db.query.documents.findMany({
    where: eq(documents.caseId, id),
    orderBy: [desc(documents.uploadedAt)],
  })

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-medical-slate mb-6">
        <Link href="/bg/dashboard" className="hover:text-medical-teal transition-colors">
          Моите случаи
        </Link>
        <span>/</span>
        <span className="text-medical-navy font-medium truncate">{caseRow.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-medical-navy leading-tight">
            {caseRow.title}
          </h1>
          <p className="text-xs text-medical-slate mt-1">
            Създаден на{' '}
            {new Date(caseRow.createdAt).toLocaleDateString('bg-BG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[caseRow.status] ?? 'default'}>
          {STATUS_LABEL[caseRow.status] ?? caseRow.status}
        </Badge>
      </div>

      {/* Upload section */}
      <section className="mb-8">
        <h2 className="font-display text-xl text-medical-navy mb-3">
          Качване на документ
        </h2>
        <FileUpload caseId={id} />
      </section>

      {/* Documents */}
      <section>
        <h2 className="font-display text-xl text-medical-navy mb-3">
          Документи ({docs.length})
        </h2>
        <DocumentList initialDocs={docs} caseId={id} />
      </section>
    </div>
  )
}
