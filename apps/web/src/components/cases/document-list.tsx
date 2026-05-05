'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  telk_decision: 'ТЕЛК решение',
  epicrisis: 'Епикриза',
  outpatient_sheet: 'Амбулаторен лист',
  lab_results: 'Лабораторни изследвания',
  imaging: 'Образна диагностика',
  specialist_opinion: 'Специалистично становище',
  other: 'Друго',
}

type Doc = {
  id: string
  fileName: string
  mimeType: string
  documentType?: string | null
  status: string
  uploadedAt: Date | string
}

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

interface DocumentListProps {
  initialDocs: Doc[]
  caseId: string
}

export function DocumentList({ initialDocs }: DocumentListProps) {
  const [docs] = useState<Doc[]>(initialDocs)

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-medical-border p-8 text-center">
        <p className="text-sm text-medical-slate">Все още няма качени документи</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-xl border border-medical-border px-4 py-3 flex items-center gap-3"
        >
          <FileTypeIcon mimeType={doc.mimeType} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-medical-navy truncate">{doc.fileName}</p>
            {doc.documentType && (
              <p className="text-xs font-medium text-medical-teal">
                {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
              </p>
            )}
            <p className="text-xs text-medical-slate">
              {new Date(doc.uploadedAt).toLocaleDateString('bg-BG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <Badge variant={DOC_STATUS_VARIANT[doc.status] ?? 'default'}>
            {DOC_STATUS_LABEL[doc.status] ?? doc.status}
          </Badge>
        </div>
      ))}
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
