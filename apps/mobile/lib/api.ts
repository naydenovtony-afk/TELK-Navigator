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

export function createDeadline(token: string, label: string, dueAt: string): Promise<Deadline> {
  return request<Deadline>('/api/mobile/deadlines', {
    method: 'POST',
    body: JSON.stringify({ label, dueAt }),
  }, token)
}

export function toggleDeadline(token: string, id: string): Promise<Deadline> {
  return request<Deadline>(`/api/mobile/deadlines/${id}`, { method: 'PATCH' }, token)
}

export function deleteDeadline(token: string, id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/mobile/deadlines/${id}`, { method: 'DELETE' }, token)
}

export function getDocuments(token: string): Promise<Document[]> {
  return request<Document[]>('/api/mobile/documents', { method: 'GET' }, token)
}

export type PresignResponse = { key: string; uploadUrl: string }

export function presignUpload(
  token: string,
  fileName: string,
  mimeType: string,
  fileSize?: number,
): Promise<PresignResponse> {
  return request<PresignResponse>('/api/mobile/upload/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName, mimeType, ...(fileSize ? { fileSize } : {}) }),
  }, token)
}

export function createDocument(
  token: string,
  caseId: string,
  fileKey: string,
  fileName: string,
  mimeType: string,
): Promise<Document> {
  return request<Document>('/api/mobile/documents', {
    method: 'POST',
    body: JSON.stringify({ caseId, fileKey, fileName, mimeType }),
  }, token)
}

export function triggerAnalysis(token: string, documentId: string): Promise<unknown> {
  return request<unknown>(`/api/mobile/documents/${documentId}/analyse`, { method: 'POST' }, token)
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

export function updateProfile(token: string, name: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/mobile/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }, token)
}
