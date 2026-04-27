import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['patient', 'admin'])

export const telkSituationEnum = pgEnum('telk_situation', [
  'preparing',
  'hasDecision',
  'appealing',
  'helpingRelative',
])

export const diagnosisCategoryEnum = pgEnum('diagnosis_category', [
  'respiratory',
  'cardiovascular',
  'neurological',
  'musculoskeletal',
  'endocrine',
  'psychiatric',
  'oncological',
  'renal',
  'other',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull().default('patient'),
  birthDate: text('birth_date'),
  isMinor: boolean('is_minor').notNull().default(false),
  isChildFree: boolean('is_child_free'),
  referralCode: text('referral_code').unique(),
  referredBy: uuid('referred_by').references((): AnyPgColumn => users.id, { onDelete: 'set null' }),
  locale: text('locale').notNull().default('bg'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  telkSituation: telkSituationEnum('telk_situation'),
  mainDiagnosisCategory: diagnosisCategoryEnum('main_diagnosis_category'),
  hasEpicrisis: boolean('has_epicrisis'),
  telkExpiresAt: timestamp('telk_expires_at', { withTimezone: true }),
  dashboardLayout: jsonb('dashboard_layout'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
