import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const caseStatusEnum = pgEnum('case_status', ['active', 'submitted', 'closed'])

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: caseStatusEnum('status').notNull().default('active'),
  countryCode: text('country_code').notNull().default('BG'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
