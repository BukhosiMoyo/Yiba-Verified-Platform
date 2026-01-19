# Yiba Verified

A compliance-grade, audit-first platform for:

- **QCTO programme delivery readiness** (Form 5)
- **Learner tracking** (LMIS)
- **Evidence Vault** (versioned documents, never deleted)
- **Oversight review** (QCTO read-only + review/flag actions)
- **Platform Admin** (usage, security, audit monitoring)

## Project structure

| Directory | Description |
|-----------|-------------|
| `yiba-verified/` | Main Next.js application (App Router, Prisma, NextAuth, shadcn/ui) |
| `yiba-verified-app-temp/` | Temporary / scaffold app |

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (Credentials; Google OAuth planned)

## Getting started

```bash
cd yiba-verified
npm install
# Configure .env (see yiba-verified/.env.example if present)
npx prisma migrate dev
npm run dev
```

## Documentation

Requirements and specs live in `yiba-verified/docs/`:
- Strategy: `docs/01-Strategy/`
- Requirements: `docs/02-Requirements/`
- Wireframes: `docs/03-Wireframes/`
- Data: `docs/04-Data/`
- Design: `docs/05-Design/`
- Development: `docs/06-Development/`

See `yiba-verified/PROJECT_PROMPT.md` for project rules and guardrails.
