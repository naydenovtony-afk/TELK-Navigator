export interface Benefit {
  id: string
  label: string
  detail: string
  category: 'financial' | 'transport' | 'healthcare' | 'employment' | 'social'
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
    detail: 'Изплаща се от АСП. Размерът зависи от степента на увреждане.',
  },
  {
    id: 'B002',
    minPercent: 50,
    category: 'financial',
    label: 'Данъчно облекчение (ЗДДФЛ)',
    detail: 'Намаление на данъчната основа с 7 920 лв. годишно при подаване на декларация.',
  },
  {
    id: 'B003',
    minPercent: 50,
    category: 'financial',
    label: 'Намаление на данък сгради',
    detail: '50% намаление на данъка върху недвижимите имоти за основно жилище.',
  },
  {
    id: 'B004',
    minPercent: 50,
    category: 'transport',
    label: 'Безплатен градски транспорт',
    detail: 'Безплатно пътуване в обществения транспорт на населеното място по местоживеене.',
  },
  {
    id: 'B005',
    minPercent: 50,
    category: 'healthcare',
    label: 'Безплатни лекарства (по списък)',
    detail: 'Медикаменти за хронични заболявания, включени в позитивния лекарствен списък, се заплащат от НЗОК.',
  },
  {
    id: 'B006',
    minPercent: 50,
    category: 'social',
    label: 'Помощни средства и съоръжения',
    detail: 'Финансиране на помощни технически средства, протези и ортези чрез НЗОК и АСП.',
  },
  // 71%+
  {
    id: 'B007',
    minPercent: 71,
    category: 'transport',
    label: 'Карта за паркиране (Синя карта)',
    detail: 'Право на специален стикер и паркиране на обозначени места за хора с увреждания.',
  },
  {
    id: 'B008',
    minPercent: 71,
    category: 'transport',
    label: '50% намаление на ж.п. билети',
    detail: 'Намаление при пътуване с БДЖ — важи за притежателя на ТЕЛК решение.',
  },
  {
    id: 'B009',
    minPercent: 71,
    category: 'transport',
    label: 'Намаление при въздушен транспорт',
    detail: 'Някои авиокомпании предоставят намаления — проверете при резервация.',
  },
  {
    id: 'B010',
    minPercent: 71,
    category: 'social',
    label: 'Приоритет в социални услуги',
    detail: 'Приоритетен достъп до дневни центрове, домашен помощник и социален асистент.',
  },
  {
    id: 'B011',
    minPercent: 71,
    category: 'financial',
    label: 'Целева помощ за отопление',
    detail: 'Право на целева помощ за отопление при покриване на доходен критерий.',
  },
  // 91%+
  {
    id: 'B012',
    minPercent: 91,
    category: 'social',
    label: 'Личен асистент (до 4 ч/ден)',
    detail: 'Финансирана от държавата услуга за подпомагане при ежедневни дейности.',
  },
  {
    id: 'B013',
    minPercent: 91,
    category: 'employment',
    label: 'Допълнителен платен отпуск — 25 дни',
    detail: 'Работещите с над 91% увреждане имат право на минимум 25 дни платен годишен отпуск.',
  },
  {
    id: 'B014',
    minPercent: 91,
    category: 'financial',
    label: 'Намаление на телефонна такса',
    detail: 'Социална абонаментна такса при фиксирана телефонна линия.',
  },
  {
    id: 'B015',
    minPercent: 91,
    category: 'healthcare',
    label: 'Освобождаване от потребителска такса',
    detail: 'Пълно освобождаване от потребителска такса при посещение на личен лекар и специалист.',
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
