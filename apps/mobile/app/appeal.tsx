import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useRouter } from 'expo-router'

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

export default function AppealScreen(): React.JSX.Element {
  const router = useRouter()

  return (
    <View style={{ flex: 1, backgroundColor: '#E8F4F8' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Обжалване</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            ⚠️  Срокът за обжалване е 14 дни от получаване на решението. Не го изпускайте.
          </Text>
        </View>

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

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞  Национална експертна лекарска комисия</Text>
          <Text style={styles.contactLine}>гр. София, ул. „Христо Максимов" № 6</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://nelk.bg')}>
            <Text style={styles.contactLink}>nelk.bg →</Text>
          </TouchableOpacity>
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
  content: { padding: 16, gap: 12 },
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
})
