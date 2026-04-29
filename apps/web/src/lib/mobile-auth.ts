import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

export async function verifyMobileToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    )
    return payload.sub ?? null
  } catch {
    return null
  }
}
