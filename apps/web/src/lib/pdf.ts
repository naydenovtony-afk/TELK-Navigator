// Import internal module directly — the main pdf-parse entry point tries to
// read a test fixture from node_modules at import time, which crashes serverless.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')
import { getPublicUrl } from './r2'

export async function extractTextFromKey(fileKey: string): Promise<string> {
  const url = getPublicUrl(fileKey)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const data = await pdfParse(buffer)
  return data.text.trim()
}
