import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const secret = process.env.NEXTAUTH_SECRET
if (!secret) throw new Error('NEXTAUTH_SECRET is not set')

export type MobileAuth = { userId: string; role: string }

export async function verifyMobileTokenFull(req: NextRequest): Promise<MobileAuth | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    )
    if (!payload.sub) return null
    return { userId: payload.sub, role: (payload.role as string) ?? 'patient' }
  } catch {
    return null
  }
}

export async function verifyMobileToken(req: NextRequest): Promise<string | null> {
  return (await verifyMobileTokenFull(req))?.userId ?? null
}
