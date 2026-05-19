import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTelkPercent, saveTelkPercent } from '../../lib/prefs'
import { BenefitCard } from '../../components/BenefitCard'
import type { BenefitItem } from '../../components/BenefitCard'

type Benefit = BenefitItem

const ALL_BENEFITS: (Benefit & { minPercent: number })[] = [
  { id: 'B001', minPercent: 50, category: 'financial',   label: 'Месечна добавка за увреждане',        detail: 'Изплаща се от АСП. Размерът се определя ежегодно с акт на Министерския съвет. (Чл. 70–74 ЗХУ)',                                                                             sourceUrl: 'https://asp.government.bg/bg/deynosti/podkrepa-na-horata-s-uvrezhdaniya/pravo-na-mesechna-finansova-podkrepa/' },
  { id: 'B002', minPercent: 50, category: 'financial',   label: 'Данъчно облекчение (ЗДДФЛ)',           detail: 'Намаление на данъчната основа с 7 920 лв. годишно при подаване на декларация. (Чл. 18 ЗДДФЛ)',                                                                           sourceUrl: 'https://nra.bg/wps/portal/nra/taxes/godishen-danak-varhu-dohdite/danachni-oblekcheniya' },
  { id: 'B003', minPercent: 50, category: 'financial',   label: 'Намаление на данък сгради',           detail: '50% намаление на данъка върху недвижимите имоти за основно жилище. (Чл. 25 ЗМДТ)',                                                                                         sourceUrl: 'https://nra.bg/wps/portal/nra/taxes/mestni-danatsi-i-taksi/sgradi-i-smet/sgradi-i-smet' },
  { id: 'B004', minPercent: 50, category: 'transport',   label: 'Безплатен градски транспорт',          detail: 'Безплатно пътуване в обществения транспорт на населеното място по местоживеене. (Чл. 65 ЗХУ)',                                                                             sourceUrl: 'https://nssi.bg/wp-content/uploads/ZHU.pdf' },
  { id: 'B005', minPercent: 50, category: 'healthcare',  label: 'Безплатни лекарства (по списък)',      detail: 'Медикаменти за хронични заболявания, включени в позитивния лекарствен списък, се заплащат от НЗОК. (Чл. 45 ЗЗО)',                                                         sourceUrl: 'https://nhif.bg/bg/medicine_food/medical-list/2026' },
  { id: 'B006', minPercent: 50, category: 'social',      label: 'Помощни средства и съоръжения',       detail: 'Финансиране на помощни технически средства, протези и ортези чрез НЗОК и АСП. (Чл. 68 ЗХУ)',                                                                               sourceUrl: 'https://www.mlsp.government.bg/eng/integratsiya-na-khorata-s-uvrezhdaniya' },
  { id: 'B016', minPercent: 50, category: 'employment',  label: '7-часов работен ден',                 detail: 'Работещите с ТЕЛК решение имат право на намалено работно време от 7 часа при пълна заплата. (Чл. 319 КТ)',                                                                 sourceUrl: 'https://nsrhu.bg/?page=novina&lang=bg&novina=51' },
  { id: 'B017', minPercent: 50, category: 'employment',  label: 'Минимум 26 дни платен отпуск',        detail: 'Работещите с увреждане имат право на не по-малко от 26 работни дни годишен платен отпуск. (Чл. 155, ал. 4 КТ)',                                                           sourceUrl: 'https://nsrhu.bg/?page=novina&lang=bg&novina=51' },
  { id: 'B018', minPercent: 50, category: 'employment',  label: 'Закрила при уволнение',               detail: 'Работодателят е длъжен да поиска предварително разрешение от Инспекцията по труда преди уволнение. (Чл. 333, ал. 1 КТ)',                                                   sourceUrl: 'https://nsrhu.bg/?page=novina&lang=bg&novina=51' },
  { id: 'B007', minPercent: 71, category: 'transport',   label: 'Карта за паркиране (Синя карта)',      detail: 'Право на специален стикер и паркиране на обозначени места за хора с увреждания. (Наредба № РД-02-20-2)',                                                                   sourceUrl: 'https://nssi.bg/wp-content/uploads/ZHU.pdf' },
  { id: 'B008', minPercent: 71, category: 'transport',   label: '50% намаление на ж.п. билети',         detail: 'Намаление при пътуване с БДЖ — важи за притежателя на ТЕЛК решение. (Чл. 66 ЗХУ)',                                                                                        sourceUrl: 'https://nssi.bg/wp-content/uploads/ZHU.pdf' },
  { id: 'B009', minPercent: 71, category: 'transport',   label: 'Намаление при въздушен транспорт',    detail: 'Право на помощ и настаняване при въздушно пътуване съгласно европейски регламент. (Регл. (ЕО) 1107/2006)',                                                                  sourceUrl: 'https://transport.ec.europa.eu' },
  { id: 'B010', minPercent: 71, category: 'social',      label: 'Приоритет в социални услуги',         detail: 'Приоритетен достъп до дневни центрове, домашен помощник и социален асистент. (Чл. 18 ЗСУ)',                                                                               sourceUrl: 'https://www.mlsp.government.bg/eng/integratsiya-na-khorata-s-uvrezhdaniya' },
  { id: 'B011', minPercent: 71, category: 'financial',   label: 'Целева помощ за отопление',           detail: 'Право на целева помощ за отопление при покриване на доходен критерий. (ЗСПД)',                                                                                            sourceUrl: 'https://www.mlsp.government.bg/eng/integratsiya-na-khorata-s-uvrezhdaniya' },
  { id: 'B012', minPercent: 91, category: 'social',      label: 'Личен асистент (до 4 ч/ден)',          detail: 'Финансирана от държавата услуга за подпомагане при ежедневни дейности. (Чл. 75 ЗХУ)',                                                                                      sourceUrl: 'https://www.mlsp.government.bg/eng/integratsiya-na-khorata-s-uvrezhdaniya' },
  { id: 'B013', minPercent: 91, category: 'financial',   label: 'Надбавка за постоянна чужда помощ',   detail: 'Допълнителна надбавка за лица, нуждаещи се от постоянни грижи от друго лице — отразено в ТЕЛК решението. (Чл. 103 КСО)',                                                   sourceUrl: 'https://noi.bg' },
  { id: 'B014', minPercent: 91, category: 'financial',   label: 'Намаление на телефонна такса',        detail: 'Социална абонаментна такса при фиксирана телефонна линия. (Наредба на КРС)',                                                                                               sourceUrl: 'https://crc.bg' },
  { id: 'B015', minPercent: 91, category: 'healthcare',  label: 'Освобождаване от потребителска такса', detail: 'Пълно освобождаване от потребителска такса при посещение на личен лекар и специалист. (Чл. 37 ЗЗО)',                                                                      sourceUrl: 'https://nhif.bg' },
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
      {/* Header — matches lifelong */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Моите права</Text>
      </View>

      {/* Input card — matches lifelong style */}
      <View style={s.card}>
        {percent !== null && !editing ? (
          /* Saved state */
          <>
            <View style={s.savedRow}>
              <View style={[s.tierBadge, { backgroundColor: getTierColor(percent) }]}>
                <Text style={s.tierPercent}>{percent}%</Text>
              </View>
              <View style={s.savedInfo}>
                <Text style={s.tierLabel}>{getTierLabel(percent)}</Text>
                {allowance !== null && (
                  <Text style={s.allowanceText}>Месечна добавка: ~{allowance} лв.</Text>
                )}
              </View>
              <TouchableOpacity style={s.editCircle} onPress={() => setEditing(true)} hitSlop={10}>
                <Text style={s.editCircleText}>✏️</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Input mode — matches lifelong layout */
          <>
            <Text style={s.question}>Какъв е процентът от вашето ТЕЛК решение?</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                placeholder="0 – 100"
                placeholderTextColor="#7A95A8"
                value={input}
                onChangeText={setInput}
                maxLength={3}
                autoFocus={editing}
                returnKeyType="done"
                onSubmitEditing={handleApply}
              />
              <Text style={s.percent}>%</Text>
            </View>
            <TouchableOpacity
              style={[s.button, !input.trim() && s.buttonDisabled]}
              onPress={handleApply}
              disabled={!input.trim()}
            >
              <Text style={s.buttonText}>Покажи правата ми</Text>
            </TouchableOpacity>
            {editing && (
              <TouchableOpacity
                style={s.cancelRow}
                onPress={() => { setEditing(false); setInput(String(percent ?? '')) }}
              >
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
                При под 50% увреждане няма право на социални добавки по ЗХУ.
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
                    <BenefitCard key={b.id} benefit={b} />
                  ))}
                </View>
              )
            })
          )}

          <Text style={s.footer}>
            Правата са гарантирани от действащото законодателство (КТ, ЗХУ, ЗДДФЛ, ЗМДТ, ЗЗО). Паричните суми се актуализират ежегодно с акт на Министерския съвет.
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

  /* Header — same as lifelong.tsx */
  header: {
    backgroundColor: '#1A4A6B', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },

  /* Input card — same structure as lifelong.tsx */
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    margin: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  question: { fontSize: 16, fontWeight: '600', color: '#1C2B3A' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#E8F4F8', borderRadius: 8, padding: 14,
    fontSize: 24, fontWeight: '700', color: '#1A4A6B', textAlign: 'center',
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  percent: { fontSize: 24, fontWeight: '700', color: '#1A4A6B' },
  button: {
    backgroundColor: '#1A4A6B', borderRadius: 8, padding: 14, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelRow: { alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#3D5A73' },

  /* Saved state */
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tierBadge: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  tierPercent: { color: '#fff', fontSize: 26, fontWeight: '800' },
  savedInfo: { flex: 1, gap: 3 },
  tierLabel: { fontSize: 15, fontWeight: '700', color: '#1C2B3A' },
  allowanceText: { fontSize: 13, color: '#1A6B3C', fontWeight: '600' },
  editCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDF3F7', justifyContent: 'center', alignItems: 'center',
  },
  editCircleText: { fontSize: 16 },

  /* Benefits sections */
  noBenefitsCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  noBenefitsText: { fontSize: 14, color: '#8B1A1A', lineHeight: 20 },
  section: { marginHorizontal: 16, marginTop: 6, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C2B3A', marginBottom: 2 },
  footer: {
    marginHorizontal: 16, marginTop: 20,
    fontSize: 12, color: '#7A95A8', textAlign: 'center', lineHeight: 17,
  },
})
