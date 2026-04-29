import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/session'
import { db } from '@/db'
import { promptModules } from '@/db/schema'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  content: z.string().min(1),
})

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db.query.promptModules.findMany()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [row] = await db
    .insert(promptModules)
    .values({ key: parsed.data.key, content: parsed.data.content })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
