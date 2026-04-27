export type DiagnosisCategory =
  | 'respiratory'
  | 'cardiovascular'
  | 'neurological'
  | 'musculoskeletal'
  | 'endocrine'
  | 'psychiatric'
  | 'oncological'
  | 'renal'
  | 'other'

export interface NMEModule {
  id: string
  categoryCode: DiagnosisCategory
  name: string
  version: string
  content: string
  isActive: boolean
  nmeSource: string
  createdAt: string
}
