export interface CheckItem {
  item: string
  reason: string
  recommendation: string
}

export type Severity = 'critical' | 'high' | 'medium'

export interface MissingItem {
  item: string
  severity: Severity
  recommendation: string
}

export interface ScorePrediction {
  min: number
  max: number
  basis: string
}

export interface AnalysisReport {
  id: string
  documentId: string
  nmeModuleVersion: string
  documentsOnFile: number
  documentsTotal: number
  confidence: number
  covered: string[]
  incomplete: CheckItem[]
  missing: MissingItem[]
  patientSummary: string
  doctorSummary: string
  scorePrediction: ScorePrediction
  createdAt: string
}
