import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as AnalysisResult
  } catch {
    throw new Error('Gemini returned invalid JSON: ' + raw.slice(0, 200))
  }
}
