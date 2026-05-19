import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Platform, UIManager, LayoutAnimation,
} from 'react-native'
import type { Case } from '../lib/api'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

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
const STATUS_OPTIONS: { value: Case['status']; label: string; icon: string }[] = [
  { value: 'active',    label: 'Активен',   icon: '🟢' },
  { value: 'submitted', label: 'Подаден',   icon: '🟡' },
  { value: 'closed',    label: 'Затворен',  icon: '⚫' },
]

const CASE_TYPE_LABEL: Record<string, string> = {
  initial:       'Първично',
  reexamination: 'Преосвидетелстване',
  appeal:        'Обжалване',
}
const CASE_TYPE_ICON: Record<string, string> = {
  initial:       '🆕',
  reexamination: '🔄',
  appeal:        '⚖️',
}

interface CaseCardProps {
  item: Case
  onDelete: (c: Case) => void
  onStatusChange: (c: Case, newStatus: Case['status']) => void
  onEdit: (c: Case) => void
}

export function CaseCard({ item, onDelete, onStatusChange, onEdit }: CaseCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)

  function toggleExpand(): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((v) => !v)
  }

  return (
    <>
      <View style={s.card}>
        {/* Top row: title + delete */}
        <TouchableOpacity style={s.cardTop} onPress={toggleExpand} activeOpacity={0.8}>
          <View style={s.titleRow}>
            {item.caseType ? (
              <Text style={s.caseTypeIcon}>{CASE_TYPE_ICON[item.caseType]}</Text>
            ) : null}
            <Text style={s.caseTitle} numberOfLines={expanded ? undefined : 2}>{item.title}</Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(item)} hitSlop={12} style={s.deleteBtn}>
            <Text style={s.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Bottom row: date + status pill */}
        <View style={s.cardBottom}>
          <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('bg-BG')}</Text>
          <TouchableOpacity
            style={[s.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '18' }]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <View style={[s.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
            <Text style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status]}
            </Text>
            <Text style={[s.statusArrow, { color: STATUS_COLOR[item.status] }]}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded details */}
        {expanded && (
          <View style={s.details}>
            <View style={s.detailDivider} />

            {item.caseType && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Вид</Text>
                <Text style={s.detailValue}>{CASE_TYPE_LABEL[item.caseType]}</Text>
              </View>
            )}
            {item.diagnoses ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Диагнози</Text>
                <Text style={[s.detailValue, s.detailWrap]}>{item.diagnoses}</Text>
              </View>
            ) : null}
            {item.previousPercent !== null && item.previousPercent !== undefined ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Предишен %</Text>
                <Text style={s.detailValue}>{item.previousPercent}%</Text>
              </View>
            ) : null}
            {item.appealReason ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Основание за обжалване</Text>
                <Text style={[s.detailValue, s.detailWrap]}>{item.appealReason}</Text>
              </View>
            ) : null}
            {item.commissionDecision ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Решение на комисията</Text>
                <Text style={[s.detailValue, s.detailWrap]}>{item.commissionDecision}</Text>
              </View>
            ) : null}

            {!item.diagnoses && !item.appealReason && !item.commissionDecision && !item.caseType && (
              <Text style={s.noDetails}>Няма добавено описание</Text>
            )}

            <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)} activeOpacity={0.8}>
              <Text style={s.editBtnText}>✏️  Редактирай</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Status picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        />
        <View style={s.pickerSheet}>
          <View style={s.pickerHandle} />
          <Text style={s.pickerTitle}>Промяна на статус</Text>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                s.pickerOption,
                item.status === opt.value && s.pickerOptionSelected,
              ]}
              onPress={() => {
                setPickerVisible(false)
                if (opt.value !== item.status) onStatusChange(item, opt.value)
              }}
              activeOpacity={0.75}
            >
              <Text style={s.pickerOptionIcon}>{opt.icon}</Text>
              <Text style={[
                s.pickerOptionText,
                item.status === opt.value && { color: STATUS_COLOR[opt.value], fontWeight: '700' },
              ]}>
                {opt.label}
              </Text>
              {item.status === opt.value && (
                <Text style={[s.pickerCheck, { color: STATUS_COLOR[opt.value] }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.pickerCancel} onPress={() => setPickerVisible(false)}>
            <Text style={s.pickerCancelText}>Отказ</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, padding: 16, paddingBottom: 8,
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  caseTypeIcon: { fontSize: 16, marginTop: 1 },
  caseTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1C2B3A', lineHeight: 22 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 15, color: '#B8CDD8', fontWeight: '600' },

  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14,
  },
  date: { fontSize: 13, color: '#7A95A8' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusArrow: { fontSize: 11 },

  details: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  detailDivider: { height: 0.5, backgroundColor: '#B8CDD8', marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detailLabel: { fontSize: 12, color: '#7A95A8', fontWeight: '600', flexShrink: 0 },
  detailValue: { fontSize: 13, color: '#1C2B3A', textAlign: 'right', flex: 1 },
  detailWrap: { textAlign: 'left', flex: 1 },
  noDetails: { fontSize: 13, color: '#9AB0BF', fontStyle: 'italic', textAlign: 'center', paddingVertical: 4 },
  editBtn: {
    marginTop: 4, backgroundColor: '#E8F4F8', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  editBtnText: { fontSize: 14, color: '#1A4A6B', fontWeight: '600' },

  // Status picker modal
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  pickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 6,
  },
  pickerHandle: {
    width: 40, height: 4, backgroundColor: '#C8D8E4',
    borderRadius: 2, alignSelf: 'center', marginBottom: 8,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1C2B3A', marginBottom: 8 },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8F4F8',
    backgroundColor: '#F8FBFC',
  },
  pickerOptionSelected: { borderColor: '#1A4A6B', backgroundColor: '#E8F4F8' },
  pickerOptionIcon: { fontSize: 20 },
  pickerOptionText: { flex: 1, fontSize: 16, color: '#1C2B3A' },
  pickerCheck: { fontSize: 18, fontWeight: '700' },
  pickerCancel: { marginTop: 6, alignItems: 'center', paddingVertical: 12 },
  pickerCancelText: { fontSize: 15, color: '#3D5A73' },
})
