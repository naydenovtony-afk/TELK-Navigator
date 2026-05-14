import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { cases } from './cases'

export const documentStatusEnum = pgEnum('document_status', [
  'uploading',
  'processing',
  'ready',
  'error',
])

export const documentTypeEnum = pgEnum('document_type', [
  'telk_decision',
  'epicrisis',
  'outpatient_sheet',
  'lab_results',
  'imaging',
  'specialist_opinion',
  'other',
])

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    fileKey: text('file_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    documentType: documentTypeEnum('document_type'),
    textContent: text('text_content'),
    icd10Code: text('icd10_code'),
    status: documentStatusEnum('status').notNull().default('uploading'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('documents_case_id_idx').on(t.caseId),
    index('documents_uploaded_at_idx').on(t.uploadedAt),
  ],
)

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, { fields: [documents.caseId], references: [cases.id] }),
}))
