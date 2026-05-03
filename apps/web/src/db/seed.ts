import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ── Demo users ────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { email: 'demo@telk.bg', name: 'Иван Петров', password: 'Demo1234!', role: 'patient' as const },
  { email: 'admin@telk.bg', name: 'Администратор', password: 'Admin1234!', role: 'admin' as const },
]

// ── NME modules ───────────────────────────────────────────────────────────────

const NME_MODULES = [
  {
    categoryCode: 'ODA',
    name: 'Опорно-двигателна система',
    version: '1.0.0',
    nmeSource: 'НМЕ Приложение 2, т.1',
    content: `Критерии за оценка на трайна неработоспособност при заболявания на опорно-двигателната система:

I. Необходими документи:
- Епикриза от ортопедична/ревматологична клиника
- Рентгенографии на засегнатите стави (задължително)
- Резултати от ЯМР или КТ (при наличие)
- Функционален статус — обективна оценка на обем на движения
- Консултация с физиотерапевт

II. Критерии за процент неработоспособност:
- 25–49%: Умерено ограничение на движенията в 1-2 стави, без значимо влияние върху самообслужването
- 50–70%: Значимо ограничение, затруднено ходене/стоене, частична зависимост от помощни средства
- 71–90%: Тежко ограничение, нужда от помощни средства (бастун, проходилка), затруднено самообслужване
- 91–100%: Невъзможност за самостоятелно придвижване, пълна зависимост

III. Специфични условия:
- Ендопротезиране — минимум 50% за 2 години след операция
- Ампутация на долен крайник — минимум 71%
- Тотална анкилоза на тазобедрена става — минимум 71%`,
  },
  {
    categoryCode: 'NS',
    name: 'Нервна система',
    version: '1.0.0',
    nmeSource: 'НМЕ Приложение 2, т.3',
    content: `Критерии за оценка на трайна неработоспособност при неврологични заболявания:

I. Необходими документи:
- Епикриза от неврологична клиника
- ЯМР на главен и/или гръбначен мозък
- Електромиография (ЕМГ) при периферни увреждания
- Неврологичен статус с оценка по скали (Barthel, EDSS при МС)
- Консултация с неврохирург (при показания)

II. Критерии за процент неработоспособност:
- 25–49%: Лека пареза, минимален неврологичен дефицит, запазена самостоятелност
- 50–70%: Умерена хемипареза/парапареза, затруднена фина моторика, частични когнитивни нарушения
- 71–90%: Тежка пареза/плегия на крайник, значими когнитивни нарушения, епилепсия с чести пристъпи
- 91–100%: Тетраплегия, вегетативно състояние, пълна зависимост от грижи`,
  },
  {
    categoryCode: 'CVS',
    name: 'Сърдечно-съдова система',
    version: '1.0.0',
    nmeSource: 'НМЕ Приложение 2, т.2',
    content: `Критерии за оценка на трайна неработоспособност при сърдечно-съдови заболявания:

I. Необходими документи:
- Епикриза от кардиологична клиника
- ЕКГ (задължително, не по-стара от 3 месеца)
- Ехокардиография с ФИ (фракция на изтласкване)
- Холтер ЕКГ (при аритмии)
- Резултати от стрес-тест или коронарография

II. Критерии за процент неработоспособност:
- 25–49%: ФИ 45–55%, NYHA клас II, добре контролирана хипертония с органни увреждания
- 50–70%: ФИ 35–44%, NYHA клас III, значима валвулопатия, имплантиран пейсмейкър
- 71–90%: ФИ < 35%, NYHA клас III–IV, тежка СН, ритъмни нарушения с ИКД
- 91–100%: ФИ < 25%, NYHA клас IV, рефрактерна СН, пълна зависимост`,
  },
]

// ── Prompt modules ────────────────────────────────────────────────────────────

const PROMPT_MODULES = [
  {
    key: 'analyse_document',
    content: `Ти си медицински анализатор за нуждите на ТЕЛК (Териториална Експертна Лекарска Комисия) в България.
Анализираш медицински документи (епикризи, амбулаторни листове и др.) и проверяваш дали съдържат необходимите елементи съгласно Наредбата за медицинска експертиза (НМЕ).

Върни САМО валиден JSON обект в следния формат:
{
  "nmeModuleVersion": "1.0.0",
  "documentsOnFile": <брой на добре документираните елементи>,
  "documentsTotal": <общ брой проверявани НМЕ елементи>,
  "covered": [<елементи, ясно документирани>],
  "incomplete": [{ "id": "<код>", "label": "<наименование>", "note": "<какво липсва>" }],
  "missing": [{ "id": "<код>", "label": "<наименование>", "reason": "<защо се счита за липсващо>" }],
  "patientSummary": "<2-3 изречения на разбираем български за пациента>",
  "doctorSummary": "<клинично резюме за лекаря>",
  "icd10Code": "<основен МКБ-10 код или null>",
  "scorePrediction": { "min": 0, "max": 0, "note": "" }
}

НМЕ елементи: D001 Основна диагноза с МКБ-10, D002 Придружаващи заболявания, D003 Давност, D004 Лечение, D005 Функционален статус, D006 Параклиника, D007 Консултации, D008 Прогноза, D009 Препоръки, D010 Подпис и печат`,
  },
  {
    key: 'employer_letter',
    content: `Ти си правен асистент, специализиран в трудовото право на България.
Генерирай официално писмо до работодател от служител с трайно намалена работоспособност, установена от ТЕЛК.

Правила: официален делови стил, цитирай членове от КТ и ЗИХУ, структура: град/дата → До → Относно → Уважаеми/а → текст → С уважение, само чист текст.

Правни основания: 50%+: КТ чл.319, КТ чл.333, ЗИХУ чл.35 | 71%+: + КТ чл.137, КТ чл.140 | 91%+: + ЗИХУ чл.39`,
  },
  {
    key: 'lifelong_check',
    content: `Ти си експерт по медицинска експертиза в България, специализиран в НМЕ.
Анализирай дали пациентът отговаря на критериите за пожизнено ТЕЛК решение.

Критерии: 1) Пенсионна възраст с 50%+, 2) Необратими морфологични увреждания, 3) Прогресиращи дегенеративни заболявания (напреднал стадий), 4) 91%+ с необратими увреждания, 5) Онкология в ремисия 5г.+ с 71%+.

Върни САМО JSON: { "verdict": "likely|possible|unlikely", "verdictLabel": "...", "explanation": "...", "criteria": [{"met": bool, "label": "...", "detail": "..."}], "recommendation": "...", "legalBasis": "..." }`,
  },
  {
    key: 'score_predictor',
    content: `Ти си експерт по медицинска експертиза в България с познания по НМЕ и практиката на ТЕЛК.
Анализирай описаното увреждане и оцени очаквания диапазон на трайна неработоспособност.

Върни САМО JSON: { "rangeMin": 0-100, "rangeMax": 0-100, "rangeLabel": "...", "keyFactors": { "positive": [...], "negative": [...] }, "documentationTips": [...], "summary": "..." }

Важно: НЕ използвай думите 'шанс' или 'вероятност'. Използвай 'очаквана оценка' или 'диапазон'.`,
  },
  {
    key: 'appeal',
    content: `Ти си правен асистент, специализиран в административното право и медицинската експертиза в България.
Генерирай официална жалба против решение на ТЕЛК до Районен съд.

Правна рамка: АПК чл.145+, НМЕ критерии, ЗИХУ чл.68-72, ЗЗ чл.112.
Структура: До → Чрез ТЕЛК → От → ЖАЛБА → основен текст с правни основания → искания.
Само чист текст, официален правен стил, конкретни членове.`,
  },
]

// ── Demo patient data ─────────────────────────────────────────────────────────

// Realistic pre-seeded sample data for the demo patient (Иван Петров)
// Documents point to placeholder R2 keys — analysis reports are pre-populated
// so examiners can see the full AI analysis UI without uploading files.

const DEMO_CASES = [
  { title: 'ТЕЛК преосвидетелстване 2026', status: 'active' as const },
  { title: 'Обжалване на решение 2025', status: 'active' as const },
]

const DEMO_DOCUMENTS = [
  {
    caseIndex: 0,
    fileName: 'Кардиологична епикриза — УМБАЛ Александровска.pdf',
    fileKey: 'demo/cardiologia-epicrisis-2025.pdf',
    mimeType: 'application/pdf',
    icd10Code: 'I50.0',
    status: 'ready' as const,
    analysis: {
      nmeModuleVersion: '1.0.0',
      documentsOnFile: 8,
      documentsTotal: 10,
      confidence: 0.8,
      covered: [
        'D001: Основна диагноза с МКБ-10 код',
        'D002: Придружаващи заболявания',
        'D003: Давност на заболяването',
        'D004: Проведено лечение',
        'D006: Параклинични изследвания',
        'D007: Специализирани консултации',
        'D008: Прогноза / динамика',
        'D009: Препоръки за бъдещо лечение',
      ],
      incomplete: [
        {
          id: 'D005',
          label: 'Функционален статус / степен на ограничение',
          note: 'Описани са симптоми при усилие (NYHA клас III), но липсва стандартизирана функционална оценка по скала, необходима за ТЕЛК.',
        },
      ],
      missing: [
        {
          id: 'D010',
          label: 'Подпис и печат на лекар / лечебно заведение',
          reason: 'Документът е в електронен формат без видим квалифициран електронен подпис или мокър печат.',
        },
      ],
      patientSummary:
        'Документът е епикриза от кардиологична клиника за хронична сърдечна недостатъчност (ФИ 38%, NYHA III). Повечето необходими елементи за ТЕЛК са налице — диагноза, лечение, изследвания и консултации. Липсват само стандартизираната функционална оценка и физически подпис.',
      doctorSummary:
        'Епикриза от УМБАЛ „Александровска" — ХСН с редуцирана ФИ (38%), NYHA клас III. Основна диагноза I50.0 с МКБ-10 код. Придружаващи: артериална хипертония, захарен диабет тип 2. Проведена терапия: бисопролол, еналаприл, торасемид. ЕхоКГ и Холтер ЕКГ са приложени. Липсва обективизирана NYHA/функционална скала и физически подпис/печат.',
      scorePrediction: {
        min: 50,
        max: 71,
        note: 'ФИ 38% с NYHA III съответства на диапазон 50–71% по НМЕ критерии за сърдечно-съдова система.',
      },
    },
  },
  {
    caseIndex: 0,
    fileName: 'Ортопедичен преглед — коляно и тазобедрена става.pdf',
    fileKey: 'demo/orthopedics-2025.pdf',
    mimeType: 'application/pdf',
    icd10Code: 'M16.1',
    status: 'ready' as const,
    analysis: {
      nmeModuleVersion: '1.0.0',
      documentsOnFile: 6,
      documentsTotal: 10,
      confidence: 0.6,
      covered: [
        'D001: Основна диагноза с МКБ-10 код',
        'D003: Давност на заболяването',
        'D004: Проведено лечение',
        'D006: Параклинични изследвания',
        'D007: Специализирани консултации',
        'D010: Подпис и печат на лекар / лечебно заведение',
      ],
      incomplete: [
        {
          id: 'D005',
          label: 'Функционален статус / степен на ограничение',
          note: 'Описани са болки при ходене, но липсва обективна оценка на обема на движение (гониометрия) и функционален клас.',
        },
        {
          id: 'D008',
          label: 'Прогноза / динамика',
          note: 'Посочено е „хронично прогресиращо", но без конкретна прогноза за работоспособност.',
        },
      ],
      missing: [
        {
          id: 'D002',
          label: 'Придружаващи заболявания',
          reason: 'Документът не съдържа информация за придружаващи заболявания, което е задължително за комплексна ТЕЛК оценка.',
        },
        {
          id: 'D009',
          label: 'Препоръки за бъдещо лечение',
          reason: 'Липсват конкретни препоръки за рехабилитация или оперативно лечение.',
        },
      ],
      patientSummary:
        'Документът е амбулаторен лист от ортопед за двустранна коксартроза (артроза на тазобедрена става). Около половината от необходимите ТЕЛК елементи са налице. Основните пропуски са липсата на функционална оценка с числова скала и препоръки за бъдещо лечение.',
      doctorSummary:
        'Амбулаторен лист — двустранна коксартроза II–III ст. (M16.1), хронично протичане с периодични обостряния. Рентгенография приложена. Проведена консервативна терапия. Липсват: гониометрична оценка, придружаващи заболявания, прогноза за работоспособност, препоръки.',
      scorePrediction: {
        min: 40,
        max: 60,
        note: 'Коксартроза II–III ст. с описани болки при ходене съответства на диапазон 40–60% при пълна документация.',
      },
    },
  },
  {
    caseIndex: 1,
    fileName: 'Неврологична епикриза — исхемичен инсулт.pdf',
    fileKey: 'demo/neurology-stroke-2024.pdf',
    mimeType: 'application/pdf',
    icd10Code: 'I63.5',
    status: 'ready' as const,
    analysis: {
      nmeModuleVersion: '1.0.0',
      documentsOnFile: 9,
      documentsTotal: 10,
      confidence: 0.9,
      covered: [
        'D001: Основна диагноза с МКБ-10 код',
        'D002: Придружаващи заболявания',
        'D003: Давност на заболяването',
        'D004: Проведено лечение',
        'D005: Функционален статус / степен на ограничение',
        'D006: Параклинични изследвания',
        'D007: Специализирани консултации',
        'D008: Прогноза / динамика',
        'D010: Подпис и печат на лекар / лечебно заведение',
      ],
      incomplete: [
        {
          id: 'D009',
          label: 'Препоръки за бъдещо лечение',
          note: 'Препоръките са общи („продължаване на рехабилитация"), без конкретна програма или цели.',
        },
      ],
      missing: [],
      patientSummary:
        'Това е много добре документирана епикриза след исхемичен инсулт. Почти всички изисквания за ТЕЛК са изпълнени — диагноза, лечение, функционален статус и прогноза са ясно описани. Само препоръките за бъдещо лечение са леко непълни.',
      doctorSummary:
        'Епикриза след исхемичен инсулт (I63.5) с остатъчна дясна хемипареза. Barthel индекс: 65/100. ЯМР с данни за левостранен исхемичен огнище. Проведена тромболиза. Рехабилитация в ход. Придружаващи: АХ, ФП. Функционален статус добре документиран. Прогноза: частично възстановяване. Препоръките са неспецифични.',
      scorePrediction: {
        min: 71,
        max: 90,
        note: 'Хемипареза с Barthel 65/100 при инсулт с остатъчен дефицит > 6 месеца съответства на 71–90% по НМЕ.',
      },
    },
  },
]

const DEMO_DEADLINES = [
  {
    label: 'Подаване на документи за ТЕЛК преосвидетелстване',
    daysFromNow: 14,
  },
  {
    label: 'Краен срок за обжалване на решение от 2025 г.',
    daysFromNow: 7,
  },
  {
    label: 'Преосвидетелстване — насрочена дата',
    daysFromNow: 45,
  },
]

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding database...\n')

  // Users & passwords
  for (const u of DEMO_USERS) {
    let user = await db.query.users.findFirst({ where: eq(schema.users.email, u.email) })

    if (!user) {
      ;[user] = await db
        .insert(schema.users)
        .values({ email: u.email, name: u.name, role: u.role })
        .returning()

      const hash = await bcrypt.hash(u.password, 12)
      await db.insert(schema.userPasswords).values({ userId: user.id, hash })
      console.log(`  seeded user ${u.email} (${u.role})`)
    } else {
      console.log(`  skip  user ${u.email} (already exists)`)
    }

    if (u.role !== 'patient') continue

    const userId = user.id

    // Cases — idempotent by title
    const caseIds: string[] = []
    for (const c of DEMO_CASES) {
      let caseRow = await db.query.cases.findFirst({
        where: and(eq(schema.cases.userId, userId), eq(schema.cases.title, c.title)),
      })
      if (!caseRow) {
        ;[caseRow] = await db
          .insert(schema.cases)
          .values({ userId, title: c.title, status: c.status })
          .returning()
        console.log(`  seeded case: "${c.title}"`)
      } else {
        console.log(`  skip  case: "${c.title}" (already exists)`)
      }
      caseIds.push(caseRow.id)
    }

    // Documents + analysis reports — idempotent by fileKey
    for (const d of DEMO_DOCUMENTS) {
      const caseId = caseIds[d.caseIndex]

      let doc = await db.query.documents.findFirst({
        where: eq(schema.documents.fileKey, d.fileKey),
      })

      if (!doc) {
        ;[doc] = await db
          .insert(schema.documents)
          .values({
            caseId,
            fileKey: d.fileKey,
            fileName: d.fileName,
            mimeType: d.mimeType,
            icd10Code: d.icd10Code,
            status: d.status,
          })
          .returning()
        console.log(`  seeded document: "${d.fileName}"`)
      } else {
        console.log(`  skip  document: "${d.fileName}" (already exists)`)
      }

      // Analysis report — idempotent by documentId
      const existingReport = await db.query.analysisReports.findFirst({
        where: eq(schema.analysisReports.documentId, doc.id),
      })
      if (!existingReport) {
        await db.insert(schema.analysisReports).values({
          documentId: doc.id,
          nmeModuleVersion: d.analysis.nmeModuleVersion,
          documentsOnFile: d.analysis.documentsOnFile,
          documentsTotal: d.analysis.documentsTotal,
          confidence: d.analysis.confidence,
          covered: d.analysis.covered,
          incomplete: d.analysis.incomplete,
          missing: d.analysis.missing,
          patientSummary: d.analysis.patientSummary,
          doctorSummary: d.analysis.doctorSummary,
          scorePrediction: d.analysis.scorePrediction,
        })
        console.log(`    seeded analysis report (${d.analysis.documentsOnFile}/${d.analysis.documentsTotal})`)
      } else {
        console.log(`    skip  analysis report (already exists)`)
      }
    }

    // Deadlines — idempotent by label
    const now = new Date()
    for (const dl of DEMO_DEADLINES) {
      const existing = await db.query.deadlines.findFirst({
        where: and(eq(schema.deadlines.userId, userId), eq(schema.deadlines.label, dl.label)),
      })
      if (!existing) {
        await db.insert(schema.deadlines).values({
          userId,
          label: dl.label,
          dueAt: new Date(now.getTime() + dl.daysFromNow * 24 * 60 * 60 * 1000),
        })
        console.log(`  seeded deadline: "${dl.label}"`)
      } else {
        console.log(`  skip  deadline: "${dl.label}" (already exists)`)
      }
    }
  }

  // NME modules
  for (const m of NME_MODULES) {
    const existing = await db.query.nmeModules.findFirst({
      where: eq(schema.nmeModules.categoryCode, m.categoryCode),
    })
    if (existing) {
      console.log(`  skip  NME module ${m.categoryCode}`)
      continue
    }
    await db.insert(schema.nmeModules).values(m)
    console.log(`  seeded NME module: ${m.categoryCode} — ${m.name}`)
  }

  // Prompt modules
  for (const p of PROMPT_MODULES) {
    const existing = await db.query.promptModules.findFirst({
      where: eq(schema.promptModules.key, p.key),
    })
    if (existing) {
      console.log(`  skip  prompt module "${p.key}"`)
      continue
    }
    await db.insert(schema.promptModules).values(p)
    console.log(`  seeded prompt module: ${p.key}`)
  }

  console.log('\nSeed complete.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
