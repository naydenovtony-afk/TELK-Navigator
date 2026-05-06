import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { documents, cases } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/bg/sign-in')

  const rows = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
      status: documents.status,
      uploadedAt: documents.uploadedAt,
      caseId: cases.id,
      caseTitle: cases.title,
    })
    .from(documents)
    .innerJoin(cases, eq(documents.caseId, cases.id))
    .where(eq(cases.userId, userId))
    .orderBy(desc(documents.uploadedAt))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-medical-navy">Всички документи</h1>
        <p className="text-sm text-medical-slate mt-1">
          Документи от всички ваши случаи
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <DocIcon />
          <h2 className="font-display text-xl text-medical-navy mt-4 mb-2">
            Нямате качени документи
          </h2>
          <p className="text-sm text-medical-slate mb-6 max-w-sm">
            Отворете случай и качете медицинска документация за анализ.
          </p>
          <Link
            href="/bg/dashboard"
            className="bg-medical-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-medical-teal transition-colors"
          >
            Към случаите
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-medical-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-medical-border bg-medical-surface">
                  <th className="text-left px-4 sm:px-6 py-3 text-medical-slate font-medium">Файл</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-medical-slate font-medium hidden sm:table-cell">Случай</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-medical-slate font-medium">Статус</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-medical-slate font-medium hidden sm:table-cell">Качен на</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border">
                {rows.map((doc) => (
                  <tr key={doc.id} className="hover:bg-medical-surface/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                        <FileIcon mime={doc.mimeType} />
                        <span className="text-dark-text font-medium truncate max-w-[140px] sm:max-w-xs">
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <Link
                        href={`/bg/dashboard/cases/${doc.caseId}`}
                        className="text-medical-teal hover:underline"
                      >
                        {doc.caseTitle}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-medical-slate hidden sm:table-cell">
                      {new Date(doc.uploadedAt).toLocaleDateString('bg-BG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function DocIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-medical-border">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
      <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FileIcon({ mime }: { mime: string }) {
  const isPdf = mime === 'application/pdf'
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPdf ? 'bg-critical-red-bg text-critical-red' : 'bg-medical-surface text-medical-slate'}`}>
      {isPdf ? 'PDF' : mime.split('/')[1]?.toUpperCase().slice(0, 4) ?? 'FILE'}
    </span>
  )
}
