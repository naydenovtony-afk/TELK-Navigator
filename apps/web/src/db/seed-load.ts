import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { count } from 'drizzle-orm'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const USERS_COUNT = 1_000
const CASES_PER_USER = 12  // 12 000 total cases
const DOCS_PER_CASE = 3    // 36 000 total documents (first 3 000 cases only)

const STATUSES = ['active', 'submitted', 'closed'] as const
const DOC_NAMES = [
  'Епикриза от болница.pdf',
  'Амбулаторен лист.pdf',
  'Рентгенография.pdf',
  'Лабораторни резултати.pdf',
  'Консултация специалист.pdf',
]

async function loadSeed() {
  const [{ existing }] = await db.select({ existing: count() }).from(schema.users)
  if (Number(existing) > 200) {
    console.log(`DB already has ${existing} users — skipping load seed.`)
    return
  }

  console.log(`Generating ${USERS_COUNT} users…`)
  const userRows = Array.from({ length: USERS_COUNT }, (_, i) => ({
    id: crypto.randomUUID(),
    email: `load_user_${i + 1}@telk-load.internal`,
    name: `Потребител ${i + 1}`,
    role: 'patient' as const,
  }))

  for (let i = 0; i < userRows.length; i += 200) {
    await db.insert(schema.users).values(userRows.slice(i, i + 200))
    process.stdout.write(`  users ${i + 200}/${USERS_COUNT}\r`)
  }
  console.log(`\n  ✓ ${USERS_COUNT} users inserted`)

  console.log(`Generating ${USERS_COUNT * CASES_PER_USER} cases…`)
  const caseRows = userRows.flatMap((u, ui) =>
    Array.from({ length: CASES_PER_USER }, (_, ci) => ({
      id: crypto.randomUUID(),
      userId: u.id,
      title: `ТЕЛК преписка ${ci + 1} — ${u.name}`,
      status: STATUSES[(ui + ci) % 3],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 730) * 86_400_000),
    })),
  )

  const CASE_BATCH = 500
  for (let i = 0; i < caseRows.length; i += CASE_BATCH) {
    await db.insert(schema.cases).values(caseRows.slice(i, i + CASE_BATCH))
    if (i % 5_000 === 0) process.stdout.write(`  cases ${i}/${caseRows.length}\r`)
  }
  console.log(`\n  ✓ ${caseRows.length} cases inserted`)

  // Seed documents only for the first 3 000 cases to keep the script fast
  const casesForDocs = caseRows.slice(0, 3_000)
  const docRows = casesForDocs.flatMap((c, ci) =>
    Array.from({ length: DOCS_PER_CASE }, (_, di) => ({
      id: crypto.randomUUID(),
      caseId: c.id,
      fileKey: `bulk/${c.userId}/${c.id}/doc_${di + 1}.pdf`,
      fileName: DOC_NAMES[(ci + di) % DOC_NAMES.length],
      mimeType: 'application/pdf',
      status: 'ready' as const,
    })),
  )

  const DOC_BATCH = 500
  for (let i = 0; i < docRows.length; i += DOC_BATCH) {
    await db.insert(schema.documents).values(docRows.slice(i, i + DOC_BATCH))
    if (i % 5_000 === 0) process.stdout.write(`  docs ${i}/${docRows.length}\r`)
  }
  console.log(`\n  ✓ ${docRows.length} documents inserted`)

  console.log('\nLoad seed complete.')
  console.log(`  Users   : ${USERS_COUNT}`)
  console.log(`  Cases   : ${caseRows.length}`)
  console.log(`  Documents: ${docRows.length}`)
}

loadSeed().catch((err) => {
  console.error(err)
  process.exit(1)
})
