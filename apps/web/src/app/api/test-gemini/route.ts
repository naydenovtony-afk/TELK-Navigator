import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'

export const runtime = 'nodejs'

const MODELS_TO_TRY = [
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  const results: Record<string, unknown> = {
    keyPresent: !!key,
    keyPrefix: key ? key.slice(0, 8) + '...' : null,
    modelResults: {} as Record<string, string>,
  }

  const genAI = new GoogleGenerativeAI(key!)

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const res = await model.generateContent('Reply with the single word: OK')
      ;(results.modelResults as Record<string, string>)[modelName] = 'OK: ' + res.response.text().trim()
      results.firstWorkingModel = modelName
      break
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      ;(results.modelResults as Record<string, string>)[modelName] = msg.slice(0, 120)
    }
  }

  try {
    const fm = new GoogleAIFileManager(key!)
    const list = await fm.listFiles()
    results.filesApiAccessible = true
    results.existingFiles = (list.files ?? []).length
  } catch (e) {
    results.filesApiError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results, { headers: { 'content-type': 'application/json' } })
}
