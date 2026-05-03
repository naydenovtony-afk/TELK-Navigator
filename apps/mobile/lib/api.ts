const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://telk-navigator-web.vercel.app'

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

export type Document = {
  id: string
  caseId: string
  caseTitle: string
  fileName: string
  mimeType: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  uploadedAt: string
}

export type AdminUser = {
  id: string
  name: string | null
  email: string
  role: 'patient' | 'admin'
  createdAt: string
  caseCount: number
}

export type AuthResponse = {
  token: string
  userId: string
  role: string
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

export function getDocuments(token: string): Promise<Document[]> {
  return request<Document[]>('/api/mobile/documents', { method: 'GET' }, token)
}

export type UserProfile = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export function getAdminUsers(token: string): Promise<AdminUser[]> {
  return request<AdminUser[]>('/api/mobile/admin/users', { method: 'GET' }, token)
}

export function getProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>('/api/mobile/profile', { method: 'GET' }, token)
}
