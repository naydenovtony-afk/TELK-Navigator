// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')
import { getPublicUrl } from './r2'

export async function extractTextFromKey(fileKey: string): Promise<string> {
  const url = getPublicUrl(fileKey)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const data = await pdfParse(buffer)
  return data.text.trim()
}
