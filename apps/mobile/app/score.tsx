import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ── Diagnosis categories ───────────────────────────────────────────────────────

const DIAGNOSIS_CATEGORIES = [
  { key: 'cardiovascular',   label: '🫀 Сърдечно-съдови' },
  { key: 'neurological',     label: '🧠 Неврологични' },
  { key: 'musculoskeletal',  label: '🦴 Опорно-двигателни' },
  { key: 'respiratory',      label: '🫁 Дихателна система' },
  { key: 'psychiatric',      label: '🧩 Психични и поведенчески' },
  { key: 'oncological',      label: '🔬 Онкологични' },
  { key: 'endocrine',        label: '⚗️ Ендокринни (диабет и др.)' },
  { key: 'visual',           label: '👁️ Зрителни' },
  { key: 'hearing',          label: '👂 Слухови' },
  { key: 'renal',            label: '🫘 Бъбречни / Урологични' },
  { key: 'hematological',    label: '🧬 Хематологични' },
  { key: 'rheumatological',  label: '🔴 Ревматологични' },
  { key: 'gastrointestinal', label: '🧪 Гастроинтестинални' },
  { key: 'cognitive',        label: '💡 Когнитивни (деменция, аутизъм)' },
  { key: 'dermatological',   label: '🩹 Кожни заболявания' },
  { key: 'other',            label: '📋 Друго' },
] as const

type DiagnosisKey = typeof DIAGNOSIS_CATEGORIES[number]['key']

// ── Score ranges per diagnosis × doc-count band ───────────────────────────────
// Bands: 'low' = 1–2 docs, 'mid' = 3–5, 'high' = 6+

type Band = 'low' | 'mid' | 'high'

const RANGES: Record<DiagnosisKey, Record<Band, { min: number; max: number }>> = {
  cardiovascular:   { low: { min: 40, max: 60 }, mid: { min: 50, max: 71 }, high: { min: 60, max: 80 } },
  neurological:     { low: { min: 50, max: 70 }, mid: { min: 60, max: 80 }, high: { min: 71, max: 90 } },
  musculoskeletal:  { low: { min: 30, max: 50 }, mid: { min: 40, max: 65 }, high: { min: 50, max: 75 } },
  respiratory:      { low: { min: 35, max: 55 }, mid: { min: 45, max: 65 }, high: { min: 55, max: 75 } },
  psychiatric:      { low: { min: 40, max: 60 }, mid: { min: 50, max: 75 }, high: { min: 65, max: 85 } },
  oncological:      { low: { min: 50, max: 71 }, mid: { min: 60, max: 80 }, high: { min: 71, max: 95 } },
  endocrine:        { low: { min: 30, max: 50 }, mid: { min: 40, max: 60 }, high: { min: 50, max: 70 } },
  visual:           { low: { min: 35, max: 55 }, mid: { min: 45, max: 65 }, high: { min: 55, max: 80 } },
  hearing:          { low: { min: 30, max: 50 }, mid: { min: 40, max: 60 }, high: { min: 50, max: 71 } },
  renal:            { low: { min: 35, max: 55 }, mid: { min: 45, max: 65 }, high: { min: 55, max: 75 } },
  hematological:    { low: { min: 40, max: 60 }, mid: { min: 50, max: 70 }, high: { min: 60, max: 80 } },
  rheumatological:  { low: { min: 30, max: 50 }, mid: { min: 40, max: 65 }, high: { min: 50, max: 75 } },
  gastrointestinal: { low: { min: 25, max: 45 }, mid: { min: 35, max: 60 }, high: { min: 45, max: 70 } },
  cognitive:        { low: { min: 50, max: 71 }, mid: { min: 60, max: 80 }, high: { min: 71, max: 90 } },
  dermatological:   { low: { min: 20, max: 40 }, mid: { min: 30, max: 55 }, high: { min: 40, max: 65 } },
  other:            { low: { min: 25, max: 50 }, mid: { min: 35, max: 60 }, high: { min: 45, max: 70 } },
}

// ── Document types ─────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { key: 'epicrisis',       label: 'Епикриза',                      icon: '🏥' },
  { key: 'outpatient',      label: 'Амбулаторен лист',              icon: '📄' },
  { key: 'lab',             label: 'Лабораторни изследвания',        icon: '🔬' },
  { key: 'imaging',         label: 'Образна диагностика (МРТ, рентген)', icon: '🖼️' },
  { key: 'specialist',      label: 'Специалистко мнение',            icon: '👨‍⚕️' },
  { key: 'previous_telk',   label: 'Предишно ТЕЛК решение',          icon: '📑' },
] as const

type DocKey = typeof DOC_TYPES[number]['key']

type DocCounts = Record<DocKey, number>

const ZERO_COUNTS: DocCounts = {
  epicrisis: 0, outpatient: 0, lab: 0,
  imaging: 0, specialist: 0, previous_telk: 0,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function totalDocs(counts: DocCounts): number {
  return Object.values(counts).reduce((s, n) => s + n, 0)
}

function toBand(total: number): Band | null {
  if (total === 0) return null
  if (total <= 2) return 'low'
  if (total <= 5) return 'mid'
  return 'high'
}

function computeRange(
  selected: DiagnosisKey[],
  band: Band,
): { min: number; max: number } {
  // Take the widest combined range across all selected diagnoses
  let min = 100
  let max = 0
  for (const key of selected) {
    const r = RANGES[key][band]
    if (r.min < min) min = r.min
    if (r.max > max) max = r.max
  }
  // Multiple diagnoses → bump the upper end slightly
  if (selected.length > 1) max = Math.min(100, max + (selected.length - 1) * 3)
  return { min, max }
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ScoreScreen(): React.JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [selected, setSelected] = useState<DiagnosisKey[]>([])
  const [otherText, setOtherText] = useState('')
  const [docCounts, setDocCounts] = useState<DocCounts>({ ...ZERO_COUNTS })

  function toggleDiagnosis(key: DiagnosisKey): void {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function changeDocCount(key: DocKey, delta: number): void {
    setDocCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(9, (prev[key] ?? 0) + delta)),
    }))
  }

  const total = totalDocs(docCounts)
  const band = toBand(total)
  const effectiveDiagnoses = selected.filter((k) => k !== 'other' || otherText.trim())
  const canCompute = effectiveDiagnoses.length > 0 && band !== null
  const range = canCompute ? computeRange(effectiveDiagnoses, band!) : null

  return (
    <View style={{ flex: 1, backgroundColor: '#E8F4F8' }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Прогноза за оценка</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ℹ️  Приблизителна прогноза. Точната оценка се определя от ТЕЛК комисия след преглед на цялостната медицинска история.
          </Text>
        </View>

        {/* ── Section 1: Diagnoses ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Диагнози / заболявания</Text>
          <Text style={styles.sectionSub}>Изберете всички приложими категории</Text>
          <View style={styles.chipGrid}>
            {DIAGNOSIS_CATEGORIES.map((cat) => {
              const isSelected = selected.includes(cat.key)
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleDiagnosis(cat.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Free-text for "other" */}
          {selected.includes('other') && (
            <TextInput
              style={styles.otherInput}
              placeholder="Опишете заболяването / категорията…"
              placeholderTextColor="#9AB0BF"
              value={otherText}
              onChangeText={setOtherText}
              maxLength={200}
            />
          )}

          {selected.length > 0 && (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryText}>
                Избрани: {selected.length} {selected.length === 1 ? 'категория' : 'категории'}
              </Text>
              <TouchableOpacity onPress={() => { setSelected([]); setOtherText('') }} hitSlop={8}>
                <Text style={styles.clearText}>Изчисти</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Section 2: Documents ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Медицински документи</Text>
          <Text style={styles.sectionSub}>Колко документа имате от всеки вид?</Text>
          <View style={styles.docList}>
            {DOC_TYPES.map((dt) => (
              <View key={dt.key} style={styles.docRow}>
                <Text style={styles.docIcon}>{dt.icon}</Text>
                <Text style={styles.docLabel}>{dt.label}</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[styles.counterBtn, docCounts[dt.key] === 0 && styles.counterBtnDisabled]}
                    onPress={() => changeDocCount(dt.key, -1)}
                    disabled={docCounts[dt.key] === 0}
                    hitSlop={8}
                  >
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{docCounts[dt.key]}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => changeDocCount(dt.key, +1)}
                    hitSlop={8}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          {total > 0 && (
            <Text style={styles.totalDocs}>Общо документи: {total}</Text>
          )}
        </View>

        {/* ── Result ── */}
        {range && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Прогнозиран диапазон</Text>
            <Text style={styles.resultRange}>{range.min}% – {range.max}%</Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { left: `${range.min}%` as `${number}%`, right: `${100 - range.max}%` as `${number}%` },
                ]}
              />
            </View>
            <View style={styles.resultMeta}>
              <Text style={styles.resultMetaText}>
                {effectiveDiagnoses.length} {effectiveDiagnoses.length === 1 ? 'диагноза' : 'диагнози'}
                {' · '}{total} {total === 1 ? 'документ' : 'документа'}
              </Text>
            </View>
            <Text style={styles.resultNote}>
              Основано на сравними случаи. При множество заболявания ТЕЛК взема предвид водещото ограничение. Прогнозата е ориентировъчна.
            </Text>
          </View>
        )}

        {!canCompute && (selected.length > 0 || total > 0) && (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              {selected.length === 0
                ? '← Изберете поне една диагнозна категория'
                : '← Добавете поне един медицински документ'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1A4A6B', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  disclaimer: {
    backgroundColor: '#fff', borderRadius: 10, padding: 13,
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  disclaimerText: { fontSize: 13, color: '#3D5A73', lineHeight: 19 },

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C2B3A' },
  sectionSub:   { fontSize: 13, color: '#3D5A73', marginTop: -6 },

  // Diagnosis chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#B8CDD8', backgroundColor: '#F8FBFC',
  },
  chipSelected: { backgroundColor: '#1A4A6B', borderColor: '#1A4A6B' },
  chipText: { fontSize: 13, color: '#3D5A73', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },

  otherInput: {
    borderWidth: 1.5, borderColor: '#1A4A6B', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1C2B3A', backgroundColor: '#F8FBFC',
  },
  selectedSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 4,
  },
  selectedSummaryText: { fontSize: 13, color: '#1A4A6B', fontWeight: '600' },
  clearText: { fontSize: 13, color: '#8B1A1A', fontWeight: '600' },

  // Document counters
  docList: { gap: 2 },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#EEF3F6',
  },
  docIcon:  { fontSize: 22, width: 28 },
  docLabel: { flex: 1, fontSize: 13, color: '#1C2B3A', fontWeight: '500' },
  counter:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A4A6B',
    justifyContent: 'center', alignItems: 'center',
  },
  counterBtnDisabled: { backgroundColor: '#D0DDE4' },
  counterBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1C2B3A', minWidth: 20, textAlign: 'center' },
  totalDocs: { fontSize: 13, color: '#1A4A6B', fontWeight: '600', textAlign: 'right' },

  // Result
  resultCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    borderWidth: 1.5, borderColor: '#1A4A6B', gap: 12, alignItems: 'center',
    elevation: 2, shadowColor: '#1A4A6B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  resultLabel: { fontSize: 13, color: '#3D5A73', fontWeight: '500' },
  resultRange: { fontSize: 40, fontWeight: '800', color: '#1A4A6B' },
  bar: {
    width: '100%', height: 10, backgroundColor: '#E8F4F8',
    borderRadius: 5, overflow: 'hidden', position: 'relative',
  },
  barFill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#1A4A6B', borderRadius: 5 },
  resultMeta: {
    backgroundColor: '#E8F4F8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5,
  },
  resultMetaText: { fontSize: 12, color: '#1A4A6B', fontWeight: '600' },
  resultNote: { fontSize: 12, color: '#7A95A8', textAlign: 'center', lineHeight: 18 },

  hintCard: {
    backgroundColor: '#FFF8E8', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#F0C040',
  },
  hintText: { fontSize: 14, color: '#7A5200', textAlign: 'center' },
})
