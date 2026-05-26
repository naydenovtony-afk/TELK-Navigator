import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function EmployerLetterScreen(): React.JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [percent, setPercent] = useState('')
  const [date, setDate] = useState('')
  const [generated, setGenerated] = useState('')

  function generate(): void {
    if (!name || !company || !percent) {
      Alert.alert('Непълни данни', 'Попълнете поне имената, фирмата и процента.')
      return
    }
    const letter = `ДО РЪКОВОДСТВОТО НА ${company.toUpperCase()}

МОЛБА

от ${name}
длъжност: ${position || 'служител'}

ОТНОСНО: Осигуряване на подходящи условия за труд

Уважаеми господа/дами,

Уведомявам Ви, че съм лице с призната трайна неработоспособност ${percent}% по решение на ТЕЛК от ${date || '___________'}.

Съгласно чл. 314 от Кодекса на труда лица с намалена работоспособност имат право на подходящи условия на труд. Моля да предприемете необходимите мерки за адаптиране на работното ми място.

С уважение,
${name}
Дата: ${new Date().toLocaleDateString('bg-BG')}`
    setGenerated(letter)
  }

  async function copyToClipboard(): Promise<void> {
    await Clipboard.setStringAsync(generated)
    Alert.alert('Копирано', 'Писмото е копирано в клипборда.')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Писмо до работодател</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!generated ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Попълнете данните</Text>
            {[
              { label: 'Три имена *', value: name, setter: setName, placeholder: 'Иван Иванов Иванов' },
              { label: 'Фирма *', value: company, setter: setCompany, placeholder: 'ЕООД/АД' },
              { label: 'Длъжност', value: position, setter: setPosition, placeholder: 'Счетоводител' },
              { label: 'Процент нетрудоспособност *', value: percent, setter: setPercent, placeholder: '70', keyboard: 'numeric' },
              { label: 'Дата на решение', value: date, setter: setDate, placeholder: '01.01.2025' },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.setter}
                  placeholder={f.placeholder}
                  placeholderTextColor="#7A95A8"
                  keyboardType={(f as { keyboard?: string }).keyboard === 'numeric' ? 'numeric' : 'default'}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={generate}>
              <Text style={styles.buttonText}>Генерирай писмо</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.letterContainer}>
            <View style={styles.letter}>
              <Text style={styles.letterText}>{generated}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
              <Text style={styles.buttonText}>📋  Копирай в клипборда</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setGenerated('')}>
              <Text style={styles.secondaryButtonText}>← Редактирай</Text>
            </TouchableOpacity>
          </View>
        )}
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
  content: { padding: 16, gap: 16, backgroundColor: '#E8F4F8', flexGrow: 1 },
  form: { gap: 12 },
  formTitle: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  field: { gap: 4 },
  label: { fontSize: 13, color: '#3D5A73', fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderRadius: 8, padding: 13,
    borderWidth: 0.5, borderColor: '#B8CDD8', fontSize: 15, color: '#1C2B3A',
  },
  button: {
    backgroundColor: '#1A4A6B', borderRadius: 8, padding: 14,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#1A4A6B', fontSize: 15 },
  letterContainer: { gap: 12 },
  letter: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  letterText: { fontSize: 14, color: '#1C2B3A', lineHeight: 22 },
})
