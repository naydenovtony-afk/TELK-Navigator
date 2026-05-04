import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getDeadlines, type Deadline } from '../../lib/api'

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function urgencyColor(days: number): string {
  if (days < 0) return '#8B1A1A'
  if (days <= 7) return '#7A5200'
  return '#1A6B3C'
}

export default function DeadlinesScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const data = await getDeadlines(token)
      setDeadlines(data)
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
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1A4A6B" />
      </View>
    )
  }

  const pending = deadlines.filter((d) => !d.isCompleted)
  const completed = deadlines.filter((d) => d.isCompleted)

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Срокове</Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={[...pending, ...completed]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
          contentContainerStyle={deadlines.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Все още няма срокове</Text>
              <Text style={styles.emptyBody}>
                Срокове ви напомнят за важни дати — подаване на документи, насрочени прегледи и крайни дати за обжалване. Добавете ги от уеб приложението.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => Linking.openURL('https://telk-navigator-web.vercel.app')}
                activeOpacity={0.75}
              >
                <Text style={styles.emptyBtnText}>Отвори уеб приложението</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const days = daysUntil(item.dueAt)
            const color = item.isCompleted ? '#3D5A73' : urgencyColor(days)
            const daysLabel = item.isCompleted
              ? 'Изпълнен'
              : days < 0
              ? `Просрочен с ${Math.abs(days)} дни`
              : days === 0
              ? 'Днес'
              : `${days} дни`

            return (
              <View style={[styles.card, item.isCompleted && styles.cardDone]}>
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.label, item.isCompleted && styles.labelDone]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={[styles.days, { color }]}>{daysLabel}</Text>
                <Text style={styles.date}>
                  {new Date(item.dueAt).toLocaleDateString('bg-BG')}
                </Text>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, gap: 4 },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1C2B3A', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#3D5A73', textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 4, backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%',
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 4,
  },
  cardDone: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 15, fontWeight: '500', color: '#1C2B3A', flex: 1 },
  labelDone: { textDecorationLine: 'line-through', color: '#3D5A73' },
  days: { fontSize: 13, fontWeight: '500' },
  date: { fontSize: 12, color: '#3D5A73' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
