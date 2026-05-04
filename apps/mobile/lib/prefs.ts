import * as SecureStore from 'expo-secure-store'

const TELK_PERCENT_KEY = 'telk_percent'

export async function getTelkPercent(): Promise<number | null> {
  const val = await SecureStore.getItemAsync(TELK_PERCENT_KEY)
  if (!val) return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

export async function saveTelkPercent(percent: number): Promise<void> {
  await SecureStore.setItemAsync(TELK_PERCENT_KEY, String(percent))
}

export async function clearTelkPercent(): Promise<void> {
  await SecureStore.deleteItemAsync(TELK_PERCENT_KEY)
}
