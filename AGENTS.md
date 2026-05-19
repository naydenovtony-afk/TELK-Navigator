# TELK Navigator — AGENTS.md

Read this file before every task. Follow all rules without exception.

---

## Project Context

TELK Navigator is a multi-platform SaaS app (web + mobile) that helps Bulgarian patients navigate the medical expertise process (ТЕЛК). It assists with documentation preparation, understanding disability rights, and tracking deadlines.

**Monorepo structure:**
```
telk-navigator/
  apps/web/       → Next.js 14 App Router (TypeScript)
  apps/mobile/    → Expo React Native (TypeScript)
  packages/shared → Shared TypeScript types, utils, constants
```

---

## Tech Stack

| Layer | Technology | Note |
|---|---|---|
| Web framework | Next.js 14 App Router | NOT Pages Router |
| CSS | Tailwind CSS v4 | @theme in globals.css — NOT tailwind.config.ts for colors |
| Mobile | Expo + React Native | expo-router for navigation |
| Database | Neon PostgreSQL + Drizzle ORM | Migrations required |
| Auth | Auth.js v5 (web) + raw JWT (mobile) | NOT Supabase Auth |
| Storage | Cloudflare R2 | S3-compatible API |
| AI | gemini-2.5-flash | Server-side ONLY |
| Icons | Lucide React | NOT FontAwesome, NOT emoji |
| Font | DM Sans (UI) + DM Serif Display (display) | Довери.се brand fonts |
| i18n | next-intl | bg + en — bg from day one |

---

## Critical Rules

**ANTHROPIC_API_KEY never exposed to client — Server Actions only.**
**EGN (Bulgarian national ID) never stored in DB — only birthDate + isMinor.**
**ALL DB changes via Drizzle migrations only — never raw SQL to Neon.**

### Tailwind v4
- NEVER tailwind.config.ts for colors
- ALL colors and tokens in `@theme` in globals.css
- tailwind.config.ts permitted ONLY for `content` paths

### Auth Architecture
- Auth.js v5 manages web sessions ONLY → `import { auth } from "@/auth"`
- Raw JWT for Expo mobile ONLY → `/api/mobile/auth/*`
- Middleware chains auth() wrapping intlMiddleware — single export
- ALL `/api/` routes excluded from middleware matcher — never add api paths to the matcher
- Actual matcher: `/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)`

### TypeScript
- Never `any` type — use types from packages/shared/src/types/
- Never `// @ts-ignore` or `// @ts-nocheck`
- All components have typed props interface
- All functions have explicit return types

### Code Quality
- Never `console.log` in production
- Never hardcode UI strings — always `t('key')` from next-intl
- Never hardcode hex colors — use Tailwind tokens
- Never commit TODO comments

### Zod v4
- Use `parsed.error.issues[0]?.message` — NOT `.errors[0]` (removed in v4)
- `.flatten()` is deprecated — read `.issues` directly

### pdf-parse
- Incompatible with Edge Runtime — uses `fs`
- Any route using pdf-parse: `export const runtime = 'nodejs'` at top of file

---

## UI Copy Rule — Analysis Results

**BANNED vocabulary (never use):**
- "chance", "probability", "success likelihood"
- "score" when referring to analysis results
- "readiness for approval" or any phrasing implying committee outcome

**ALWAYS use instead:**
- "document completeness" / "пълнота на документите"
- "documents on file" / "налични документи: X от Y"
- "missing items" / "липсващи документи"

Example:
- ❌ Readiness: 72%
- ✅ Documents on file: 8 of 11 — Missing: Epicrisis, Imaging report

---

## Color Palette

### Довери.се Brand Core
| Token | Hex | Usage |
|---|---|---|
| ocean-hero | #0d1623 | Sidebar, hero, dark backgrounds |
| navy-mid | #162033 | Secondary dark surfaces |
| navy-light | #1e2d44 | Tertiary dark surfaces |
| medical-teal | #1da89a | ТЕЛК primary — actions, links, focus |
| teal-dark | #167d73 | Teal hover state |
| amber | #d4963a | Accent — lighthouse dot, highlights |
| amber-light | #e8b45a | Amber hover / lighter accent |
| white-text | #f0f4f8 | Text on dark backgrounds |
| gray-subtitle | #8a9ab0 | Subtitles, secondary text on dark |

### App Semantic Colours
| Token | Hex | Usage |
|---|---|---|
| medical-navy | #1A4A6B | Primary buttons, headings on light bg |
| medical-slate | #3D5A73 | Secondary text, icons |
| medical-surface | #E8F4F8 | Card backgrounds |
| medical-border | #B8CDD8 | All borders — always 0.5px |
| vital-green | #1A6B3C | Status: covered |
| vital-green-bg | #E8F4ED | Green badge background |
| clinical-amber | #7A5200 | Status: incomplete |
| clinical-amber-bg | #FDF4E3 | Amber badge background |
| critical-red | #8B1A1A | Status: missing |
| critical-red-bg | #FDF0F0 | Red badge background |
| dark-text | #1C2B3A | Body text on light backgrounds |

---

## UI Forbidden Practices

- Never `shadow-*` — border only
- Never gradient, blur, glow
- Never font-weight 600 or 700 — only 400 and 500
- Never icon without text label
- Never filled red danger button — outline only
- Never more than 1 Primary button per screen
- Never font-size below 16px on inputs (iOS requirement)
- Never color-only status indicators — always text + color + dot

---

## Database Rules

- Every schema change: `npx drizzle-kit generate` → commit migration SQL
- Never raw SQL — always Drizzle ORM
- UUID for all primary keys — never auto-increment
- `createdAt` on every table with `defaultNow()`

**13 tables:**
users · userPreferences · accounts · userPasswords · cases · documents · analysisReports · reviewTokens · documentHistory · deadlines · promptModules · nmeModules · referrals

**Cases table extended fields** (migration 0003):
`caseType` (initial | reexamination | appeal) · `diagnoses` · `previousPercent` · `appealReason` · `commissionDecision`

---

## API Rules

- All inputs validated with Zod before processing
- Ownership check on every resource access
- Error messages in Bulgarian: `Нямате достъп до този документ.`
- HTTP: 200/201 success, 400 validation, 401 auth, 403 forbidden, 404 not found

### Mobile 401 Handling
The `request()` function in `apps/mobile/lib/api.ts` reads the JSON body before deciding how to handle a 401:
- Body `{ error: 'Unauthorized' }` or no body → calls `_onUnauthorized()` (logs user out) + throws "Сесията е изтекла"
- Any other error message → throws that message directly, does NOT log the user out
- Login/register endpoints return 401 for wrong credentials — this must NOT trigger logout

---

## NME Module Rules

- All `promptModules.content` built from official НМЕ ДВ бр.23/2024 source
- Every criterion must cite the specific НМЕ article number
- This makes AI output legally traceable

---

## Commit Convention

```
feat: add [feature]      → new functionality
fix: resolve [bug]       → bug fix
refactor: [what/why]     → refactor, no functional change
style: [component]       → UI/CSS only
docs: [what]             → documentation
chore: [what]            → build, deps, config
```

Every commit is atomic — one thing, done well.

---

## Absolute Prohibitions

- NEVER: ANTHROPIC_API_KEY in any client-side code
- NEVER: EGN stored in DB
- NEVER: TypeScript `any` type
- NEVER: tailwind.config.ts for colors
- NEVER: Hardcoded UI strings — use `t('key')`
- NEVER: Hardcoded hex colors — use Tailwind tokens
- NEVER: `console.log` in production code
- NEVER: TODO comments in commits
- NEVER: Raw SQL without Drizzle
- NEVER: shadow, gradient, blur in UI
- NEVER: Color-only status indicators
- NEVER: font-weight 600 or 700
- NEVER: Icon without text label
- NEVER: Filled red danger button
- NEVER: More than 1 Primary button per screen
- NEVER: font-size below 16px on inputs
- NEVER: "score", "chance", "probability" in analysis UI copy

---

## Testing

- Web API tests: `cd apps/web && npm test`
- Test files in `apps/web/src/__tests__/` — follow existing mock patterns
- Mock `@/db`, `@/auth`, `bcryptjs`, and `jose` at the top of each test file
- 103 tests across 10 suites — keep all green before every commit

---

TELK Navigator | May 2026
