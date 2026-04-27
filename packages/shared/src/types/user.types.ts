import type { DiagnosisCategory } from './nme.types'

export type UserRole = 'patient' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  birthDate: string | null
  isMinor: boolean
  isChildFree: boolean | null
  referralCode: string | null
  referredBy: string | null
  locale: string
  createdAt: string
}

export interface UserPreferences {
  id: string
  userId: string
  telkSituation: TelkSituation | null
  mainDiagnosisCategory: DiagnosisCategory | null
  hasEpicrisis: boolean | null
  telkExpiresAt: string | null
  dashboardLayout: Record<string, unknown> | null
  updatedAt: string | null
}

export type TelkSituation =
  | 'preparing'
  | 'hasDecision'
  | 'appealing'
  | 'helpingRelative'
