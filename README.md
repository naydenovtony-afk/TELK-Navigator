# ТЕЛК Навигатор

Уеб + мобилно приложение, което помага на хора с увреждания в България да се ориентират в процеса на медицинска експертиза пред ТЕЛК.

**Live demo:** https://telk-navigator-web.vercel.app/bg

---

## Описание

Процесът пред ТЕЛК (Териториална Експертна Лекарска Комисия) е бюрократично сложен — пациентите трябва да събират специфична медицинска документация, да разбират правата си, да следят срокове и да обжалват несправедливи решения. ТЕЛК Навигатор централизира всички тези нужди в едно приложение.

### Основни функции

| Модул | Описание |
|---|---|
| **AI анализ на документи** | Качи PDF епикриза → AI проверява пълнотата спрямо изискванията на НМЕ |
| **Управление на случаи** | CRUD за ТЕЛК преписки с документи и история |
| **Калкулатор на права** | Въведи % увреждане → всички социални придобивки по КТ и ЗИХУ |
| **Проследяване на срокове** | Напомняния за преосвидетелстване и административни срокове |
| **Писмо до работодател** | AI генерира официално писмо с цитирани членове от КТ |
| **Проверка за пожизнено** | AI анализ по критериите на НМЕ за решение без срок |
| **Прогноза за решение** | Ориентировъчен диапазон на очакваната оценка |
| **Асистент за обжалване** | AI генерира жалба до съда с правни основания по АПК |
| **Администрация** | Управление на потребители и AI prompt модули |
| **Мобилно приложение** | Expo React Native — случаи, срокове, калкулатор на права |

---

## Технологичен стек

### Web (`apps/web`)
- **Framework:** Next.js 14 App Router (TypeScript)
- **Стилове:** Tailwind CSS v4 (`@theme` токени в globals.css)
- **Auth:** Auth.js v5 — Google OAuth (уеб) + Raw JWT (мобилно)
- **База данни:** Neon PostgreSQL + Drizzle ORM
- **Файлово съхранение:** Cloudflare R2 (S3-compatible)
- **AI:** Google Gemini 1.5 Flash (server-side само)
- **i18n:** next-intl (Bulgarian)
- **Deploy:** Vercel

### Mobile (`apps/mobile`)
- **Framework:** Expo + React Native (TypeScript)
- **Навигация:** expo-router
- **Auth:** JWT в expo-secure-store

### Shared (`packages/shared`)
- Споделени TypeScript типове, утилити и константи

---

## Архитектура

```
telk-navigator/
├── apps/
│   ├── web/                    # Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/
│   │   │   │   │   ├── (app)/          # Authenticated pages
│   │   │   │   │   ├── (admin)/        # Admin-only pages
│   │   │   │   │   ├── (auth)/         # Sign-in page
│   │   │   │   │   └── page.tsx        # Public landing page
│   │   │   │   └── api/                # API routes
│   │   │   ├── components/
│   │   │   ├── db/                     # Drizzle schema + client
│   │   │   └── lib/                    # ai.ts, pdf.ts, r2.ts, rights.ts
│   │   └── locales/bg/                 # Bulgarian translations
│   └── mobile/                 # Expo React Native
│       ├── app/
│       │   ├── (tabs)/         # Cases, Deadlines, Rights
│       │   ├── sign-in.tsx
│       │   └── register.tsx
│       └── lib/                # api.ts, auth.tsx
└── packages/
    └── shared/                 # Types, utils, constants
```

### База данни — 12 таблици

| Таблица | Предназначение |
|---|---|
| `users` | Auth.js потребители с роля (patient / admin) |
| `user_preferences` | ТЕЛК ситуация, диагноза категория, настройки |
| `accounts` | Auth.js OAuth акаунти |
| `user_passwords` | bcrypt хашове за мобилен вход |
| `cases` | ТЕЛК преписки (active / submitted / closed) |
| `documents` | PDF документи в R2 с OCR текст |
| `analysis_reports` | AI резултати — covered / incomplete / missing |
| `deadlines` | Срокове с due date и completion статус |
| `prompt_modules` | Редактируеми AI prompt сегменти (админ) |
| `review_tokens` | Токени за споделяне с лекар |
| `document_history` | Audit log на действия върху документи |
| `referrals` | Реферален механизъм |

---

## API Endpoints

### Web (Auth.js сесия)
| Method | Path | Описание |
|---|---|---|
| GET/POST | `/api/cases` | Списък / създаване на случаи |
| PATCH/DELETE | `/api/cases/[id]` | Редактиране / изтриване |
| GET/POST | `/api/documents` | Документи по случай |
| DELETE | `/api/documents/[id]` | Изтриване на документ |
| POST | `/api/documents/[id]/analyse` | AI анализ на PDF |
| POST | `/api/upload/presign` | Presigned URL за R2 |
| GET/POST | `/api/deadlines` | Срокове |
| PATCH/DELETE | `/api/deadlines/[id]` | Редактиране / изтриване |
| POST | `/api/employer-letter` | Генериране на писмо до работодател |
| POST | `/api/lifelong-check` | Проверка за пожизнено ТЕЛК |
| POST | `/api/score-predictor` | Прогноза за ТЕЛК решение |
| POST | `/api/appeal` | Генериране на жалба |
| GET | `/api/admin/users` | Всички потребители (admin) |
| PATCH | `/api/admin/users/[id]` | Смяна на роля (admin) |
| GET/POST | `/api/admin/prompts` | AI prompt модули (admin) |
| PATCH/DELETE | `/api/admin/prompts/[id]` | Редактиране / изтриване (admin) |

### Mobile (JWT Bearer token)
| Method | Path | Описание |
|---|---|---|
| POST | `/api/mobile/auth/register` | Регистрация с email + парола |
| POST | `/api/mobile/auth/login` | Вход — връща JWT (30д.) |
| GET | `/api/mobile/cases` | Случаи на потребителя |
| GET | `/api/mobile/deadlines` | Срокове на потребителя |

---

## Инсталация

### Изисквания
- Node.js ≥ 20
- npm ≥ 10

### Клониране и инсталация
```bash
git clone https://github.com/naydenovtony-afk/TELK-Navigator.git
cd TELK-Navigator
npm install
```

### Среда (environment variables)

Създайте `apps/web/.env.local`:

```env
# Database
DATABASE_URL=postgresql://...

# Auth.js
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudflare R2
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://pub-....r2.dev

# AI
GEMINI_API_KEY=...
```

### Стартиране

```bash
# Web (http://localhost:3000)
npm run dev:web

# Mobile (Expo Go)
npm run dev:mobile
```

### База данни

```bash
cd apps/web
npm run db:generate   # Генерира SQL миграция
npm run db:push       # Прилага към Neon
npm run db:studio     # Drizzle Studio UI
```

---

## Сигурност

- **EGN никога не се съхранява** — само `birthDate` и `isMinor` се извличат и записват
- **GEMINI_API_KEY само на сървъра** — никога в клиентски код
- **Ownership check** на всеки resource endpoint
- **Admin role guard** на всички `/admin/*` routes и API
- **JWT за мобилен достъп** — подписан с `NEXTAUTH_SECRET`, exp. 30 дни

---

## Deploy

Приложението е деплойнато на **Vercel** с Root Directory `apps/web`.

```json
// vercel.json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

Мобилното приложение се тества с **Expo Go** (iOS / Android).

---

## Скрийншоти

| Landing | Dashboard | AI Анализ |
|---|---|---|
| Публична страница с описание | Списък случаи с Badge статуси | PDF → НМЕ проверка |

| Права | Срокове | Admin |
|---|---|---|
| Калкулатор по % увреждане | Срокове с urgency цветове | Управление потребители + промпти |

---

## SoftUni — Full Stack Apps with AI

**Курс:** Full Stack Apps with AI — май 2026  
**Автор:** Антони Найденов  
**Краен срок:** 27 май 2026
