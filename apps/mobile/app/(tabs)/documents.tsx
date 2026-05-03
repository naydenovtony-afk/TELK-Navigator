import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, SectionList,
} from 'react-native'
import { useAuth } from '../../lib/auth'
import { getDocuments, type Document } from '../../lib/api'

const STATUS_LABEL: Record<Document['status'], string> = {
  uploading: 'Качва се',
  processing: 'Обработва се',
  ready: 'Готов',
  error: 'Грешка',
}
const STATUS_COLOR: Record<Document['status'], string> = {
  uploading: '#7A5200',
  processing: '#1A4A6B',
  ready: '#1A6B3C',
  error: '#8B1A1A',
}

type Section = { title: string; data: Document[] }

export default function DocumentsScreen(): React.JSX.Element {
  const { token } = useAuth()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const docs = await getDocuments(token)
      const map = new Map<string, Section>()
      for (const doc of docs) {
        if (!map.has(doc.caseId)) map.set(doc.caseId, { title: doc.caseTitle, data: [] })
        map.get(doc.caseId)!.data.push(doc)
      }
      setSections(Array.from(map.values()))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#1A4A6B" /></View>
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Документи</Text>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#1A4A6B" />
          }
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Няма качени документи.{'\n'}Добавете документи от уеб приложението.</Text>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.date}>
                {new Date(item.uploadedAt).toLocaleDateString('bg-BG')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  list: { paddingBottom: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 32 },
  emptyText: { color: '#3D5A73', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  sectionHeader: { backgroundColor: '#E8F4F8', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#3D5A73', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 8, padding: 14, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fileName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C2B3A' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 12, color: '#3D5A73' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
