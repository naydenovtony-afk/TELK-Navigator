import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../lib/auth'
import { getDocuments, type Document } from '../lib/api'
import { DocumentRow } from '../components/DocumentRow'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  telk_decision:      'ТЕЛК решение',
  epicrisis:          'Епикриза',
  outpatient_sheet:   'Амбулаторен лист',
  lab_results:        'Лабораторни изследвания',
  imaging:            'Образна диагностика',
  specialist_opinion: 'Специалистично становище',
  other:              'Друго',
}

export default function CaseDetailScreen(): React.JSX.Element {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token || !id) return
    if (!silent) setLoading(true)
    try {
      const all = await getDocuments(token)
      setDocs(all.filter((d) => d.caseId === id))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token, id])

  const caseTitle = title ? decodeURIComponent(title) : '—'

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>← Случаи</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{caseTitle}</Text>
        <View style={s.headerSpacer} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
        >
          <Text style={s.sectionTitle}>
            Документи {docs.length > 0 ? `(${docs.length})` : ''}
          </Text>

          {docs.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📂</Text>
              <Text style={s.emptyTitle}>Няма документи</Text>
              <Text style={s.emptyBody}>
                Качете документи от таба „Документи" и ги свържете с този случай.
              </Text>
            </View>
          ) : (
            docs.map((doc) => (
              <View key={doc.id}>
                {doc.documentType && (
                  <Text style={s.docTypeLabel}>
                    {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </Text>
                )}
                <DocumentRow
                  item={doc}
                  onPress={() => router.push(
                    `/document-detail?id=${doc.id}&name=${encodeURIComponent(doc.fileName)}&fileUrl=${encodeURIComponent(doc.fileUrl ?? '')}&mimeType=${encodeURIComponent(doc.mimeType)}` as never
                  )}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#1A4A6B',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  back: { color: '#B8D8E8', fontSize: 16, fontWeight: '600', flexShrink: 0 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 40 },

  scroll: { padding: 16, gap: 8 },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#3D5A73',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 4,
  },

  docTypeLabel: {
    fontSize: 11, fontWeight: '600', color: '#7A95A8',
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginTop: 8, marginBottom: 2, marginLeft: 4,
  },

  emptyBox: {
    alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1C2B3A' },
  emptyBody: { fontSize: 14, color: '#3D5A73', textAlign: 'center', lineHeight: 20 },
})
