// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse')
import { getPublicUrl } from './r2'

export async function extractTextFromKey(fileKey: string): Promise<string> {
  const url = getPublicUrl(fileKey)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const parser = new PDFParse({ data: buffer })
  await parser.load()
  const result = await parser.getText()
  return (result.text as string).trim()
}
