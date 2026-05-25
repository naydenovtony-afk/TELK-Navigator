import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

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
  // Auth.js required fields
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  // App-specific fields
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
  aiResults: jsonb('ai_results'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

// Auth.js-compatible accounts table (compound PK: provider + providerAccountId)
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)
