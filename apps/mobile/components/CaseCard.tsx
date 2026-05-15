import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Case } from '../lib/api'

const STATUS_LABEL: Record<Case['status'], string> = {
  active:    'Активен',
  submitted: 'Подаден',
  closed:    'Затворен',
}
const STATUS_COLOR: Record<Case['status'], string> = {
  active:    '#1A6B3C',
  submitted: '#7A5200',
  closed:    '#3D5A73',
}

interface CaseCardProps {
  item: Case
  onDelete: (c: Case) => void
  onCycleStatus: (c: Case) => void
}

export function CaseCard({ item, onDelete, onCycleStatus }: CaseCardProps): React.JSX.Element {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.caseTitle} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity onPress={() => onDelete(item)} hitSlop={10}>
          <Text style={s.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('bg-BG')}</Text>
        <TouchableOpacity
          style={[s.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '18' }]}
          onPress={() => onCycleStatus(item)}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <View style={[s.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
          <Text style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status]}
          </Text>
          <Text style={[s.statusArrow, { color: STATUS_COLOR[item.status] }]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  caseTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1C2B3A', lineHeight: 22 },
  deleteBtn: { fontSize: 15, color: '#B8CDD8', fontWeight: '600', paddingTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 13, color: '#7A95A8' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusArrow: { fontSize: 13, fontWeight: '700' },
})
