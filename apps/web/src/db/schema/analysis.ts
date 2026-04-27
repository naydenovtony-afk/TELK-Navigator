import { integer, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { documents } from './documents'

export const analysisReports = pgTable('analysis_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  nmeModuleVersion: text('nme_module_version').notNull(),
  documentsOnFile: integer('documents_on_file').notNull(),
  documentsTotal: integer('documents_total').notNull(),
  confidence: real('confidence').notNull(),
  covered: jsonb('covered').notNull().$type<string[]>(),
  incomplete: jsonb('incomplete').notNull().$type<{ id: string; label: string; note: string }[]>(),
  missing: jsonb('missing').notNull().$type<{ id: string; label: string; reason: string }[]>(),
  patientSummary: text('patient_summary').notNull(),
  doctorSummary: text('doctor_summary').notNull(),
  scorePrediction: jsonb('score_prediction').notNull().$type<{
    min: number
    max: number
    note: string
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const nmeModules = pgTable('nme_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryCode: text('category_code').notNull(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  content: text('content').notNull(),
  isActive: integer('is_active').notNull().default(1),
  nmeSource: text('nme_source').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
