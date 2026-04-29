const BASE_URL = 'https://telk-navigator-web.vercel.app'

export type Case = {
  id: string
  title: string
  status: 'active' | 'submitted' | 'closed'
  createdAt: string
}

export type Deadline = {
  id: string
  label: string
  dueAt: string
  isCompleted: boolean
}

export type AuthResponse = {
  token: string
  userId: string
}

async function request<T>(path: string, options: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
  return json as T
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/mobile/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/mobile/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCases(token: string): Promise<Case[]> {
  return request<Case[]>('/api/mobile/cases', { method: 'GET' }, token)
}

export function getDeadlines(token: string): Promise<Deadline[]> {
  return request<Deadline[]>('/api/mobile/deadlines', { method: 'GET' }, token)
}
