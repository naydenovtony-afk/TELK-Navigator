export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface Document {
  id: string
  caseId: string
  fileKey: string | null
  fileName: string | null
  mimeType: string | null
  textContent: string | null
  icd10Code: string | null
  status: DocumentStatus
  uploadedAt: string
}
