export type CaseStatus = 'active' | 'submitted' | 'closed'

export interface Case {
  id: string
  userId: string
  title: string
  status: CaseStatus
  countryCode: string
  createdAt: string
}
