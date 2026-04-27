import type { DiagnosisCategory } from '../types/nme.types'

export const NME_CATEGORIES: Record<DiagnosisCategory, string> = {
  respiratory: 'J40-J99',
  cardiovascular: 'I00-I99',
  neurological: 'G00-G99',
  musculoskeletal: 'M00-M99',
  endocrine: 'E00-E99',
  psychiatric: 'F00-F99',
  oncological: 'C00-D49',
  renal: 'N00-N99',
  other: 'Z00-Z99',
}

export const NME_CATEGORY_LABELS: Record<DiagnosisCategory, string> = {
  respiratory: 'Дихателна система',
  cardiovascular: 'Сърдечно-съдова система',
  neurological: 'Нервна система',
  musculoskeletal: 'Опорно-двигателен апарат',
  endocrine: 'Ендокринна система',
  psychiatric: 'Психични разстройства',
  oncological: 'Онкологични заболявания',
  renal: 'Отделителна система',
  other: 'Други',
}
