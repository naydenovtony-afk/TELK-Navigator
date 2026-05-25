interface Entry {
  count: number
  resetAt: number
}

// Module-level store — one map per serverless instance.
// Good enough for capstone; replace with Upstash Redis for multi-instance production.
const store = new Map<string, Entry>()

export function rateLimit(
  key: string,
  max: number = 5,
  windowMs: number = 15 * 60 * 1000,
): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
