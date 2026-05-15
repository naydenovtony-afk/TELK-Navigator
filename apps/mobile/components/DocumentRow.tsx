import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Document } from '../lib/api'

const STATUS_LABEL: Record<Document['status'], string> = {
  uploading:  'Качва се',
  processing: 'Анализира се',
  ready:      'Готов',
  error:      'Грешка',
}
const STATUS_COLOR: Record<Document['status'], string> = {
  uploading:  '#7A5200',
  processing: '#1A4A6B',
  ready:      '#1A6B3C',
  error:      '#8B1A1A',
}

interface DocumentRowProps {
  item: Document
  onPress: () => void
}

export function DocumentRow({ item, onPress }: DocumentRowProps): React.JSX.Element {
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.75} onPress={onPress}>
      <View style={s.row}>
        <Text style={s.fileName} numberOfLines={1}>{item.fileName}</Text>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status]}
          </Text>
        </View>
      </View>
      <Text style={s.date}>{new Date(item.uploadedAt).toLocaleDateString('bg-BG')}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 8, padding: 14, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fileName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C2B3A' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 12, color: '#3D5A73' },
})
