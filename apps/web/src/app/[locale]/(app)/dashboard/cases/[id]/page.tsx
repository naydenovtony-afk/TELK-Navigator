import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { cases, documents, analysisReports } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { Badge } from '@/components/ui'
import { FileUpload } from '@/components/upload/file-upload'
import { AnalyseButton } from '@/components/cases/analyse-button'
import { AnalysisCard } from '@/components/cases/analysis-card'
import { CaseStatusButton } from '@/components/cases/case-status-button'
import { DeleteDocumentButton } from '@/components/cases/delete-document-button'
import { DeleteCaseButton } from '@/components/cases/delete-case-button'

export const dynamic = 'force-dynamic'

const DOC_STATUS_LABEL: Record<string, string> = {
  uploading: 'Качва се',
  processing: 'Обработва се',
  ready: 'Готов',
  error: 'Грешка',
}

const DOC_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
  uploading: 'warning',
  processing: 'warning',
  ready: 'success',
  error: 'error',
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

  // Load all analysis reports for this case's documents
  const docIds = docs.map((d) => d.id)
  const reports = docIds.length
    ? await db.query.analysisReports.findMany({
        where: (ar, { inArray }) => inArray(ar.documentId, docIds),
        orderBy: [desc(analysisReports.createdAt)],
      })
    : []

  const reportByDocId = Object.fromEntries(reports.map((r) => [r.documentId, r]))

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
        <div className="flex items-center gap-3">
          <CaseStatusButton caseId={id} status={caseRow.status as 'active' | 'submitted' | 'closed'} />
          <DeleteCaseButton caseId={id} />
        </div>
      </div>

      {/* Upload section */}
      <section className="mb-10">
        <h2 className="font-display text-xl text-medical-navy mb-3">Качване на документ</h2>
        <FileUpload caseId={id} />
      </section>

      {/* Documents + analysis */}
      <section>
        <h2 className="font-display text-xl text-medical-navy mb-4">
          Документи ({docs.length})
        </h2>

        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-medical-border p-8 text-center">
            <p className="text-sm text-medical-slate">Все още няма качени документи</p>
          </div>
        ) : (
          <div className="space-y-6">
            {docs.map((doc) => {
              const report = reportByDocId[doc.id]
              return (
                <div key={doc.id} className="bg-white rounded-2xl border border-medical-border overflow-hidden">
                  {/* Doc header */}
                  <div className="px-5 py-4 flex items-center gap-3">
                    <FileTypeIcon mimeType={doc.mimeType} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-medical-navy truncate">{doc.fileName}</p>
                      <p className="text-xs text-medical-slate">
                        {new Date(doc.uploadedAt).toLocaleDateString('bg-BG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={DOC_STATUS_VARIANT[doc.status] ?? 'default'}>
                        {DOC_STATUS_LABEL[doc.status] ?? doc.status}
                      </Badge>
                      {['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(doc.mimeType) && doc.status !== 'processing' && !report && (
                        <AnalyseButton documentId={doc.id} disabled={doc.status === 'uploading'} />
                      )}
                      <DeleteDocumentButton documentId={doc.id} />
                    </div>
                  </div>

                  {/* Analysis result */}
                  {report && (
                    <div className="border-t border-medical-border">
                      <AnalysisCard
                        documentsOnFile={report.documentsOnFile}
                        documentsTotal={report.documentsTotal}
                        covered={report.covered as string[]}
                        incomplete={report.incomplete as { id: string; label: string; note: string }[]}
                        missing={report.missing as { id: string; label: string; reason: string }[]}
                        patientSummary={report.patientSummary}
                        icd10Code={doc.icd10Code}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === 'application/pdf'
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-critical-red-bg' : 'bg-medical-surface'}`}>
      {isPdf ? (
        <span className="text-xs font-bold text-critical-red">PDF</span>
      ) : (
        <span className="text-xs font-bold text-medical-slate">IMG</span>
      )}
    </div>
  )
}
