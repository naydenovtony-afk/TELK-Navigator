import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface EmptyStateProps {
  icon: string
  title: string
  body: string
  buttonLabel: string
  onPress: () => void
}

export function EmptyState({ icon, title, body, buttonLabel, onPress }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={s.card}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.75}>
        <Text style={s.btnText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  icon: { fontSize: 52 },
  title: { fontSize: 18, fontWeight: '800', color: '#1C2B3A', textAlign: 'center' },
  body: { fontSize: 15, color: '#3D5A73', textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 4, backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
