export interface Benefit {
  id: string
  label: string
  detail: string
  category: 'financial' | 'transport' | 'healthcare' | 'employment' | 'social'
  legalRef?: string
  sourceUrl?: string
}

export interface RightsResult {
  percent: number
  tier: 50 | 71 | 91 | null
  tierLabel: string
  benefits: Benefit[]
  monthlyAllowance: number | null
}

const ALL_BENEFITS: (Benefit & { minPercent: number })[] = [
  // 50%+
  {
    id: 'B001',
    minPercent: 50,
    category: 'financial',
    label: 'Месечна добавка за увреждане',
    detail: 'Изплаща се от АСП. Размерът се определя ежегодно с акт на Министерския съвет.',
    legalRef: 'Чл. 70–74 ЗХУ',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B002',
    minPercent: 50,
    category: 'financial',
    label: 'Данъчно облекчение (ЗДДФЛ)',
    detail: 'Намаление на данъчната основа с 7 920 лв. годишно при подаване на декларация.',
    legalRef: 'Чл. 18 ЗДДФЛ',
    sourceUrl: 'https://nap.bg',
  },
  {
    id: 'B003',
    minPercent: 50,
    category: 'financial',
    label: 'Намаление на данък сгради',
    detail: '50% намаление на данъка върху недвижимите имоти за основно жилище.',
    legalRef: 'Чл. 25 ЗМДТ',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B004',
    minPercent: 50,
    category: 'transport',
    label: 'Безплатен градски транспорт',
    detail: 'Безплатно пътуване в обществения транспорт на населеното място по местоживеене.',
    legalRef: 'Чл. 65 ЗХУ',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B005',
    minPercent: 50,
    category: 'healthcare',
    label: 'Безплатни лекарства (по списък)',
    detail: 'Медикаменти за хронични заболявания, включени в позитивния лекарствен списък, се заплащат от НЗОК.',
    legalRef: 'Чл. 45 ЗЗО',
    sourceUrl: 'https://nhif.bg/bg/medicine_food/medical-list/2026',
  },
  {
    id: 'B006',
    minPercent: 50,
    category: 'social',
    label: 'Помощни средства и съоръжения',
    detail: 'Финансиране на помощни технически средства, протези и ортези чрез НЗОК и АСП.',
    legalRef: 'Чл. 68 ЗХУ',
    sourceUrl: 'https://nhif.bg',
  },
  {
    id: 'B016',
    minPercent: 50,
    category: 'employment',
    label: '7-часов работен ден',
    detail: 'Работещите с ТЕЛК решение имат право на намалено работно време от 7 часа при пълна заплата.',
    legalRef: 'Чл. 319 КТ',
    sourceUrl: 'https://gli.government.bg',
  },
  {
    id: 'B017',
    minPercent: 50,
    category: 'employment',
    label: 'Минимум 26 дни платен отпуск',
    detail: 'Работещите с увреждане имат право на не по-малко от 26 работни дни годишен платен отпуск.',
    legalRef: 'Чл. 155, ал. 4 КТ',
    sourceUrl: 'https://gli.government.bg',
  },
  {
    id: 'B018',
    minPercent: 50,
    category: 'employment',
    label: 'Закрила при уволнение',
    detail: 'Работодателят е длъжен да поиска предварително разрешение от Инспекцията по труда преди уволнение.',
    legalRef: 'Чл. 333, ал. 1 КТ',
    sourceUrl: 'https://gli.government.bg',
  },
  // 71%+
  {
    id: 'B007',
    minPercent: 71,
    category: 'transport',
    label: 'Карта за паркиране (Синя карта)',
    detail: 'Право на специален стикер и паркиране на обозначени места за хора с увреждания.',
    legalRef: 'Наредба № РД-02-20-2',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B008',
    minPercent: 71,
    category: 'transport',
    label: '50% намаление на ж.п. билети',
    detail: 'Намаление при пътуване с БДЖ — важи за притежателя на ТЕЛК решение.',
    legalRef: 'Чл. 66 ЗХУ',
    sourceUrl: 'https://bdz.bg',
  },
  {
    id: 'B009',
    minPercent: 71,
    category: 'transport',
    label: 'Намаление при въздушен транспорт',
    detail: 'Право на помощ и настаняване при въздушно пътуване съгласно европейски регламент.',
    legalRef: 'Регл. (ЕО) 1107/2006',
    sourceUrl: 'https://transport.ec.europa.eu',
  },
  {
    id: 'B010',
    minPercent: 71,
    category: 'social',
    label: 'Приоритет в социални услуги',
    detail: 'Приоритетен достъп до дневни центрове, домашен помощник и социален асистент.',
    legalRef: 'Чл. 18 ЗСУ',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B011',
    minPercent: 71,
    category: 'financial',
    label: 'Целева помощ за отопление',
    detail: 'Право на целева помощ за отопление при покриване на доходен критерий.',
    legalRef: 'ЗСПД',
    sourceUrl: 'https://asp.government.bg',
  },
  // 91%+
  {
    id: 'B012',
    minPercent: 91,
    category: 'social',
    label: 'Личен асистент (до 4 ч/ден)',
    detail: 'Финансирана от държавата услуга за подпомагане при ежедневни дейности.',
    legalRef: 'Чл. 75 ЗХУ',
    sourceUrl: 'https://asp.government.bg',
  },
  {
    id: 'B013',
    minPercent: 91,
    category: 'financial',
    label: 'Надбавка за постоянна чужда помощ',
    detail: 'Допълнителна надбавка за лица, нуждаещи се от постоянни грижи от друго лице — отразено в ТЕЛК решението.',
    legalRef: 'Чл. 103 КСО',
    sourceUrl: 'https://noi.bg',
  },
  {
    id: 'B014',
    minPercent: 91,
    category: 'financial',
    label: 'Намаление на телефонна такса',
    detail: 'Социална абонаментна такса при фиксирана телефонна линия.',
    legalRef: 'Наредба на КРС',
    sourceUrl: 'https://crc.bg',
  },
  {
    id: 'B015',
    minPercent: 91,
    category: 'healthcare',
    label: 'Освобождаване от потребителска такса',
    detail: 'Пълно освобождаване от потребителска такса при посещение на личен лекар и специалист.',
    legalRef: 'Чл. 37 ЗЗО',
    sourceUrl: 'https://nhif.bg',
  },
]

// Monthly allowance amounts in BGN (approximate, based on current legislation)
function calcMonthlyAllowance(percent: number): number | null {
  if (percent < 50) return null
  if (percent >= 91) return 225
  if (percent >= 71) return 150
  return 75
}

function getTier(percent: number): 50 | 71 | 91 | null {
  if (percent >= 91) return 91
  if (percent >= 71) return 71
  if (percent >= 50) return 50
  return null
}

function getTierLabel(tier: 50 | 71 | 91 | null): string {
  if (!tier) return 'Под минималния праг (50%)'
  if (tier === 91) return 'Тежко увреждане (91–100%)'
  if (tier === 71) return 'Значително увреждане (71–90%)'
  return 'Умерено увреждане (50–70%)'
}

export function calculateRights(percent: number): RightsResult {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const tier = getTier(clamped)
  const benefits = ALL_BENEFITS.filter((b) => clamped >= b.minPercent).map(
    ({ minPercent: _, ...b }) => b
  )

  return {
    percent: clamped,
    tier,
    tierLabel: getTierLabel(tier),
    benefits,
    monthlyAllowance: calcMonthlyAllowance(clamped),
  }
}

export const BENEFIT_CATEGORIES: Record<Benefit['category'], string> = {
  financial: 'Финансови',
  transport: 'Транспорт',
  healthcare: 'Здравеопазване',
  employment: 'Трудови права',
  social: 'Социални услуги',
}
