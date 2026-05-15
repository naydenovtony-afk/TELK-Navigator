import React from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native'

export interface BenefitItem {
  id: string
  label: string
  detail: string
  category: string
  sourceUrl?: string
}

interface BenefitCardProps {
  benefit: BenefitItem
}

export function BenefitCard({ benefit }: BenefitCardProps): React.JSX.Element {
  return (
    <View style={s.card}>
      <Text style={s.label}>{benefit.label}</Text>
      <Text style={s.detail}>{benefit.detail}</Text>
      {benefit.sourceUrl && (
        <TouchableOpacity onPress={() => Linking.openURL(benefit.sourceUrl!)} hitSlop={8}>
          <Text style={s.link}>→ Виж</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 4,
    borderLeftWidth: 4, borderLeftColor: '#6B3D1A',
  },
  label: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  detail: { fontSize: 13, color: '#3D5A73', lineHeight: 18 },
  link: { fontSize: 12, color: '#6B3D1A', fontWeight: '600', marginTop: 4 },
})
