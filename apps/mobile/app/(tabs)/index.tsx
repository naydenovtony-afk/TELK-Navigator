import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { getCases, getDeadlines, getDocuments } from '../../lib/api'
import AppHeader from '../../components/AppHeader'

type Feature = {
  emoji: string
  title: string
  subtitle: string
  route: string
  color: string
}

const FEATURES: Feature[] = [
  { emoji: '📁', title: 'Случаи',     subtitle: 'Моите ТЕЛК случаи',    route: '/(tabs)/cases',     color: '#1A4A6B' },
  { emoji: '📅', title: 'Срокове',    subtitle: 'Важни дати и срокове',  route: '/(tabs)/deadlines', color: '#1A6B3C' },
  { emoji: '📄', title: 'Документи',  subtitle: 'Медицински документи',  route: '/(tabs)/documents', color: '#5A3D6B' },
  { emoji: '⚖️', title: 'Права',      subtitle: 'Социални права',        route: '/(tabs)/rights',    color: '#6B3D1A' },
  { emoji: '✉️', title: 'Писмо',      subtitle: 'До работодател',        route: '/employer-letter',  color: '#1A5A6B' },
  { emoji: '🏥', title: 'Пожизнено',  subtitle: 'Проверка за помощ',     route: '/lifelong',         color: '#1A6B4A' },
  { emoji: '📊', title: 'Прогноза',   subtitle: 'Прогноза за оценка',    route: '/score',            color: '#6B5A1A' },
  { emoji: '🏛️', title: 'Обжалване', subtitle: 'Стъпки за обжалване',   route: '/appeal',           color: '#6B1A1A' },
]

type LiveStats = {
  cases?: string
  deadlines?: string
  deadlinesUrgent?: boolean
  documents?: string
}

function buildCaseStat(cases: Awaited<ReturnType<typeof getCases>>): string {
  if (cases.length === 0) return 'Нямате случаи'
  const active = cases.filter((c) => c.status === 'active').length
  return active > 0
    ? `${cases.length} случая · ${active} активни`
    : `${cases.length} случая`
}

function buildDeadlineStat(deadlines: Awaited<ReturnType<typeof getDeadlines>>): { text: string; urgent: boolean } {
  const pending = deadlines.filter((d) => !d.isCompleted)
  if (pending.length === 0) return { text: 'Всички изпълнени ✓', urgent: false }
  const now = Date.now()
  const overdue = pending.filter((d) => new Date(d.dueAt).getTime() < now)
  const soon = pending.filter((d) => {
    const diff = new Date(d.dueAt).getTime() - now
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
  })
  if (overdue.length > 0) return { text: `⚠️ ${overdue.length} просрочени`, urgent: true }
  if (soon.length > 0) return { text: `${pending.length} срока · ${soon.length} скоро`, urgent: true }
  return { text: `${pending.length} предстоящи`, urgent: false }
}

function buildDocumentStat(docs: Awaited<ReturnType<typeof getDocuments>>): string {
  if (docs.length === 0) return 'Нямате документи'
  const ready = docs.filter((d) => d.status === 'ready').length
  const processing = docs.filter((d) => d.status === 'processing').length
  if (processing > 0) return `${docs.length} документа · обработват се`
  return `${docs.length} документа · ${ready} готови`
}

export default function DashboardScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<LiveStats>({})

  useEffect(() => {
    if (!token) return
    Promise.allSettled([
      getCases(token),
      getDeadlines(token),
      getDocuments(token),
    ]).then(([casesRes, deadlinesRes, docsRes]) => {
      const next: LiveStats = {}
      if (casesRes.status === 'fulfilled') next.cases = buildCaseStat(casesRes.value)
      if (deadlinesRes.status === 'fulfilled') {
        const { text, urgent } = buildDeadlineStat(deadlinesRes.value)
        next.deadlines = text
        next.deadlinesUrgent = urgent
      }
      if (docsRes.status === 'fulfilled') next.documents = buildDocumentStat(docsRes.value)
      setStats(next)
    })
  }, [token])

  function subtitleFor(f: Feature): string {
    if (f.route === '/(tabs)/cases' && stats.cases) return stats.cases
    if (f.route === '/(tabs)/deadlines' && stats.deadlines) return stats.deadlines
    if (f.route === '/(tabs)/documents' && stats.documents) return stats.documents
    return f.subtitle
  }

  function subtitleColorFor(f: Feature): string {
    if (f.route === '/(tabs)/deadlines' && stats.deadlinesUrgent) return '#8B4200'
    return '#7A95A8'
  }

  return (
    <View style={s.container}>
      <AppHeader subtitle="Изберете функция" />

      <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.route}
            style={[s.card, { borderTopColor: f.color }]}
            onPress={() => router.push(f.route as never)}
            activeOpacity={0.75}
          >
            <Text style={s.cardEmoji}>{f.emoji}</Text>
            <Text style={[s.cardTitle, { color: f.color }]}>{f.title}</Text>
            <Text style={[s.cardSub, { color: subtitleColorFor(f) }]}>
              {subtitleFor(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },

  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    paddingTop: 16,
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 4,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardEmoji: { fontSize: 44 },
  cardTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  cardSub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
})
