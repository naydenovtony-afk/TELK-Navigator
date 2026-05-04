import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../lib/auth'
import { getDocumentAnalysis, type AnalysisReport } from '../lib/api'

export default function DocumentDetailScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()

  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !id) return
    getDocumentAnalysis(token, id)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : 'Грешка'))
      .finally(() => setLoading(false))
  }, [token, id])

  const pct = report
    ? Math.round((report.documentsOnFile / Math.max(report.documentsTotal, 1)) * 100)
    : 0

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Документи</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{name ?? 'Документ'}</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>
      ) : error ? (
        <Text style={s.errorText}>{error}</Text>
      ) : !report ? (
        <View style={s.center}>
          <Text style={s.noAnalysisIcon}>🔍</Text>
          <Text style={s.noAnalysisTitle}>Анализът все още не е готов</Text>
          <Text style={s.noAnalysisBody}>
            AI обработката може да отнеме 1–2 минути. Върнете се малко по-късно.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary card */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Резюме за пациента</Text>
            <Text style={s.summaryText}>{report.patientSummary}</Text>
          </View>

          {/* Score bar */}
          <View style={s.scoreCard}>
            <View style={s.scoreRow}>
              <Text style={s.scoreTitle}>НМЕ покритие</Text>
              <Text style={s.scorePct}>{report.documentsOnFile}/{report.documentsTotal} елемента</Text>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: pct >= 70 ? '#1A6B3C' : pct >= 40 ? '#7A5200' : '#8B1A1A' }]} />
            </View>
            <Text style={s.scoreNote}>{pct}% от изискванията са документирани</Text>
          </View>

          {/* Covered */}
          {report.covered.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>✅ Намерено в документа</Text>
              {report.covered.map((item, i) => (
                <View key={i} style={[s.item, s.itemGreen]}>
                  <Text style={s.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Incomplete */}
          {report.incomplete.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>⚠️ Непълно</Text>
              {report.incomplete.map((item) => (
                <View key={item.id} style={[s.item, s.itemAmber]}>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  <Text style={s.itemNote}>{item.note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Missing */}
          {report.missing.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>❌ Липсващо</Text>
              {report.missing.map((item) => (
                <View key={item.id} style={[s.item, s.itemRed]}>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  <Text style={s.itemNote}>{item.reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Score prediction */}
          {(report.scorePrediction.min > 0 || report.scorePrediction.max > 0) && (
            <View style={s.predCard}>
              <Text style={s.predTitle}>Прогнозна оценка</Text>
              <Text style={s.predRange}>
                {report.scorePrediction.min}% – {report.scorePrediction.max}%
              </Text>
              {report.scorePrediction.note ? (
                <Text style={s.predNote}>{report.scorePrediction.note}</Text>
              ) : null}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },

  header: { backgroundColor: '#5A3D6B', paddingHorizontal: 16, paddingBottom: 16, gap: 4 },
  back: { color: '#D4B8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#5A3D6B', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryText: { fontSize: 15, color: '#1C2B3A', lineHeight: 22 },

  scoreCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreTitle: { fontSize: 14, fontWeight: '700', color: '#1C2B3A' },
  scorePct: { fontSize: 13, color: '#3D5A73' },
  barBg: { height: 10, backgroundColor: '#E8F4F8', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  scoreNote: { fontSize: 12, color: '#3D5A73' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C2B3A' },
  item: { borderRadius: 10, padding: 12, gap: 3 },
  itemGreen: { backgroundColor: '#E8F5EE', borderLeftWidth: 3, borderLeftColor: '#1A6B3C' },
  itemAmber: { backgroundColor: '#FFF8E8', borderLeftWidth: 3, borderLeftColor: '#7A5200' },
  itemRed: { backgroundColor: '#FFF0F0', borderLeftWidth: 3, borderLeftColor: '#8B1A1A' },
  itemText: { fontSize: 14, color: '#1C2B3A' },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#1C2B3A' },
  itemNote: { fontSize: 13, color: '#3D5A73', lineHeight: 18 },

  predCard: {
    backgroundColor: '#1A4A6B', borderRadius: 16, padding: 18, gap: 6,
    alignItems: 'center',
  },
  predTitle: { fontSize: 13, color: '#B8D8E8', fontWeight: '600' },
  predRange: { fontSize: 28, color: '#fff', fontWeight: '800' },
  predNote: { fontSize: 13, color: '#B8D8E8', textAlign: 'center', lineHeight: 18 },

  noAnalysisIcon: { fontSize: 52 },
  noAnalysisTitle: { fontSize: 18, fontWeight: '800', color: '#1C2B3A', textAlign: 'center' },
  noAnalysisBody: { fontSize: 15, color: '#3D5A73', textAlign: 'center', lineHeight: 22 },

  errorText: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
