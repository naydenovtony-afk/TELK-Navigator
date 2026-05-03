import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

type Feature = {
  emoji: string
  title: string
  subtitle: string
  route: string
  color: string
}

const FEATURES: Feature[] = [
  { emoji: '📁', title: 'Случаи',        subtitle: 'Моите ТЕЛК случаи',        route: '/(tabs)/cases',     color: '#1A4A6B' },
  { emoji: '📅', title: 'Срокове',       subtitle: 'Важни дати и срокове',      route: '/(tabs)/deadlines', color: '#1A6B3C' },
  { emoji: '📄', title: 'Документи',     subtitle: 'Медицински документи',      route: '/(tabs)/documents', color: '#5A3D6B' },
  { emoji: '⚖️', title: 'Права',         subtitle: 'Социални права',            route: '/(tabs)/rights',    color: '#6B3D1A' },
  { emoji: '✉️', title: 'Писмо',         subtitle: 'До работодател',            route: '/employer-letter',  color: '#1A5A6B' },
  { emoji: '🏥', title: 'Пожизнено',     subtitle: 'Проверка за помощ',         route: '/lifelong',         color: '#1A6B4A' },
  { emoji: '📊', title: 'Прогноза',      subtitle: 'Прогноза за оценка',        route: '/score',            color: '#6B5A1A' },
  { emoji: '🏛️', title: 'Обжалване',    subtitle: 'Стъпки за обжалване',       route: '/appeal',           color: '#6B1A1A' },
]

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter()

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.appName}>ТЕЛК Навигатор</Text>
        <Text style={s.welcome}>Изберете функция</Text>
      </View>

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
            <Text style={s.cardSub}>{f.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },

  header: {
    backgroundColor: '#1A4A6B',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  appName: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  welcome: { color: '#B8D8E8', fontSize: 15, marginTop: 4 },

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
  cardSub: { fontSize: 12, color: '#7A95A8', textAlign: 'center', lineHeight: 17 },
})
