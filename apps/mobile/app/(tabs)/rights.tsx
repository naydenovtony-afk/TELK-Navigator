import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'

type Benefit = { id: string; label: string; detail: string; category: string }

const ALL_BENEFITS: (Benefit & { minPercent: number })[] = [
  { id: 'B001', minPercent: 50, category: 'financial', label: 'Месечна добавка за увреждане', detail: 'Изплаща се от АСП. Размерът зависи от степента на увреждане.' },
  { id: 'B002', minPercent: 50, category: 'financial', label: 'Данъчно облекчение (ЗДДФЛ)', detail: 'Намаление на данъчната основа с 7 920 лв. годишно.' },
  { id: 'B003', minPercent: 50, category: 'financial', label: 'Намаление на данък сгради', detail: '50% намаление на данъка върху недвижимите имоти за основно жилище.' },
  { id: 'B004', minPercent: 50, category: 'transport', label: 'Безплатен градски транспорт', detail: 'Безплатно пътуване в обществения транспорт по местоживеене.' },
  { id: 'B005', minPercent: 50, category: 'healthcare', label: 'Безплатни лекарства (по списък)', detail: 'Медикаменти за хронични заболявания се заплащат от НЗОК.' },
  { id: 'B006', minPercent: 50, category: 'social', label: 'Помощни средства и съоръжения', detail: 'Финансиране на помощни технически средства чрез НЗОК и АСП.' },
  { id: 'B007', minPercent: 71, category: 'transport', label: 'Карта за паркиране (Синя карта)', detail: 'Паркиране на обозначени места за хора с увреждания.' },
  { id: 'B008', minPercent: 71, category: 'transport', label: '50% намаление на ж.п. билети', detail: 'Намаление при пътуване с БДЖ.' },
  { id: 'B009', minPercent: 71, category: 'transport', label: 'Намаление при въздушен транспорт', detail: 'Някои авиокомпании предоставят намаления.' },
  { id: 'B010', minPercent: 71, category: 'social', label: 'Приоритет в социални услуги', detail: 'Приоритетен достъп до дневни центрове и социален асистент.' },
  { id: 'B011', minPercent: 71, category: 'financial', label: 'Целева помощ за отопление', detail: 'Право на целева помощ при покриване на доходен критерий.' },
  { id: 'B012', minPercent: 91, category: 'social', label: 'Личен асистент (до 4 ч/ден)', detail: 'Финансирана от държавата услуга за подпомагане при ежедневни дейности.' },
  { id: 'B013', minPercent: 91, category: 'employment', label: 'Допълнителен платен отпуск — 25 дни', detail: 'Минимум 25 дни платен годишен отпуск.' },
  { id: 'B014', minPercent: 91, category: 'financial', label: 'Намаление на телефонна такса', detail: 'Социална абонаментна такса при фиксирана телефонна линия.' },
  { id: 'B015', minPercent: 91, category: 'healthcare', label: 'Освобождаване от потребителска такса', detail: 'Пълно освобождаване от такса при посещение на лекар.' },
]

const CATEGORY_LABEL: Record<string, string> = {
  financial: 'Финансови',
  transport: 'Транспорт',
  healthcare: 'Здравеопазване',
  employment: 'Трудови права',
  social: 'Социални услуги',
}

function getTierLabel(percent: number): string {
  if (percent >= 91) return 'Тежко увреждане (91–100%)'
  if (percent >= 71) return 'Значително увреждане (71–90%)'
  if (percent >= 50) return 'Умерено увреждане (50–70%)'
  return 'Под минималния праг (50%)'
}

function getAllowance(percent: number): number | null {
  if (percent >= 91) return 225
  if (percent >= 71) return 150
  if (percent >= 50) return 75
  return null
}

export default function RightsScreen(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{ percent: number; benefits: Benefit[] } | null>(null)

  function calculate(): void {
    const n = parseInt(input, 10)
    if (isNaN(n) || n < 0 || n > 100) return
    const benefits = ALL_BENEFITS
      .filter((b) => n >= b.minPercent)
      .map(({ minPercent: _m, ...b }) => b)
    setResult({ percent: n, benefits })
  }

  const allowance = result ? getAllowance(result.percent) : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Калкулатор на права</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Процент увреждане от ТЕЛК решение</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="напр. 75"
            placeholderTextColor="#3D5A73"
            value={input}
            onChangeText={setInput}
            maxLength={3}
          />
          <Text style={styles.pct}>%</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={calculate}>
          <Text style={styles.buttonText}>Изчисли</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <>
          <View style={styles.tierCard}>
            <Text style={styles.tierLabel}>{getTierLabel(result.percent)}</Text>
            {allowance !== null && (
              <Text style={styles.allowance}>
                Месечна добавка: ~{allowance} лв.
              </Text>
            )}
            {result.benefits.length === 0 && (
              <Text style={styles.noBenefits}>
                Под 50% — няма право на социални добавки.
              </Text>
            )}
          </View>

          {(['financial', 'transport', 'healthcare', 'employment', 'social'] as const)
            .map((cat) => {
              const items = result.benefits.filter((b) => b.category === cat)
              if (items.length === 0) return null
              return (
                <View key={cat} style={styles.section}>
                  <Text style={styles.sectionTitle}>{CATEGORY_LABEL[cat]}</Text>
                  {items.map((b) => (
                    <View key={b.id} style={styles.benefitCard}>
                      <Text style={styles.benefitLabel}>{b.label}</Text>
                      <Text style={styles.benefitDetail}>{b.detail}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  content: { paddingBottom: 32 },
  header: {
    backgroundColor: '#1A4A6B',
    padding: 16,
    paddingTop: 52,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 10,
  },
  label: { fontSize: 14, color: '#3D5A73' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    borderRadius: 6,
    padding: 14,
    fontSize: 18,
    color: '#1C2B3A',
  },
  pct: { fontSize: 18, color: '#1C2B3A', fontWeight: '500' },
  button: {
    backgroundColor: '#1A4A6B',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  tierCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 6,
  },
  tierLabel: { fontSize: 16, fontWeight: '500', color: '#1A4A6B' },
  allowance: { fontSize: 14, color: '#1A6B3C' },
  noBenefits: { fontSize: 14, color: '#8B1A1A' },
  section: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: '#3D5A73', textTransform: 'uppercase', letterSpacing: 0.5 },
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 4,
  },
  benefitLabel: { fontSize: 15, fontWeight: '500', color: '#1C2B3A' },
  benefitDetail: { fontSize: 13, color: '#3D5A73', lineHeight: 18 },
})
