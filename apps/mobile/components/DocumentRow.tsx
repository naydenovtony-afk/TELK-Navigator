import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Document, DocumentType } from '../lib/api'

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

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  telk_decision:     'ТЕЛК решение',
  epicrisis:         'Епикриза',
  outpatient_sheet:  'Амбулаторен лист',
  lab_results:       'Лабораторни изследвания',
  imaging:           'Образна диагностика',
  specialist_opinion:'Специалистко мнение',
  other:             'Друг документ',
}
const DOC_TYPE_ICON: Record<DocumentType, string> = {
  telk_decision:     '📋',
  epicrisis:         '🏥',
  outpatient_sheet:  '📄',
  lab_results:       '🔬',
  imaging:           '🖼️',
  specialist_opinion:'👨‍⚕️',
  other:             '📎',
}

interface DocumentRowProps {
  item: Document
  onPress: () => void
  onDelete?: (doc: Document) => void
}

export function DocumentRow({ item, onPress, onDelete }: DocumentRowProps): React.JSX.Element {
  const typeLabel = item.documentType ? DOC_TYPE_LABEL[item.documentType] : null
  const typeIcon  = item.documentType ? DOC_TYPE_ICON[item.documentType] : '📄'
  const isReady   = item.status === 'ready'

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.75} onPress={onPress}>
      <View style={s.row}>
        <Text style={s.docIcon}>{typeIcon}</Text>
        <View style={s.info}>
          <Text style={s.fileName} numberOfLines={1}>{item.fileName}</Text>
          {typeLabel && <Text style={s.docType}>{typeLabel}</Text>}
          <Text style={s.date}>{new Date(item.uploadedAt).toLocaleDateString('bg-BG')}</Text>
        </View>
        <View style={s.right}>
          <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
          {isReady && <Text style={s.viewHint}>Виж →</Text>}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(item)} hitSlop={12} style={s.deleteBtn}>
            <Text style={s.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, padding: 14, borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { fontSize: 26 },
  info: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1C2B3A' },
  docType:  { fontSize: 12, color: '#1A4A6B', fontWeight: '500' },
  date:     { fontSize: 11, color: '#7A95A8' },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  viewHint: { fontSize: 11, color: '#1A4A6B', fontWeight: '600' },
  deleteBtn: { padding: 4, marginLeft: 4 },
  deleteBtnText: { fontSize: 15, color: '#B8CDD8', fontWeight: '600' },
})
