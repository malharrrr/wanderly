# Wanderly — AI Travel Planner

A full-stack AI-powered travel planning web app. Give it a destination, your budget, and your interests — it generates a complete day-by-day itinerary, budget breakdown, and hotel recommendations in seconds.

🔗 **Live demo**: [wanderly-weld.vercel.app](https://wanderly-weld.vercel.app)

![TypeScript](https://img.shields.io/badge/TypeScript-97.7%25-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

---

## Features

- **AI itinerary generation** — full day-by-day plans with activities, timings, and local tips
- **Budget estimator** — flight, accommodation, food, and activity cost breakdown per trip
- **Hotel recommendations** — three tiers (budget, mid-range, luxury) with an AI-picked best fit
- **Inline day regeneration** — type a natural language instruction to surgically rewrite a single day without touching the rest
- **Activity editing** — add or remove individual activities per day
- **Dual AI provider** — Gemini 3 flash as primary, Claude 3.5 Sonnet as automatic fallback
- **Rate limiting** — Upstash Redis-backed rate limiting on all AI endpoints
- **Auth** — JWT sessions via NextAuth, bcrypt password hashing, full data isolation per user

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, server components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v4 — JWT + credentials |
| Database | MongoDB Atlas + Mongoose |
| AI (primary) | Google Gemini 1.5 Pro (`@google/genai`) |
| AI (fallback) | Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`) |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` |
| Validation | Zod |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

---

## Architecture

Next.js is used as a full-stack framework — no separate backend server. API routes handle all server-side logic.

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/              → Login page
│   │   └── register/           → Register page
│   ├── (dashboard)/
│   │   ├── layout.tsx          → Sidebar layout (auth-gated)
│   │   ├── dashboard/          → Stats + trip list
│   │   ├── plan/               → Trip creation form
│   │   └── trips/[id]/         → Itinerary view + editor
│   └── api/
│       ├── auth/[...nextauth]/ → NextAuth handler
│       ├── register/           → User creation
│       ├── trips/              → GET all / POST create trip
│       └── trips/[id]/         → GET / PATCH / DELETE single trip
├── lib/
│   ├── db.ts                   → MongoDB singleton connection
│   ├── auth.ts                 → NextAuth config
│   └── ai.ts                   → AI provider abstraction
├── models/
│   ├── User.ts                 → Mongoose user schema
│   └── Trip.ts                 → Mongoose trip schema
└── types/
    └── index.ts                → Shared TypeScript types
```

---

## AI design

All AI logic lives in `src/lib/ai.ts`. The file exposes two functions — `generateTripPlan()` and `regenerateDay()` — and internally handles provider routing, fallback, and JSON parsing. The rest of the app never knows which model responded.

**Provider strategy:**
1. Gemini 3 Flash is called first (faster, generous free tier)
2. If Gemini fails for any reason, Claude 3.5 Sonnet is called automatically
3. Both receive the same prompt and return the same JSON structure

**Single-prompt design:** The itinerary, budget, and hotel suggestions are all requested in one API call. This cuts latency roughly in half compared to chaining three separate prompts, and reduces API costs.

**Structured output:** The prompt instructs the model to return only valid JSON with a fixed schema. Responses are stripped of any accidental markdown fences before parsing.

**`regenerateDay()`** accepts the current day's activities plus a user instruction and returns a replacement `DayPlan` object. The PATCH endpoint swaps just that day in the stored itinerary, leaving all other days untouched.

---

## Local setup

**Prerequisites:** Node.js 18+, a MongoDB Atlas account, and at least one AI API key.

```bash
# 1. Clone
git clone https://github.com/malharrrr/wanderly.git
cd wanderly

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see below)

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

```env
# Auth
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=             # http://localhost:3000

# Database
MONGODB_URI=              # mongodb+srv://user:pass@cluster.mongodb.net/wanderly

# AI — at least one is required; both enables automatic fallback
GEMINI_API_KEY=           # From aistudio.google.com
ANTHROPIC_API_KEY=        # From console.anthropic.com

# Rate limiting (optional but recommended in production)
UPSTASH_REDIS_REST_URL=   # From upstash.com
UPSTASH_REDIS_REST_TOKEN= # From upstash.com
```

Getting your keys:
- **MongoDB URI** → [mongodb.com/atlas](https://mongodb.com/atlas) → Free cluster → Connect → Drivers
- **Gemini API key** → [aistudio.google.com](https://aistudio.google.com) → Get API Key (free)
- **Anthropic API key** → [console.anthropic.com](https://console.anthropic.com) → API Keys
- **Upstash** → [upstash.com](https://upstash.com) → Create Redis database → REST API credentials

---

## Deployment

The app is deployed on Vercel with MongoDB Atlas and Upstash Redis.

```bash
# Push to GitHub, then import at vercel.com
# Add all environment variables in the Vercel dashboard
# Change NEXTAUTH_URL to your production Vercel URL after first deploy
```

---

## Design decisions

**No separate backend** — Next.js API routes handle everything. One repo, one deployment, zero infrastructure to manage. The trade-off is serverless function cold starts and a default 10s timeout, which is acceptable given AI call latency at this scale.

**Mongoose over raw MongoDB driver** — Adds a schema validation layer before writes, which matters when AI output could have an unexpected shape despite strict prompting.

**Zod for input validation** — All incoming request bodies are validated with Zod before any DB or AI call. Keeps error messages clean and prevents malformed data from reaching the models.

**Client-side state after edits** — After any PATCH call, the response replaces the client's trip state directly. No full page reload, no extra GET. Makes editing feel instant.

**Rate limiting on AI endpoints** — Upstash Redis rate limiting prevents a single user from hammering the AI API and running up costs. Applied per-IP on trip creation and day regeneration.
