import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

const CATEGORIES = [
  { key: 'cardiovascular', label: '🫀 Сърдечно-съдови' },
  { key: 'neurological', label: '🧠 Неврологични' },
  { key: 'musculoskeletal', label: '🦴 Опорно-двигателни' },
  { key: 'respiratory', label: '🫁 Белодробни' },
  { key: 'psychiatric', label: '🧩 Психични' },
  { key: 'oncological', label: '🔬 Онкологични' },
  { key: 'endocrine', label: '⚗️ Ендокринни' },
  { key: 'other', label: '📋 Други' },
]

const DOC_OPTIONS = [
  { key: '1', label: '1–2 документа' },
  { key: '3', label: '3–5 документа' },
  { key: '6', label: '6+ документа' },
]

const RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  cardiovascular: { '1': { min: 40, max: 60 }, '3': { min: 50, max: 71 }, '6': { min: 60, max: 80 } },
  neurological: { '1': { min: 50, max: 70 }, '3': { min: 60, max: 80 }, '6': { min: 71, max: 90 } },
  musculoskeletal: { '1': { min: 30, max: 50 }, '3': { min: 40, max: 65 }, '6': { min: 50, max: 75 } },
  respiratory: { '1': { min: 35, max: 55 }, '3': { min: 45, max: 65 }, '6': { min: 55, max: 75 } },
  psychiatric: { '1': { min: 40, max: 60 }, '3': { min: 50, max: 75 }, '6': { min: 65, max: 85 } },
  oncological: { '1': { min: 50, max: 71 }, '3': { min: 60, max: 80 }, '6': { min: 71, max: 95 } },
  endocrine: { '1': { min: 30, max: 50 }, '3': { min: 40, max: 60 }, '6': { min: 50, max: 70 } },
  other: { '1': { min: 25, max: 50 }, '3': { min: 35, max: 60 }, '6': { min: 45, max: 70 } },
}

export default function ScoreScreen(): React.JSX.Element {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [docs, setDocs] = useState('')

  const range = category && docs ? RANGES[category]?.[docs] : null

  return (
    <View style={{ flex: 1, backgroundColor: '#E8F4F8' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Прогноза за оценка</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.disclaimer}>
          ℹ️  Приблизителна прогноза. Точната оценка се определя от ТЕЛК комисия.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основна диагнозна категория</Text>
          <View style={styles.options}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.option, category === c.key && styles.optionSelected]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={[styles.optionText, category === c.key && styles.optionTextSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Брой медицински документи</Text>
          <View style={styles.options}>
            {DOC_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.option, docs === d.key && styles.optionSelected]}
                onPress={() => setDocs(d.key)}
              >
                <Text style={[styles.optionText, docs === d.key && styles.optionTextSelected]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {range && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Прогнозиран диапазон</Text>
            <Text style={styles.resultRange}>{range.min}% – {range.max}%</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { left: `${range.min}%`, right: `${100 - range.max}%` }]} />
            </View>
            <Text style={styles.resultNote}>
              Основано на сравними случаи. Комисията взема предвид цялостната медицинска история.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  back: { color: '#B8CDD8', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  disclaimer: { fontSize: 13, color: '#3D5A73', backgroundColor: '#fff', padding: 12, borderRadius: 8, lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1, borderColor: '#B8CDD8', backgroundColor: '#fff',
  },
  optionSelected: { backgroundColor: '#1A4A6B', borderColor: '#1A4A6B' },
  optionText: { fontSize: 13, color: '#3D5A73' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#1A4A6B', gap: 10, alignItems: 'center',
  },
  resultLabel: { fontSize: 13, color: '#3D5A73', fontWeight: '500' },
  resultRange: { fontSize: 36, fontWeight: '700', color: '#1A4A6B' },
  bar: {
    width: '100%', height: 10, backgroundColor: '#E8F4F8',
    borderRadius: 5, overflow: 'hidden', position: 'relative',
  },
  barFill: {
    position: 'absolute', top: 0, bottom: 0,
    backgroundColor: '#1A4A6B', borderRadius: 5,
  },
  resultNote: { fontSize: 12, color: '#7A95A8', textAlign: 'center', lineHeight: 18 },
})
