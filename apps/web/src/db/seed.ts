import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ── Demo users ────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { email: 'demo@telk.bg', name: 'Демо Пациент', password: 'Demo1234!', role: 'patient' as const },
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
- Нeврологичен статус с оценка по скали (Barthel, EDSS при МС)
- Консултация с неврохирург (при показания)

II. Критерии за процент неработоспособност:
- 25–49%: Лека пареза, минимален неврологичен дефицит, запазена самостоятелност
- 50–70%: Умерена хемипареза/парапареза, затруднена фина моторика, частични когнитивни нарушения
- 71–90%: Тежка пареза/плегия на крайник, значими когнитивни нарушения, епилепсия с чести пристъпи
- 91–100%: Тетраплегия, вегетативно състояние, пълна зависимост от грижи

III. Специфични условия:
- Множествена склероза — по EDSS скала (EDSS 6.0+ = минимум 71%)
- Паркинсонова болест — стадий 3+ по Hoehn-Yahr = минимум 71%
- Инсулт с остатъчен дефицит — оценка минимум 6 месеца след инцидента`,
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
- Доплер ехография (при съдови заболявания)
- Резултати от стрес-тест или коронарография

II. Критерии за процент неработоспособност:
- 25–49%: ФИ 45–55%, NYHA клас II, добре контролирана хипертония с органни увреждания
- 50–70%: ФИ 35–44%, NYHA клас III, значима валвулопатия, имплантиран пейсмейкър
- 71–90%: ФИ < 35%, NYHA клас III–IV, тежка СН, ритъмни нарушения с ИКД
- 91–100%: ФИ < 25%, NYHA клас IV, рефрактерна СН, пълна зависимост

III. Специфични условия:
- След сърдечна трансплантация — минимум 71% за 2 години
- Имплантиран ИКД — минимум 71%
- Аортна стеноза/недостатъчност III–IV ст. — минимум 50%`,
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

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding database...\n')

  // Users & passwords
  for (const u of DEMO_USERS) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, u.email) })
    if (existing) {
      console.log(`  skip  user ${u.email} (already exists)`)
      continue
    }

    const [user] = await db
      .insert(schema.users)
      .values({ email: u.email, name: u.name, role: u.role })
      .returning()

    const hash = await bcrypt.hash(u.password, 12)
    await db.insert(schema.userPasswords).values({ userId: user.id, hash })

    // Sample case for demo patient
    if (u.role === 'patient') {
      const [c1] = await db
        .insert(schema.cases)
        .values({ userId: user.id, title: 'ТЕЛК преосвидетелстване 2026', status: 'active' })
        .returning()
      const [c2] = await db
        .insert(schema.cases)
        .values({ userId: user.id, title: 'Обжалване на решение 2025', status: 'active' })
        .returning()

      console.log(`  seeded cases: "${c1.title}", "${c2.title}"`)

      const now = new Date()
      await db.insert(schema.deadlines).values([
        {
          userId: user.id,
          label: 'Подаване на документи за ТЕЛК',
          dueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          label: 'Преосвидетелстване — крайна дата',
          dueAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        },
      ])
      console.log('  seeded 2 deadlines')
    }

    console.log(`  seeded user ${u.email} (${u.role})`)
  }

  // NME modules
  for (const m of NME_MODULES) {
    const existing = await db.query.nmeModules.findFirst({
      where: eq(schema.nmeModules.categoryCode, m.categoryCode),
    })
    if (existing) {
      console.log(`  skip  NME module ${m.categoryCode} (already exists)`)
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
      console.log(`  skip  prompt module "${p.key}" (already exists)`)
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
