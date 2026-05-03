import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

type Result = { eligible: boolean; title: string; desc: string; basis: string }

function check(pct: number): Result {
  if (pct >= 90) {
    return {
      eligible: true,
      title: 'Вероятно отговаряте на условията',
      desc: 'При трайна неработоспособност ≥ 90% имате право да поискате пожизнено решение на ТЕЛК без периодично преосвидетелстване.',
      basis: 'Чл. 101, ал. 2 от Наредбата за медицинската експертиза',
    }
  }
  if (pct >= 71) {
    return {
      eligible: false,
      title: 'Не отговаряте автоматично',
      desc: 'При 71–89% обичайно се издава решение за срок 1–3 години. Пожизнено решение е възможно само при трайни и необратими заболявания — преценява се от ТЕЛК комисията.',
      basis: 'Чл. 68–70 от Наредбата за медицинската експертиза',
    }
  }
  return {
    eligible: false,
    title: 'Не отговаряте на условията',
    desc: 'Пожизнено решение на ТЕЛК изисква висока степен на трайна неработоспособност (обичайно ≥ 90%) и необратим характер на заболяването.',
    basis: 'Наредба за медицинска експертиза',
  }
}

export default function LifelongScreen(): React.JSX.Element {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  function handleCheck(): void {
    const n = parseInt(input, 10)
    if (isNaN(n) || n < 0 || n > 100) return
    setResult(check(n))
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E8F4F8' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Пожизнена помощ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.question}>Какъв е вашият процент нетрудоспособност?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder="0 – 100"
              placeholderTextColor="#7A95A8"
              maxLength={3}
            />
            <Text style={styles.percent}>%</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleCheck}>
            <Text style={styles.buttonText}>Провери</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View style={[styles.resultCard, { borderColor: result.eligible ? '#1A6B3C' : '#7A5200' }]}>
            <Text style={[styles.resultIcon]}>{result.eligible ? '✅' : 'ℹ️'}</Text>
            <Text style={[styles.resultTitle, { color: result.eligible ? '#1A6B3C' : '#7A5200' }]}>
              {result.title}
            </Text>
            <Text style={styles.resultDesc}>{result.desc}</Text>
            <View style={styles.basisRow}>
              <Text style={styles.basisLabel}>Правно основание: </Text>
              <Text style={styles.basisText}>{result.basis}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️  Какво е пожизнено решение?</Text>
          <Text style={styles.infoText}>
            Пожизненото решение на ТЕЛК означава, че не е необходимо периодично преосвидетелстване. Издава се при тежки, трайни и необратими заболявания. Решението за пожизнено признаване се взима от комисията след преглед на цялостната медицинска документация.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  back: { color: '#B8CDD8', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 14 },
  question: { fontSize: 16, fontWeight: '600', color: '#1C2B3A' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#E8F4F8', borderRadius: 8, padding: 14,
    fontSize: 24, fontWeight: '700', color: '#1A4A6B', textAlign: 'center',
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  percent: { fontSize: 24, fontWeight: '700', color: '#1A4A6B' },
  button: { backgroundColor: '#1A4A6B', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    borderWidth: 1.5, gap: 10, alignItems: 'center',
  },
  resultIcon: { fontSize: 36 },
  resultTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  resultDesc: { fontSize: 14, color: '#3D5A73', lineHeight: 20, textAlign: 'center' },
  basisRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  basisLabel: { fontSize: 12, color: '#7A95A8', fontWeight: '600' },
  basisText: { fontSize: 12, color: '#7A95A8', fontStyle: 'italic' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#1C2B3A' },
  infoText: { fontSize: 13, color: '#3D5A73', lineHeight: 20 },
})
