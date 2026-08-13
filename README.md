# Nutrition Plan App

## What is this?

The Nutrition Plan is a web app that generates and tracks personalized bodybuilding nutrition plans. Most nutrition apps treat everyone the same; this one is built around the specific needs of bodybuilders — high protein targets, strict meal timing, and detailed macro tracking — and pairs an AI-generated meal plan with daily tracking of weight, sleep, and digestion so you can see what's actually working.

## How it works

1. **Generate a plan** — pick a goal (weight loss, muscle gain, maintenance) and optional dietary restrictions; Claude generates a meal plan hitting specific macro targets for that goal.
2. **Log daily metrics** — weight, sleep hours, wake time, and a digestion rating (1-5).
3. **Confirm meals** — mark each meal as eaten as planned, substituted (with automatic macro recalculation against a food database), or skipped.
4. **Check your score** — a dashboard computes a weighted score from sleep, digestion, and weight-trend data, with recommendations for what to prioritize.

You can also try a real AI-generated plan from the landing page before signing up — no account needed.

## Getting started

Requirements: Node 18+, a Postgres database (e.g. a free [Neon](https://neon.tech) instance), and an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install
cp .env.example .env        # then fill in the values below
npx prisma migrate dev
npm run db:seed             # seeds the food database used for meal substitutions
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment variables

`.env`:
```env
DATABASE_URL="postgresql://user:password@host/dbname"
AUTH_SECRET="generate_with_npx_auth_secret"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
```

`ANTHROPIC_API_KEY` is optional for local dev — without it, plan generation falls back to a static demo plan instead of calling Claude.

## Tech stack

- **Next.js 14** (App Router) — frontend + API routes
- **TypeScript**
- **Tailwind CSS**
- **Prisma + Postgres** — data persistence
- **Auth.js (NextAuth v5)** — credentials-based authentication
- **Anthropic Claude API** — AI-powered meal generation (structured outputs)
- **Vitest** — unit/integration tests for the API layer

## Project structure

```
Nutrition-Plan/
├── src/
│   ├── app/            # Next.js App Router pages + API routes
│   │   └── api/
│   │       ├── auth/       # Auth.js handlers + signup
│   │       └── nutrition/  # Meal plan, daily log, and scoring routes
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── lib/            # API client, Prisma client, nutrition AI service, auth logic
│   └── auth.ts          # Auth.js configuration
├── prisma/
│   ├── schema.prisma    # Data models (Postgres)
│   └── seed.ts           # Seeds the Food table
└── README.md
```

## Key API routes

- `POST /api/nutrition/generate-plan` — generate a personalized meal plan (requires auth)
- `GET /api/nutrition/try-plan/[goals]` — get a real AI-generated demo plan without an account
- `POST /api/nutrition/daily-log` — log weight, sleep, wake time, digestion rating
- `POST /api/nutrition/meal-log` — confirm/substitute/skip a planned meal
- `GET /api/nutrition/optimal-score` — computed sleep/digestion/weight-trend score with recommendations

## Testing

```bash
npm test
```

Covers the score calculation, meal substitution macro math, daily-log and signup validation, the trial-plan cache, and credential verification.

## Current status

This is a solo project under active development. Core tracking, plan generation, and scoring work end-to-end for a single user. Multi-user/coach features, schedule integration, and pattern-recognition recommendations are not built yet — see `docs/roadmap.md` for what's planned next.

## Deployment

### Vercel
```bash
vercel --prod
```

Set `DATABASE_URL`, `AUTH_SECRET`, and `ANTHROPIC_API_KEY` as environment variables in the Vercel project settings, then run `npx prisma migrate deploy` against the production database before first deploy.
