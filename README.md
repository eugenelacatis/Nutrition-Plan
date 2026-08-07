# Nutrition Plan App

## What is this?

The Nutrition Plan is an innovative web application that automates meal planning based on individual goals and preferences. As a fitness enthusiast and bodybuilder, I recognized the need for personalized nutrition plans that go beyond the typical "chicken, broccoli, and rice" meals. A tailored diet is crucial for adherence and ultimately, weight loss and fitness success.

## Why does this exist?

My goal with this project is to challenge myself as a solo developer and further develop my skills in software engineering, while applying my knowledge in nutrition and kinesiology. The Nutrition Plan offers personalized diet plans, catering to individuals seeking general health to athletes looking to optimize their performance in their respective sports.

The key insight is that **bodybuilders have specific nutrition needs**:

- **High protein requirements** (1.2-1.5g per lb bodyweight)
- **Strict meal timing** for optimal muscle growth
- **Detailed macro tracking** for contest preparation
- **Supplement integration** for enhanced results
- **Contest prep cycles** with specific nutritional phases

Traditional nutrition apps treat everyone the same. This app recognizes that a bodybuilder preparing for a contest has vastly different needs than someone just trying to eat healthy.

## How it works

The app uses Claude-powered meal generation to create personalized nutrition plans based on:
- **Fitness goals** (weight loss, muscle gain, maintenance, energy boost)
- **Dietary restrictions** (vegetarian, gluten-free, etc.)
- **Nutrition targets** (calories, protein, carbs, fat)

The system is optimized for bodybuilder nutrition patterns, with specific meal timing, high protein requirements, and supplement integration that make the generated plans realistic and useful.

## Project Structure

```
Nutrition-Plan/
├── src/
│   ├── app/            # Next.js App Router pages + API routes
│   │   └── api/
│   │       ├── auth/       # Auth.js handlers + signup
│   │       └── nutrition/  # Meal plan + daily log routes
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── lib/            # API client, Prisma client, nutrition AI service
│   └── auth.ts          # Auth.js configuration
├── prisma/
│   └── schema.prisma    # User + DailyLog models (SQLite)
└── README.md
```

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```

### Environment Variables

**`.env`**:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate_with_openssl_rand_base64_32"
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Tech Stack

- **Next.js 14** - React framework with App Router (frontend + API routes)
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Prisma + SQLite** - Data persistence for users and daily logs
- **Auth.js (NextAuth v5)** - Credentials-based authentication
- **Anthropic Claude API** - AI-powered meal generation (structured outputs)

## Features

- **Bodybuilder-optimized nutrition planning**
- **AI-powered meal generation**
- **Multi-step plan creation**
- **Detailed meal breakdowns**
- **Responsive design**
- **User authentication (demo)**
- **Plan management**

## API Endpoints

### POST /api/nutrition/generate-plan
Generate a personalized meal plan based on goals and dietary restrictions.

### GET /api/nutrition/demo-plan/:goals
Get a demo meal plan for specific fitness goals.

## Design Philosophy

The app emphasizes **bodybuilder-first** nutrition planning, recognizing that serious fitness enthusiasts have specific needs, constraints, and goals. This approach ensures that meal plans are not just nutritionally sound, but also practical and sustainable for dedicated athletes.

## Deployment

### Vercel
```bash
vercel --prod
```

SQLite works for local development; for production, point `DATABASE_URL` at a hosted Postgres/SQLite-compatible database and update `prisma/schema.prisma`'s `provider` accordingly.
