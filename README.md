# TELK Navigator

A multi-platform web + mobile application that helps Bulgarian patients navigate the ТЕЛК (Territorial Expert Medical Commission) medical disability assessment process.

**Live demo:** https://telk-navigator-web.vercel.app/bg  
**Sample credentials:** demo@telk.bg / demo123

---

## 1. Project Description

The ТЕЛК process in Bulgaria is bureaucratically complex — patients must gather specific medical documentation, understand their rights, track deadlines, and appeal unfair decisions. TELK Navigator centralises all of these needs in one application.

### Features

| Module | Description |
|--------|-------------|
| **AI Document Analysis** | Upload a PDF or image → AI checks completeness against the National Medical Expertise (NME) checklist |
| **Case Management** | Full CRUD for ТЕЛК cases, each with documents and status tracking |
| **Rights Calculator** | Enter a disability percentage → see all entitled labour rights under the Labour Code and ZIHU |
| **Deadline Tracker** | Reminders for re-examination dates and administrative deadlines with colour-coded urgency |
| **Employer Letter Generator** | AI generates an official letter citing specific articles of the Labour Code |
| **Lifelong Decision Checker** | AI analysis against NME criteria for a decision without re-examination deadline |
| **Score Predictor** | Estimated range of the expected disability assessment percentage |
| **Appeal Assistant** | AI generates a court appeal letter with legal grounds under the APC |
| **Admin Panel** | Manage user roles and AI prompt templates |
| **Mobile App** | Expo React Native — cases, deadlines, rights calculator, document upload |

### User roles

| Role | Capabilities |
|------|-------------|
| **Patient** | Register / login, manage cases and documents, upload files, view AI analysis, track deadlines, use all bonus tools |
| **Admin** | All patient capabilities + manage user roles, manage AI prompt templates |

---

## 2. Technology Stack

### Web (`apps/web`)
- **Framework:** Next.js 14.2 App Router (TypeScript)
- **Styling:** Tailwind CSS v4 (`@theme` tokens in globals.css)
- **Auth:** Auth.js v5 — Google OAuth (web) + custom JWT (mobile)
- **Database:** Neon serverless PostgreSQL + Drizzle ORM
- **File storage:** Cloudflare R2 (S3-compatible, presigned URL upload)
- **AI:** Google Gemini 2.5 Flash (server-side only)
- **i18n:** next-intl (Bulgarian locale)
- **Deployment:** Vercel

### Mobile (`apps/mobile`)
- **Framework:** Expo SDK 54 + React Native (TypeScript)
- **Navigation:** expo-router
- **Auth:** JWT stored in expo-secure-store
- **File upload:** expo-image-picker + FileSystem.uploadAsync

---

## 3. Architecture

### Communication diagram

```
┌──────────────────────────┐      ┌──────────────────────────┐
│   Next.js Web App        │      │   Expo Mobile App        │
│   Server Components      │      │   React Native           │
│   + Client Components    │      │   (iOS / Android)        │
└────────────┬─────────────┘      └─────────────┬────────────┘
             │ HTTP (session cookie)             │ HTTP (Bearer JWT)
             ▼                                  ▼
┌────────────────────────────────────────────────────────────┐
│               Next.js API Routes (Node.js runtime)         │
│   /api/*          — Auth.js session guard                  │
│   /api/mobile/*   — custom JWT verification                │
└──────────┬────────────────────┬───────────────┬────────────┘
           │                    │               │
    ┌──────▼──────┐  ┌──────────▼────┐  ┌──────▼──────────┐
    │  Neon DB    │  │ Cloudflare R2 │  │ Google Gemini   │
    │ (Drizzle)   │  │ File Storage  │  │ 2.5 Flash API   │
    └─────────────┘  └───────────────┘  └─────────────────┘
```

> **File uploads bypass the API server.** The client requests a presigned URL from `/api/upload/presign`, then uploads the file directly to Cloudflare R2 via `PUT`.

### Project structure

```
telk-navigator/
├── apps/
│   ├── web/                          # Next.js app — backend + web frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/
│   │   │   │   │   ├── (app)/        # Authenticated patient pages
│   │   │   │   │   │   ├── dashboard/            # Cases list + stats
│   │   │   │   │   │   ├── dashboard/cases/[id]/ # Case detail + upload
│   │   │   │   │   │   ├── documents/            # All documents view
│   │   │   │   │   │   ├── deadlines/            # Deadline tracker
│   │   │   │   │   │   ├── rights/               # Rights calculator
│   │   │   │   │   │   ├── score-predictor/      # AI score prediction
│   │   │   │   │   │   ├── lifelong-check/       # Lifelong decision checker
│   │   │   │   │   │   ├── appeal/               # Appeal letter generator
│   │   │   │   │   │   └── employer-letter/      # Employer letter generator
│   │   │   │   │   ├── (admin)/      # Admin panel
│   │   │   │   │   │   ├── admin/                # Overview
│   │   │   │   │   │   ├── admin/users/          # User management
│   │   │   │   │   │   └── admin/prompts/        # AI prompt management
│   │   │   │   │   └── (auth)/       # Sign-in / sign-up
│   │   │   │   └── api/              # REST API endpoints
│   │   │   │       ├── cases/        # Case CRUD
│   │   │   │       ├── documents/    # Document CRUD + AI analysis
│   │   │   │       ├── deadlines/    # Deadline CRUD
│   │   │   │       ├── upload/       # R2 presigned URL
│   │   │   │       ├── score-predictor/
│   │   │   │       ├── lifelong-check/
│   │   │   │       ├── appeal/
│   │   │   │       ├── employer-letter/
│   │   │   │       ├── admin/        # Admin-only endpoints
│   │   │   │       └── mobile/       # Mobile-specific endpoints (Bearer JWT)
│   │   │   ├── components/           # Reusable React components
│   │   │   │   ├── cases/            # CaseStatusButton, AnalyseButton, DeleteDocumentButton
│   │   │   │   ├── deadlines/        # DeadlineList, NewDeadlineButton
│   │   │   │   ├── upload/           # FileUpload (progress bar + AI trigger)
│   │   │   │   └── ui/               # Badge, Spinner, StatusBadge
│   │   │   ├── db/
│   │   │   │   ├── schema/           # Drizzle table definitions (13 tables)
│   │   │   │   └── index.ts          # Drizzle client
│   │   │   └── lib/
│   │   │       ├── ai.ts             # Gemini integration (analysis + generation)
│   │   │       ├── r2.ts             # Cloudflare R2 client + presigned URLs
│   │   │       ├── mobile-auth.ts    # JWT verification for mobile endpoints
│   │   │       └── rights.ts         # Disability rights calculator logic
│   │   └── drizzle/
│   │       ├── 0000_absent_chamber.sql  # Initial schema migration
│   │       └── 0001_add_document_type.sql  # Document type categorization
│   └── mobile/                       # Expo React Native app
│       ├── app/
│       │   ├── (tabs)/               # Main tab navigation
│       │   │   ├── index.tsx         # Home / stats dashboard
│       │   │   ├── cases.tsx         # Cases CRUD
│       │   │   ├── documents.tsx     # Documents + camera/gallery upload
│       │   │   ├── deadlines.tsx     # Deadline tracker
│       │   │   ├── rights.tsx        # Rights calculator (saved percentage)
│       │   │   └── settings.tsx      # Profile + ТЕЛК degree
│       │   ├── (admin)/              # Admin screens
│       │   ├── document-detail.tsx   # AI analysis result view
│       │   ├── appeal.tsx            # Appeal letter generator
│       │   ├── lifelong.tsx          # Lifelong decision checker
│       │   ├── score.tsx             # Score predictor
│       │   ├── employer-letter.tsx   # Employer letter generator
│       │   ├── sign-in.tsx           # Login screen
│       │   └── register.tsx          # Registration screen
│       └── lib/
│           ├── api.ts                # Typed API client (all backend calls)
│           ├── auth.tsx              # AuthContext + SecureStore token management
│           └── prefs.ts              # Device-local ТЕЛК percentage (SecureStore)
├── AGENTS.md                         # AI agent instructions for this project
└── package.json                      # Monorepo workspaces + root scripts
```

---

## 4. Database Schema

The database contains 13 tables. Core relationships:

```
users ──────────────────────────────────────────────┐
  │                                                  │
  ├── user_preferences (1:1)                         │
  ├── accounts (1:N)          ← OAuth providers      │
  ├── user_passwords (1:1)    ← credentials login    │
  ├── cases (1:N)                                    │
  │     └── documents (1:N)                          │
  │           └── analysis_reports (1:N)             │
  ├── deadlines (1:N)                                │
  ├── review_tokens (1:N)                            │
  └── referrals (1:N) ────────────────────────────── ┘
                              ↑ self-referential

prompt_modules               ← admin-managed AI prompts
nme_modules                  ← NME regulation catalogue
document_history             ← audit trail
```

| Table | Purpose |
|-------|---------|
| `users` | Accounts with role: `patient` or `admin` |
| `user_preferences` | ТЕЛК situation, diagnosis category, settings |
| `accounts` | Auth.js OAuth provider data |
| `user_passwords` | bcrypt hashes for credentials login |
| `cases` | ТЕЛК cases — status: `active`, `submitted`, `closed` |
| `documents` | Uploaded files (R2 key, mimeType, status) |
| `analysis_reports` | AI results: covered / incomplete / missing NME items |
| `deadlines` | Deadline reminders with due date and completion flag |
| `prompt_modules` | Admin-editable AI prompt templates |
| `nme_modules` | NME regulation module catalogue |
| `review_tokens` | Shareable review tokens |
| `document_history` | Audit log of actions on documents |
| `referrals` | Referral relationships between users |

---

## 5. API Endpoints

### Web (Auth.js session cookie)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/cases` | List / create cases |
| PATCH/DELETE | `/api/cases/[id]` | Update / delete case |
| GET/POST | `/api/documents` | List / create document records |
| DELETE | `/api/documents/[id]` | Delete document + R2 file |
| POST | `/api/documents/[id]/analyse` | Trigger AI analysis |
| POST | `/api/upload/presign` | Get R2 presigned upload URL |
| GET/POST | `/api/deadlines` | List / create deadlines |
| PATCH/DELETE | `/api/deadlines/[id]` | Update / delete deadline |
| POST | `/api/score-predictor` | AI disability score prediction |
| POST | `/api/lifelong-check` | AI lifelong decision eligibility check |
| POST | `/api/appeal` | Generate court appeal letter |
| POST | `/api/employer-letter` | Generate employer accommodation letter |
| GET/PATCH | `/api/admin/users` | List users / update role (admin only) |
| GET/POST | `/api/admin/prompts` | List / create AI prompt templates (admin only) |
| PATCH/DELETE | `/api/admin/prompts/[id]` | Update / delete prompt template (admin only) |

### Mobile (Bearer JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mobile/auth/register` | Register with email + password |
| POST | `/api/mobile/auth/login` | Login — returns JWT (30-day expiry) |
| GET/PATCH | `/api/mobile/profile` | Get / update user profile |
| GET/POST | `/api/mobile/cases` | List / create cases |
| PATCH/DELETE | `/api/mobile/cases/[id]` | Update / delete case |
| GET/POST | `/api/mobile/documents` | List / create documents |
| GET/POST | `/api/mobile/documents/[id]/analyse` | Get analysis result / trigger analysis |
| POST | `/api/mobile/upload/presign` | Get R2 presigned upload URL |
| GET/POST | `/api/mobile/deadlines` | List / create deadlines |
| PATCH/DELETE | `/api/mobile/deadlines/[id]` | Update / delete deadline |

---

## 6. Local Development Setup

### Prerequisites

- Node.js ≥ 20
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with public access enabled
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- A Google OAuth application (for Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/naydenovtony-afk/TELK-Navigator.git
cd TELK-Navigator
npm install
```

### 2. Configure environment variables

Create `apps/web/.env.local`:

```env
# Database
DATABASE_URL=postgresql://...

# Auth.js
NEXTAUTH_SECRET=<random 32-char string>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=telk-docs
R2_PUBLIC_URL=https://<bucket>.r2.dev

# Google Gemini
GEMINI_API_KEY=AIza...
```

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Push database schema

```bash
npm run db:push -w apps/web
```

### 4. (Optional) Seed demo data

```bash
npm run db:seed -w apps/web
```

### 5. Run the apps

```bash
# Web app — http://localhost:3000
npm run dev:web

# Mobile app — Expo Go
npm run dev:mobile
```

### Database management

```bash
cd apps/web
npm run db:generate   # Generate SQL migration from schema changes
npm run db:push       # Apply schema to Neon
npm run db:studio     # Open Drizzle Studio UI
```

---

## 7. Security

- **Personal ID (EGN) is never stored** — only `birthDate` and `isMinor` flags are derived and saved
- **GEMINI_API_KEY is server-side only** — never exposed to client code
- **Ownership checks on every resource endpoint** — users can only access their own data
- **Admin role guard** on all `/admin/*` routes and API endpoints
- **Mobile JWT** — signed with `NEXTAUTH_SECRET`, 30-day expiry, verified on every request

---

## 8. Deployment

The web app is deployed on **Vercel** with root directory set to `apps/web`.

The mobile app is tested via **Expo Go** (iOS / Android) pointing to the deployed Vercel backend.

---

## Course

**SoftUni — Full Stack Apps with AI** · May 2026  
**Author:** Toni Naydenov
