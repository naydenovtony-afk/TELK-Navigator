'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'

type UploadState = 'idle' | 'uploading' | 'analysing' | 'success' | 'analysis_failed' | 'error'

interface FileUploadProps {
  caseId: string
  onSuccess?: (documentId: string, fileName: string) => void
  accept?: string
}

export function FileUpload({
  caseId,
  onSuccess,
  accept = '.pdf,image/jpeg,image/png,image/webp',
}: FileUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const upload = useCallback(
    async (file: File) => {
      const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg('Позволени формати: PDF, JPEG, PNG, WebP')
        setState('error')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('Файлът не може да надвишава 20 MB')
        setState('error')
        return
      }

      setState('uploading')
      setProgress(0)
      setErrorMsg('')

      try {
        // 1. Get presigned URL
        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
        })
        if (!presignRes.ok) throw new Error('Грешка при подготовка на качването')
        const { key, uploadUrl } = await presignRes.json()

        // 2. Upload directly to R2
        await uploadWithProgress(file, uploadUrl, setProgress)

        // 3. Register document in DB
        const docRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId, fileKey: key, fileName: file.name, mimeType: file.type }),
        })
        if (!docRes.ok) throw new Error('Грешка при регистриране на документа')
        const doc = await docRes.json()

        onSuccess?.(doc.id, file.name)

        // 4. Trigger AI analysis
        setState('analysing')
        try {
          const analyseRes = await fetch(`/api/documents/${doc.id}/analyse`, { method: 'POST' })
          if (!analyseRes.ok) throw new Error('analysis failed')
          setState('success')
        } catch {
          setState('analysis_failed')
        } finally {
          router.refresh()
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Неочаквана грешка')
        setState('error')
      }
    },
    [caseId, onSuccess, router]
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      upload(files[0])
    },
    [upload]
  )

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors',
          isDragOver
            ? 'border-medical-teal bg-medical-teal/5'
            : 'border-medical-border hover:border-medical-teal/50 hover:bg-medical-surface',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {state === 'uploading' ? (
          <>
            <Spinner size="lg" />
            <p className="text-sm text-medical-slate">Качване… {progress}%</p>
            <div className="w-full max-w-xs h-1.5 bg-medical-border rounded-full overflow-hidden">
              <div
                className="h-full bg-medical-teal transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : state === 'analysing' ? (
          <>
            <Spinner size="lg" />
            <p className="text-sm text-medical-slate">Анализира се с AI…</p>
            <p className="text-xs text-medical-slate/60">Може да отнеме до минута</p>
          </>
        ) : state === 'success' ? (
          <>
            <CheckIcon />
            <p className="text-sm font-medium text-medical-navy">Анализът е готов</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setState('idle'); setProgress(0) }}
              className="text-xs text-medical-teal underline"
            >
              Качи друг
            </button>
          </>
        ) : state === 'analysis_failed' ? (
          <>
            <CheckIcon />
            <p className="text-sm font-medium text-medical-navy">Файлът е качен успешно</p>
            <p className="text-xs text-clinical-amber">AI анализът не успя — опитайте от документите</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setState('idle'); setProgress(0) }}
              className="text-xs text-medical-teal underline"
            >
              Качи друг
            </button>
          </>
        ) : (
          <>
            <UploadIcon />
            <div className="text-center">
              <p className="text-sm font-medium text-medical-navy">
                Влачете файл или кликнете за избор
              </p>
              <p className="text-xs text-medical-slate mt-1">PDF, JPEG, PNG · макс. 20 MB</p>
            </div>
          </>
        )}
      </div>

      {state === 'error' && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}

function uploadWithProgress(
  file: File,
  url: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-medical-slate">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-medical-teal">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
