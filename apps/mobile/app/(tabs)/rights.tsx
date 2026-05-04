import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTelkPercent, saveTelkPercent } from '../../lib/prefs'

type Benefit = { id: string; label: string; detail: string; category: string }

const ALL_BENEFITS: (Benefit & { minPercent: number })[] = [
  { id: 'B001', minPercent: 50, category: 'financial',   label: 'Месечна добавка за увреждане',       detail: 'Изплаща се от АСП. Размерът зависи от степента на увреждане.' },
  { id: 'B002', minPercent: 50, category: 'financial',   label: 'Данъчно облекчение (ЗДДФЛ)',          detail: 'Намаление на данъчната основа с 7 920 лв. годишно.' },
  { id: 'B003', minPercent: 50, category: 'financial',   label: 'Намаление на данък сгради',          detail: '50% намаление на данъка върху недвижимите имоти за основно жилище.' },
  { id: 'B004', minPercent: 50, category: 'transport',   label: 'Безплатен градски транспорт',         detail: 'Безплатно пътуване в обществения транспорт по местоживеене.' },
  { id: 'B005', minPercent: 50, category: 'healthcare',  label: 'Безплатни лекарства (по списък)',     detail: 'Медикаменти за хронични заболявания се заплащат от НЗОК.' },
  { id: 'B006', minPercent: 50, category: 'social',      label: 'Помощни средства и съоръжения',      detail: 'Финансиране на помощни технически средства чрез НЗОК и АСП.' },
  { id: 'B007', minPercent: 71, category: 'transport',   label: 'Карта за паркиране (Синя карта)',     detail: 'Паркиране на обозначени места за хора с увреждания.' },
  { id: 'B008', minPercent: 71, category: 'transport',   label: '50% намаление на ж.п. билети',        detail: 'Намаление при пътуване с БДЖ.' },
  { id: 'B009', minPercent: 71, category: 'transport',   label: 'Намаление при въздушен транспорт',   detail: 'Някои авиокомпании предоставят намаления.' },
  { id: 'B010', minPercent: 71, category: 'social',      label: 'Приоритет в социални услуги',        detail: 'Приоритетен достъп до дневни центрове и социален асистент.' },
  { id: 'B011', minPercent: 71, category: 'financial',   label: 'Целева помощ за отопление',          detail: 'Право на целева помощ при покриване на доходен критерий.' },
  { id: 'B012', minPercent: 91, category: 'social',      label: 'Личен асистент (до 4 ч/ден)',         detail: 'Финансирана от държавата услуга за подпомагане при ежедневни дейности.' },
  { id: 'B013', minPercent: 91, category: 'employment',  label: 'Допълнителен платен отпуск — 25 дни', detail: 'Минимум 25 дни платен годишен отпуск.' },
  { id: 'B014', minPercent: 91, category: 'financial',   label: 'Намаление на телефонна такса',       detail: 'Социална абонаментна такса при фиксирана телефонна линия.' },
  { id: 'B015', minPercent: 91, category: 'healthcare',  label: 'Освобождаване от потребителска такса', detail: 'Пълно освобождаване от такса при посещение на лекар.' },
]

const CATEGORIES = ['financial', 'transport', 'healthcare', 'employment', 'social'] as const

const CATEGORY_LABEL: Record<string, string> = {
  financial:  '💰 Финансови',
  transport:  '🚌 Транспорт',
  healthcare: '🏥 Здравеопазване',
  employment: '💼 Трудови права',
  social:     '🤝 Социални услуги',
}

function getTierLabel(p: number): string {
  if (p >= 91) return 'Тежко увреждане (91–100%)'
  if (p >= 71) return 'Значително увреждане (71–90%)'
  if (p >= 50) return 'Умерено увреждане (50–70%)'
  return 'Под минималния праг (50%)'
}

function getTierColor(p: number): string {
  if (p >= 91) return '#8B1A1A'
  if (p >= 71) return '#7A5200'
  return '#1A4A6B'
}

function getAllowance(p: number): number | null {
  if (p >= 91) return 225
  if (p >= 71) return 150
  if (p >= 50) return 75
  return null
}

function computeBenefits(p: number): Benefit[] {
  return ALL_BENEFITS
    .filter((b) => p >= b.minPercent)
    .map(({ minPercent: _m, ...b }) => b)
}

export default function RightsScreen(): React.JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [percent, setPercent] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    getTelkPercent()
      .then((saved) => {
        if (saved !== null) {
          setPercent(saved)
          setInput(String(saved))
        }
      })
      .finally(() => setLoadingPrefs(false))
  }, [])

  async function handleApply(): Promise<void> {
    const n = parseInt(input, 10)
    if (isNaN(n) || n < 0 || n > 100) return
    setPercent(n)
    setEditing(false)
    await saveTelkPercent(n)
  }

  const benefits = percent !== null ? computeBenefits(percent) : []
  const allowance = percent !== null ? getAllowance(percent) : null

  if (loadingPrefs) {
    return <View style={s.center}><ActivityIndicator color="#1A4A6B" /></View>
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Моите права</Text>
      </View>

      {/* Percent input card */}
      <View style={s.inputCard}>
        {percent !== null && !editing ? (
          /* Personalised — show current value with edit option */
          <View style={s.savedRow}>
            <View style={[s.savedBadge, { backgroundColor: getTierColor(percent) }]}>
              <Text style={s.savedValue}>{percent}%</Text>
            </View>
            <View style={s.savedInfo}>
              <Text style={s.savedTier}>{getTierLabel(percent)}</Text>
              {allowance !== null && (
                <Text style={s.savedAllowance}>Месечна добавка: ~{allowance} лв.</Text>
              )}
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)} hitSlop={10}>
              <Text style={s.editBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Input mode */
          <>
            <Text style={s.inputLabel}>Процент от ТЕЛК решение</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                placeholder="напр. 75"
                placeholderTextColor="#9AB0BF"
                value={input}
                onChangeText={setInput}
                maxLength={3}
                autoFocus={editing}
                returnKeyType="done"
                onSubmitEditing={handleApply}
              />
              <Text style={s.pct}>%</Text>
              <TouchableOpacity
                style={[s.applyBtn, !input.trim() && s.applyBtnDisabled]}
                onPress={handleApply}
                disabled={!input.trim()}
              >
                <Text style={s.applyBtnText}>Покажи правата</Text>
              </TouchableOpacity>
            </View>
            {editing && (
              <TouchableOpacity style={s.cancelRow} onPress={() => { setEditing(false); setInput(String(percent ?? '')) }}>
                <Text style={s.cancelText}>Отказ</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Results */}
      {percent !== null && (
        <>
          {benefits.length === 0 ? (
            <View style={s.noBenefitsCard}>
              <Text style={s.noBenefitsText}>
                При под 50% увреждане няма право на социални добавки по ЗИХУ.
              </Text>
            </View>
          ) : (
            CATEGORIES.map((cat) => {
              const items = benefits.filter((b) => b.category === cat)
              if (items.length === 0) return null
              return (
                <View key={cat} style={s.section}>
                  <Text style={s.sectionTitle}>{CATEGORY_LABEL[cat]}</Text>
                  {items.map((b) => (
                    <View key={b.id} style={s.benefitCard}>
                      <Text style={s.benefitLabel}>{b.label}</Text>
                      <Text style={s.benefitDetail}>{b.detail}</Text>
                    </View>
                  ))}
                </View>
              )
            })
          )}

          <Text style={s.footer}>
            Правата се определят съгласно ЗИХУ, КТ и НЗОК правилника. Консултирайте се с АСП за точни суми.
          </Text>
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },

  header: { backgroundColor: '#6B3D1A', padding: 16, gap: 4 },
  back: { color: '#E8C8A8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  inputCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  savedBadge: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  savedValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  savedInfo: { flex: 1, gap: 3 },
  savedTier: { fontSize: 15, fontWeight: '700', color: '#1C2B3A' },
  savedAllowance: { fontSize: 13, color: '#1A6B3C', fontWeight: '600' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDF3F7', justifyContent: 'center', alignItems: 'center',
  },
  editBtnText: { fontSize: 16 },

  inputLabel: { fontSize: 14, color: '#3D5A73' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    width: 72, borderWidth: 1.5, borderColor: '#B8CDD8', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    fontSize: 20, fontWeight: '700', color: '#1C2B3A', textAlign: 'center',
  },
  pct: { fontSize: 20, color: '#1C2B3A', fontWeight: '600' },
  applyBtn: {
    flex: 1, backgroundColor: '#6B3D1A', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.45 },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelRow: { alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#3D5A73' },

  noBenefitsCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  noBenefitsText: { fontSize: 14, color: '#8B1A1A', lineHeight: 20 },

  section: { marginHorizontal: 16, marginTop: 6, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C2B3A', marginBottom: 2 },
  benefitCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 4,
    borderLeftWidth: 4, borderLeftColor: '#6B3D1A',
  },
  benefitLabel: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  benefitDetail: { fontSize: 13, color: '#3D5A73', lineHeight: 18 },

  footer: {
    marginHorizontal: 16, marginTop: 20,
    fontSize: 12, color: '#7A95A8', textAlign: 'center', lineHeight: 17,
  },
})
