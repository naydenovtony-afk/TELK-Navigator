# TELK Navigator

A multi-platform SaaS app (web + mobile) that helps Bulgarian patients navigate the ТЕЛК (medical expertise commission) process — documentation preparation, disability rights lookup, deadline tracking, and AI-assisted appeal generation.

Built as a SoftUni capstone project — May 2026.

---

## Features

### Web App
- Google OAuth + email/password sign-in (Auth.js v5)
- Dashboard with active cases and upcoming deadlines
- Document upload to Cloudflare R2 with AI analysis (Gemini 2.5 Flash)
- NME module-based completeness report — no "score" or "probability" language
- Rights lookup filtered by ТЕЛК percentage
- AI-generated appeal letter (full Bulgarian legal language)
- Admin panel — user management, role assignment
- Settings — profile, preferences, password change
- i18n: Bulgarian (default) + English via next-intl

### Mobile App (Expo)
- JWT-based auth (30-day tokens, stored in SecureStore)
- Cases management — type, diagnoses, previous %, appeal reason, commission decision
- Document viewer with image preview and share sheet
- Score predictor — multi-select diagnoses, per-type document counters
- Rights screen filtered by saved ТЕЛК %
- AI appeal generator with shareable output
- Settings — profile edit, ТЕЛК % preference, password change

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 15 App Router (TypeScript) |
| CSS | Tailwind CSS v4 |
| Mobile | Expo 52 + React Native (expo-router) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth (web) | Auth.js v5 — sessions + Google OAuth |
| Auth (mobile) | Raw JWT — HS256 via jose |
| Storage | Cloudflare R2 (S3-compatible) |
| AI | Google Gemini 2.5 Flash |
| Testing | Jest 30 + @swc/jest (web API unit tests) |
| Deployment | Vercel (web) + Expo Go / EAS (mobile) |

---

## Monorepo Structure

```
telk-navigator/
  apps/
    web/          → Next.js app (this package)
    mobile/       → Expo React Native app
  packages/
    shared/       → Shared TypeScript types and utilities
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Web

```bash
cd apps/web
npm install
cp .env.local.example .env.local   # fill in the required vars
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Environment Variables (web)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for Auth.js sessions and mobile JWT signing |
| `NEXTAUTH_URL` | Public URL of the web app |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL for R2 objects |
| `GEMINI_API_KEY` | Google AI Studio API key |

### Mobile

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to point to the web app (defaults to the Vercel production URL).

---

## Database

Schema lives in `apps/web/src/db/schema/`. After any schema change:

```bash
cd apps/web
npx drizzle-kit generate   # creates migration SQL in drizzle/
npx drizzle-kit push       # applies to Neon (dev/prod)
```

Always commit the generated migration file.

**13 tables:** users · userPreferences · accounts · userPasswords · cases · documents · analysisReports · reviewTokens · documentHistory · deadlines · promptModules · nmeModules · referrals

---

## Running Tests

```bash
cd apps/web
npm test              # run all tests
npm run test:coverage # with coverage report
```

Test files live in `src/__tests__/`. Coverage collected from `src/lib/**/*.ts`.

**Current coverage:** 103 tests across 10 suites — API routes (auth, cases, documents, admin, password change), lib utilities (session, mobile-auth, rights), and Zod schema validation.

---

## API Overview

### Web (session auth via Auth.js)
| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/cases` | List / create cases |
| PATCH/DELETE | `/api/cases/[id]` | Update / delete a case |
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Create document record |
| POST | `/api/upload/presign` | Get R2 presigned upload URL |
| POST | `/api/appeal` | Generate AI appeal letter |
| PATCH | `/api/profile/password` | Change password |
| PATCH | `/api/preferences` | Save user preferences |

### Mobile (Bearer JWT)
| Method | Path | Description |
|---|---|---|
| POST | `/api/mobile/auth/login` | Login → JWT |
| POST | `/api/mobile/auth/register` | Register → JWT |
| GET/POST | `/api/mobile/cases` | Cases |
| PATCH/DELETE | `/api/mobile/cases/[id]` | Update / delete case |
| GET/POST | `/api/mobile/documents` | Documents |
| POST | `/api/mobile/upload/presign` | Presigned upload |
| POST | `/api/mobile/appeal` | AI appeal generation |
| GET | `/api/mobile/profile` | Get profile |
| PATCH | `/api/mobile/profile` | Update name |
| PATCH | `/api/mobile/profile/password` | Change password |
| GET | `/api/mobile/deadlines` | List deadlines |
| POST | `/api/mobile/deadlines` | Create deadline |
| PATCH/DELETE | `/api/mobile/deadlines/[id]` | Toggle / delete deadline |
| GET | `/api/mobile/admin/users` | Admin — list users |

---

## Commit Convention

```
feat:     new functionality
fix:      bug fix
refactor: no functional change
style:    UI/CSS only
docs:     documentation
chore:    build, deps, config
```

---

TELK Navigator © 2026 — SoftUni Capstone Project
