import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { createPresignedUploadUrl } from '@/lib/r2'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive().max(20 * 1024 * 1024).optional(),
})

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { fileName, mimeType } = parsed.data
  const { key, uploadUrl } = await createPresignedUploadUrl(userId, fileName, mimeType)

  return NextResponse.json({ key, uploadUrl })
}
