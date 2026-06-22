# VivAudit — HIPAA Compliance Audit Platform

> HIPAA Compliance Made Simple. Automated HIPAA compliance audits for dental
> clinics, therapy practices, and small healthcare providers.

VivAudit lets a practice upload its documentation (policies, IT setup, patient-data
procedures) and runs an AI-powered HIPAA audit that returns a risk-scored report with
evidence-backed findings and a prioritized remediation roadmap.

## Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Styling/UI:** Tailwind CSS + shadcn-style primitives + Lucide icons
- **Data:** PostgreSQL (Supabase) via Prisma ORM
- **Auth:** NextAuth.js (Email/Credentials + Google OAuth)
- **AI:** Anthropic Claude API
- **Payments:** Stripe (Checkout + webhooks)
- **Storage:** AWS S3 or Supabase Storage (provider-abstracted)
- **Email:** Resend or SendGrid (provider-abstracted)
- **State:** React Query + Zustand
- **Charts:** Recharts
- **Errors:** Sentry

## Project layout

See [`.kiro/specs/vivaudit/design.md`](.kiro/specs/vivaudit/design.md) §8 for the full
structure and architecture diagrams. Requirements live in
[`requirements.md`](.kiro/specs/vivaudit/requirements.md); the implementation plan is in
[`tasks.md`](.kiro/specs/vivaudit/tasks.md).

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in values

# 3. Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Run the dev server
npm run dev
```

App runs at http://localhost:3000.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run prisma:migrate` | Apply database migrations |

## Environment variables

All required variables are documented in [`.env.example`](.env.example). Highlights:
`DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_*`, `ANTHROPIC_API_KEY`,
`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*`, storage and email
provider keys, `INTERNAL_JOB_SECRET`.

## Testing

Unit tests cover the critical business logic (NFR3.3):

- `tests/scoring.test.ts` — overall score weighting, pass/fail counts, remediation ordering
- `tests/plans.test.ts` — plan entitlements and quota gating
- `tests/webhook-reducer.test.ts` — Stripe event → account change reduction

```bash
npm run test
```

## Deployment

- **App:** Vercel (auto-deploy on merge to `main`).
- **Database:** Supabase (PostgreSQL).
- **Storage:** S3 or Supabase Storage (`STORAGE_PROVIDER`).
- **Stripe webhook:** point to `POST /api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.

> Disclaimer: VivAudit assists with HIPAA compliance assessment and does not constitute
> legal advice.

## Sandbox note

This repository was generated in a network-restricted sandbox where the npm registry was
unavailable, so dependencies were not installed and the test suite was not executed there.
Run `npm install && npm run typecheck && npm run test` locally or in CI to verify.
