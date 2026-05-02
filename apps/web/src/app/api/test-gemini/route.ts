import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'

export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  const results: Record<string, unknown> = {
    keyPresent: !!key,
    keyPrefix: key ? key.slice(0, 8) + '...' : null,
  }

  // Step 1: simple text generation
  try {
    const genAI = new GoogleGenerativeAI(key!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' })
    const res = await model.generateContent('Reply with the single word: OK')
    results.textGeneration = res.response.text().trim()
  } catch (e) {
    results.textGenerationError = e instanceof Error ? e.message : String(e)
  }

  // Step 2: Files API list (just verify auth)
  try {
    const fm = new GoogleAIFileManager(key!)
    const list = await fm.listFiles()
    results.filesApiAccessible = true
    results.existingFiles = (list.files ?? []).length
  } catch (e) {
    results.filesApiError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
