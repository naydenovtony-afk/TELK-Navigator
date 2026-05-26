import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
  TextInput, ActivityIndicator, Alert, Share, KeyboardAvoidingView, Platform,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../lib/auth'
import { generateMobileAppeal, type AppealInput } from '../lib/api'

const STEPS = [
  {
    num: '1',
    title: 'Срок за обжалване',
    body: 'Имате 14 дни от получаване на решението за подаване на жалба. Срокът е преклузивен — след изтичането му решението влиза в сила.',
  },
  {
    num: '2',
    title: 'Пред кого се обжалва',
    body: 'Решението на ТЕЛК се обжалва пред Регионална лекарска комисия (РЛК) към НЕЛК. Жалбата се подава чрез ТЕЛК, издало решението.',
  },
  {
    num: '3',
    title: 'Съдържание на жалбата',
    body: 'Жалбата трябва да съдържа: вашите лични данни, номера на решението, основанията за несъгласие и конкретното искане (промяна на процента, срока или диагнозата).',
  },
  {
    num: '4',
    title: 'Необходими документи',
    body: '• Копие от решението\n• Нови медицински документи (епикризи, изследвания)\n• Писмена жалба в 2 екземпляра\n• Документ за самоличност',
  },
  {
    num: '5',
    title: 'Съдебно обжалване',
    body: 'Ако не сте доволни от решението на РЛК/НЕЛК, можете да го обжалвате пред Административния съд по местонахождение в 14-дневен срок.',
  },
]

type FormState = {
  applicantName: string
  telkCity: string
  receivedPercent: string
  expectedPercent: string
  diagnosis: string
  grounds: string
  missingDocuments: string
}

const EMPTY_FORM: FormState = {
  applicantName: '',
  telkCity: '',
  receivedPercent: '',
  expectedPercent: '',
  diagnosis: '',
  grounds: '',
  missingDocuments: '',
}

export default function AppealScreen(): React.JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { token } = useAuth()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [result, setResult] = useState('')
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function field(key: keyof FormState) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleGenerate(): Promise<void> {
    setGenError('')

    const rPct = parseInt(form.receivedPercent, 10)
    const ePct = parseInt(form.expectedPercent, 10)

    if (!form.applicantName.trim()) { setGenError('Въведете вашите имена.'); return }
    if (!form.telkCity.trim()) { setGenError('Въведете град на ТЕЛК комисията.'); return }
    if (isNaN(rPct) || rPct < 0 || rPct > 100) { setGenError('Въведете валиден получен процент (0–100).'); return }
    if (isNaN(ePct) || ePct < 1 || ePct > 100) { setGenError('Въведете валиден очакван процент.'); return }
    if (ePct <= rPct) { setGenError('Очакваният процент трябва да е по-висок от получения.'); return }
    if (!form.diagnosis.trim()) { setGenError('Въведете диагноза.'); return }
    if (form.grounds.trim().length < 10) { setGenError('Опишете основанията (мин. 10 знака).'); return }
    if (!token) { setGenError('Не сте влезли в профила си.'); return }

    setGenerating(true)
    setResult('')

    const input: AppealInput = {
      applicantName: form.applicantName.trim(),
      telkCity: form.telkCity.trim(),
      receivedPercent: rPct,
      expectedPercent: ePct,
      diagnosisDescription: form.diagnosis.trim(),
      groundsForAppeal: form.grounds.trim(),
      missingDocuments: form.missingDocuments.trim() || undefined,
    }

    try {
      const { appeal } = await generateMobileAppeal(token, input)
      setResult(appeal)
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Грешка при генериране')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(): Promise<void> {
    if (!result) return
    await Clipboard.setStringAsync(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare(): Promise<void> {
    if (!result) return
    await Share.share({ message: result })
  }

  function handleClear(): void {
    Alert.alert('Изчисти жалбата', 'Сигурни ли сте?', [
      { text: 'Отказ', style: 'cancel' },
      { text: 'Изчисти', style: 'destructive', onPress: () => setResult('') },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E8F4F8' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Обжалване</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* 14-day warning */}
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            ⚠️  Срокът за обжалване е 14 дни от получаване на решението. Не го изпускайте.
          </Text>
        </View>

        {/* Info steps */}
        {STEPS.map((step) => (
          <View key={step.num} style={styles.stepCard}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{step.num}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        {/* NELK contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞  Национална експертна лекарска комисия</Text>
          <Text style={styles.contactLine}>гр. София, ул. „Христо Максимов" № 6</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://nelk.bg')}>
            <Text style={styles.contactLink}>nelk.bg →</Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Generator ── */}
        <View style={styles.generatorCard}>
          <TouchableOpacity
            style={styles.generatorHeader}
            onPress={() => setGeneratorOpen((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.generatorHeaderLeft}>
              <Text style={styles.generatorIcon}>🤖</Text>
              <View>
                <Text style={styles.generatorTitle}>Генерирай жалба с AI</Text>
                <Text style={styles.generatorSub}>Официална жалба с правни основания</Text>
              </View>
            </View>
            <Text style={styles.generatorChevron}>{generatorOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {generatorOpen && (
            <View style={styles.generatorBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Вашите имена *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Иван Петров Иванов"
                  placeholderTextColor="#9AB0BF"
                  value={form.applicantName}
                  onChangeText={field('applicantName')}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Град на ТЕЛК комисията *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="София, Пловдив, Варна…"
                  placeholderTextColor="#9AB0BF"
                  value={form.telkCity}
                  onChangeText={field('telkCity')}
                />
              </View>

              <View style={styles.row2col}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Получена оценка *</Text>
                  <View style={styles.percentRow}>
                    <TextInput
                      style={[styles.input, styles.inputPercent]}
                      placeholder="50"
                      placeholderTextColor="#9AB0BF"
                      value={form.receivedPercent}
                      onChangeText={field('receivedPercent')}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Исканата оценка *</Text>
                  <View style={styles.percentRow}>
                    <TextInput
                      style={[styles.input, styles.inputPercent]}
                      placeholder="71"
                      placeholderTextColor="#9AB0BF"
                      value={form.expectedPercent}
                      onChangeText={field('expectedPercent')}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Диагноза / МКБ код *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="напр. M47.26 Спондилоза с радикулопатия"
                  placeholderTextColor="#9AB0BF"
                  value={form.diagnosis}
                  onChangeText={field('diagnosis')}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Основания за обжалване *</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Опишете защо смятате, че решението е неправилно — не са взети предвид документи, функционалният статус е подценен…"
                  placeholderTextColor="#9AB0BF"
                  value={form.grounds}
                  onChangeText={field('grounds')}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Непризнати документи{'  '}
                  <Text style={styles.optional}>(по избор)</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Епикризи, изследвания или специализирани консултации, непотвърдени от комисията…"
                  placeholderTextColor="#9AB0BF"
                  value={form.missingDocuments}
                  onChangeText={field('missingDocuments')}
                  multiline
                  numberOfLines={2}
                  maxLength={500}
                />
              </View>

              {genError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{genError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                disabled={generating}
                activeOpacity={0.85}
              >
                {generating
                  ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.generateBtnText}>  Генерира се…</Text></>
                  : <Text style={styles.generateBtnText}>🤖  Генерирай жалба</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Result ── */}
        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderTitle}>📄  Жалба до съда</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity onPress={handleCopy} hitSlop={8}>
                  <Text style={[styles.resultActionText, copied && { color: '#1A6B3C' }]}>
                    {copied ? '✓ Копирано' : 'Копирай'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} hitSlop={8}>
                  <Text style={styles.resultActionText}>Сподели</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClear} hitSlop={8}>
                  <Text style={[styles.resultActionText, { color: '#8B1A1A' }]}>Изчисти</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.resultText} selectable>{result}</Text>

            <View style={styles.resultWarning}>
              <Text style={styles.resultWarningText}>
                ⚠️  Жалбата е генерирана от AI. Прегледайте я с адвокат преди подаване. Срокът е 14 дни (АПК чл.149).
              </Text>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1A4A6B', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  alert: {
    backgroundColor: '#FFF3CD', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#F0C040',
  },
  alertText: { fontSize: 14, color: '#7A5200', lineHeight: 20 },

  stepCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', flexDirection: 'row', gap: 14,
  },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A4A6B', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepContent: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  stepBody: { fontSize: 13, color: '#3D5A73', lineHeight: 20 },

  contactCard: {
    backgroundColor: '#1A4A6B', borderRadius: 12, padding: 16, gap: 6,
  },
  contactTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactLine: { color: '#B8CDD8', fontSize: 13 },
  contactLink: { color: '#5BC8C8', fontSize: 14, fontWeight: '600' },

  // ── AI Generator ──
  generatorCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#1A4A6B',
    overflow: 'hidden',
    elevation: 2, shadowColor: '#1A4A6B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  generatorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  generatorHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  generatorIcon: { fontSize: 28 },
  generatorTitle: { fontSize: 16, fontWeight: '700', color: '#1A4A6B' },
  generatorSub: { fontSize: 12, color: '#3D5A73', marginTop: 1 },
  generatorChevron: { fontSize: 13, color: '#7A95A8' },
  generatorBody: { padding: 16, paddingTop: 0, gap: 12, borderTopWidth: 0.5, borderTopColor: '#B8CDD8' },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3D5A73' },
  optional: { fontWeight: '400', color: '#9AB0BF' },
  input: {
    borderWidth: 1.5, borderColor: '#B8CDD8', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1C2B3A', backgroundColor: '#FAFCFD',
  },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  inputPercent: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  row2col: { flexDirection: 'row', gap: 12 },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  percentSign: { fontSize: 18, fontWeight: '700', color: '#1C2B3A', flexShrink: 0 },

  errorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#E8B4B4',
  },
  errorText: { fontSize: 13, color: '#8B1A1A', lineHeight: 18 },

  generateBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6, marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.55 },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Result ──
  resultCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#B8CDD8',
    backgroundColor: '#F8FBFC',
  },
  resultHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#1C2B3A' },
  resultActions: { flexDirection: 'row', gap: 16 },
  resultActionText: { fontSize: 13, fontWeight: '600', color: '#1A4A6B' },
  resultText: {
    padding: 16, fontSize: 13, color: '#1C2B3A', lineHeight: 21,
  },
  resultWarning: {
    backgroundColor: '#FFF8E8', padding: 14,
    borderTopWidth: 0.5, borderTopColor: '#F0C040',
  },
  resultWarningText: { fontSize: 12, color: '#7A5200', lineHeight: 18 },
})
