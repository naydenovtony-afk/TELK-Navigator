import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' })

function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return raw.slice(start, end + 1)
}

export interface AnalysisResult {
  nmeModuleVersion: string
  documentsOnFile: number
  documentsTotal: number
  covered: string[]
  incomplete: { id: string; label: string; note: string }[]
  missing: { id: string; label: string; reason: string }[]
  patientSummary: string
  doctorSummary: string
  icd10Code: string | null
  scorePrediction: { min: number; max: number; note: string }
}

const SYSTEM_PROMPT = `Ти си медицински анализатор за нуждите на ТЕЛК (Териториална Експертна Лекарска Комисия) в България.
Анализираш медицински документи (епикризи, амбулаторни листове и др.) и проверяваш дали съдържат необходимите елементи съгласно Наредбата за медицинска експертиза (НМЕ).

Върни САМО валиден JSON обект (без markdown, без обяснения преди или след) в следния формат:
{
  "nmeModuleVersion": "1.0.0",
  "documentsOnFile": <брой на добре документираните елементи, цяло число>,
  "documentsTotal": <общ брой проверявани НМЕ елементи, цяло число>,
  "covered": [<масив от низове — елементи, ясно документирани в документа>],
  "incomplete": [
    { "id": "<код>", "label": "<наименование>", "note": "<какво липсва или е непълно>" }
  ],
  "missing": [
    { "id": "<код>", "label": "<наименование>", "reason": "<защо се счита за липсващо>" }
  ],
  "patientSummary": "<2-3 изречения на разбираем български за пациента>",
  "doctorSummary": "<клинично резюме на български за лекаря>",
  "icd10Code": "<основен МКБ-10 код или null>",
  "scorePrediction": { "min": 0, "max": 0, "note": "" }
}

НМЕ елементи за проверка:
- D001: Основна диагноза с МКБ-10 код
- D002: Придружаващи заболявания
- D003: Давност на заболяването
- D004: Проведено лечение
- D005: Функционален статус / степен на ограничение
- D006: Параклинични изследвания
- D007: Специализирани консултации
- D008: Прогноза / динамика
- D009: Препоръки за бъдещо лечение
- D010: Подпис и печат на лекар / лечебно заведение`

export interface EmployerLetterInput {
  percent: number
  employeeName: string
  employerName: string
  accommodations: string[]
  notes?: string
}

const EMPLOYER_LETTER_PROMPT = `Ти си правен асистент, специализиран в трудовото право на България.
Генерирай официално писмо до работодател от служител с трайно намалена работоспособност, установена от ТЕЛК.

Правилата за форматиране:
- Официален делови стил на български
- Цитирай конкретни членове от Кодекса на труда (КТ) и Закона за хората с увреждания (ЗИХУ)
- Структура: град/дата горе вдясно → До: → Относно: → Уважаеми/а, → основен текст → С уважение
- Не добавяй markdown, само чист текст
- Датата да е: ${new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}

Правни основания за включване според процента:
- 50%+: КТ чл.319 (25 дни отпуск), КТ чл.333 (закрила при уволнение), ЗИХУ чл.35
- 71%+: горните + КТ чл.137 (намалено работно време), КТ чл.140 (нощен труд)
- 91%+: горните + ЗИХУ чл.39 (адаптация на работното място)`

export interface LifelongCheckInput {
  percent: number
  age: number
  diagnosisDescription: string
  isIrreversible: boolean
  isProgressive: boolean
  previousTelkYears?: number
}

export interface LifelongCriterion {
  met: boolean
  label: string
  detail: string
}

export interface LifelongCheckResult {
  verdict: 'likely' | 'possible' | 'unlikely'
  verdictLabel: string
  explanation: string
  criteria: LifelongCriterion[]
  recommendation: string
  legalBasis: string
}

const LIFELONG_PROMPT = `Ти си експерт по медицинска експертиза в България, специализиран в Наредбата за медицинска експертиза (НМЕ).

Анализирай дали пациентът отговаря на критериите за пожизнено ТЕЛК решение (без срок за преосвидетелстване) съгласно НМЕ.

Критерии за пожизнено решение:
1. Лице в пенсионна възраст (жени 60г.+, мъже 65г.+) с 50%+ увреждане
2. Необратими морфологични увреждания (ампутации, вродени аномалии, Синдром на Даун и др.)
3. Прогресиращи дегенеративни заболявания (Паркинсон, БАС, множествена склероза — напреднал стадий)
4. 91%+ с ясно необратими увреждания
5. Онкологично заболяване в ремисия 5+ години с остатъчни увреждания 71%+

Върни САМО валиден JSON без markdown:
{
  "verdict": "likely" | "possible" | "unlikely",
  "verdictLabel": "<Вероятно отговаря | Частично отговаря | Малко вероятно>",
  "explanation": "<2-3 изречения на ясен български>",
  "criteria": [
    { "met": true/false, "label": "<критерий>", "detail": "<кратко обяснение>" }
  ],
  "recommendation": "<Какво да поиска пациентът от ТЕЛК комисията>",
  "legalBasis": "<Конкретни членове от НМЕ или ЗИХУ>"
}`

export async function checkLifelongEligibility(input: LifelongCheckInput): Promise<LifelongCheckResult> {
  const prompt = `${LIFELONG_PROMPT}

Данни за пациента:
- Процент трайна неработоспособност: ${input.percent}%
- Възраст: ${input.age} години
- Описание на диагнозата: ${input.diagnosisDescription}
- Увреждането е необратимо: ${input.isIrreversible ? 'Да' : 'Не'}
- Увреждането е прогресиращо: ${input.isProgressive ? 'Да' : 'Не'}
${input.previousTelkYears ? `- Брой години с ТЕЛК решение: ${input.previousTelkYears}` : ''}

Анализирай и върни JSON:`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  try {
    return JSON.parse(extractJson(raw)) as LifelongCheckResult
  } catch {
    throw new Error('Невалиден отговор от AI: ' + raw.slice(0, 200))
  }
}

// ── Score Predictor ──────────────────────────────────────────────────────────

export interface ScorePredictorInput {
  diagnosisDescription: string
  functionalLimitations: string[]
  age: number
  previousPercent?: number
  additionalContext?: string
}

export interface ScorePredictorResult {
  rangeMin: number
  rangeMax: number
  rangeLabel: string
  keyFactors: { positive: string[]; negative: string[] }
  documentationTips: string[]
  summary: string
}

const SCORE_PREDICTOR_PROMPT = `Ти си експерт по медицинска експертиза в България с дълбоки познания по Наредбата за медицинска експертиза (НМЕ) и практиката на ТЕЛК комисиите.

Анализирай описаното увреждане и оцени очаквания диапазон на трайна неработоспособност, който ТЕЛК комисия би могла да присъди.

Върни САМО валиден JSON без markdown:
{
  "rangeMin": <долна граница, цяло число 0-100>,
  "rangeMax": <горна граница, цяло число 0-100>,
  "rangeLabel": "<напр. '50–70%' или 'под 50%'>",
  "keyFactors": {
    "positive": ["<фактор в полза на по-висока оценка>", ...],
    "negative": ["<фактор, който може да намали оценката>", ...]
  },
  "documentationTips": ["<какво да включи в документацията>", ...],
  "summary": "<2-3 изречения резюме на ясен български>"
}

Важно: Не използвай думите 'шанс', 'вероятност', 'резултат'. Използвай 'очаквана оценка' или 'диапазон'.`

export async function predictScore(input: ScorePredictorInput): Promise<ScorePredictorResult> {
  const limitationsText = input.functionalLimitations.length > 0
    ? input.functionalLimitations.join(', ')
    : 'не са посочени'

  const prompt = `${SCORE_PREDICTOR_PROMPT}

Данни:
- Диагноза: ${input.diagnosisDescription}
- Функционални ограничения: ${limitationsText}
- Възраст: ${input.age} години
${input.previousPercent ? `- Предишна ТЕЛК оценка: ${input.previousPercent}%` : ''}
${input.additionalContext ? `- Допълнително: ${input.additionalContext}` : ''}

Анализирай:`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  try {
    return JSON.parse(extractJson(raw)) as ScorePredictorResult
  } catch {
    throw new Error('Невалиден отговор от AI: ' + raw.slice(0, 200))
  }
}

// ── Appeal Assistant ──────────────────────────────────────────────────────────

export interface AppealInput {
  receivedPercent: number
  expectedPercent: number
  diagnosisDescription: string
  groundsForAppeal: string
  missingDocuments?: string
  applicantName: string
  telkCity: string
}

const APPEAL_PROMPT = `Ти си правен асистент, специализиран в административното право и медицинската експертиза в България.

Генерирай официална жалба против решение на ТЕЛК комисия до Районен съд.

Правна рамка за цитиране:
- АПК чл.145 и следващите — обжалване на административни актове
- НМЕ (Наредба за медицинска експертиза) — критерии за оценка
- ЗИХУ чл.68-72 — права при обжалване
- ЗЗ (Закон за здравето) чл.112 — медицинска експертиза

Структура на жалбата:
До: [съд по местоживеене]
Чрез: ТЕЛК при [лечебно заведение]
От: [жалбоподател]
ЕГН: _______________
Адрес: _______________

ЖАЛБА
против Решение № ___ / ___ г. на ТЕЛК

Правила:
- Официален правен стил
- Конкретни правни основания с членове
- Ясно формулирани искания
- Само чист текст, без markdown
- Дата: ${new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}`

export async function generateAppeal(input: AppealInput): Promise<string> {
  const prompt = `${APPEAL_PROMPT}

Данни:
- Жалбоподател: ${input.applicantName}
- Град на ТЕЛК комисията: ${input.telkCity}
- Получена оценка: ${input.receivedPercent}%
- Очаквана справедлива оценка: ${input.expectedPercent}%
- Диагноза: ${input.diagnosisDescription}
- Основания за обжалване: ${input.groundsForAppeal}
${input.missingDocuments ? `- Непризнати документи/обстоятелства: ${input.missingDocuments}` : ''}

Генерирай пълната жалба:`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

export async function generateEmployerLetter(input: EmployerLetterInput): Promise<string> {
  const accommodationLabels: Record<string, string> = {
    leave: 'допълнителен платен отпуск от минимум 25 работни дни (КТ чл.319)',
    hours: 'намалено работно време (КТ чл.137)',
    dismissal: 'писмено потвърждение на закрилата срещу уволнение (КТ чл.333)',
    adaptation: 'адаптация на работното място (ЗИХУ чл.39)',
    parking: 'достъп до паркомясто за хора с увреждания на територията на предприятието',
  }

  const requestedItems = input.accommodations
    .map((a) => `- ${accommodationLabels[a] ?? a}`)
    .join('\n')

  const prompt = `${EMPLOYER_LETTER_PROMPT}

Данни:
- Служител: ${input.employeeName}
- Работодател: ${input.employerName}
- Процент трайна неработоспособност: ${input.percent}%
- Исканите облекчения:
${requestedItems}
${input.notes ? `- Допълнителни обстоятелства: ${input.notes}` : ''}

Генерирай пълното писмо:`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

export async function analyseDocument(text: string): Promise<AnalysisResult> {
  const prompt = `${SYSTEM_PROMPT}\n\nАнализирай следния медицински документ:\n\n${text.slice(0, 12000)}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  try {
    return JSON.parse(extractJson(raw)) as AnalysisResult
  } catch {
    throw new Error('Gemini returned invalid JSON: ' + raw.slice(0, 200))
  }
}

// Analyse a document via the Gemini Files API — handles any file size,
// works with both text-based and scanned PDFs.
export async function analyseDocumentBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<AnalysisResult> {
  const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1] ?? 'bin'
  const tmpPath = join(tmpdir(), `telk-doc-${randomUUID()}.${ext}`)

  await writeFile(tmpPath, buffer)

  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!)
  let geminiFileName: string | undefined

  try {
    const upload = await fileManager.uploadFile(tmpPath, { mimeType, displayName: 'medical-document' })
    geminiFileName = upload.file.name

    // Poll until the file is fully processed on Gemini's side
    let geminiFile = upload.file
    while (geminiFile.state === FileState.PROCESSING) {
      await new Promise((r) => setTimeout(r, 2000))
      geminiFile = await fileManager.getFile(geminiFile.name)
    }
    if (geminiFile.state !== FileState.ACTIVE) {
      throw new Error(`Gemini file processing failed with state: ${geminiFile.state}`)
    }

    const result = await model.generateContent([
      { fileData: { fileUri: geminiFile.uri, mimeType } },
      SYSTEM_PROMPT + '\n\nАнализирай прикачения медицински документ:',
    ])

    const raw = result.response.text()
    try {
      return JSON.parse(extractJson(raw)) as AnalysisResult
    } catch {
      throw new Error('Gemini returned invalid JSON: ' + raw.slice(0, 200))
    }
  } finally {
    await unlink(tmpPath).catch(() => {})
    if (geminiFileName) await fileManager.deleteFile(geminiFileName).catch(() => {})
  }
}
