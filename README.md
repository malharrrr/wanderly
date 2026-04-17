# Wanderly — AI Travel Planner

A full-stack AI-powered travel planning web application built with Next.js, MongoDB, and Claude.

🔗 **Live demo**: https://wanderly-weld.vercel.app/

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Full-stack framework, file-based routing, server components |
| Styling | Tailwind CSS | Utility-first, fast to build, consistent design |
| Auth | NextAuth.js | Handles sessions, JWT, and credential auth out of the box |
| Database | MongoDB + Mongoose | Flexible schema for AI-generated content that varies in structure |
| AI | Anthropic Claude API | Best-in-class instruction following for structured JSON output |
| Deployment | Vercel | Native Next.js support, zero config deployment |

---

## Architecture overview

This app uses **Next.js as a full-stack framework** — there is no separate backend server. API routes in `/src/app/api/` handle all backend logic.

```
User browser
    │
    ▼
Next.js App (Vercel)
    ├── /app/(auth)/          → Login, register pages (public)
    ├── /app/(dashboard)/     → Protected pages with sidebar layout
    │   ├── /dashboard        → Stats + trip list
    │   ├── /plan             → Trip creation form
    │   └── /trips/[id]       → Itinerary view + editor
    ├── /app/api/
    │   ├── /auth/[...nextauth] → NextAuth session handler
    │   ├── /register           → User creation
    │   ├── /trips              → GET all trips / POST create trip
    │   └── /trips/[id]         → GET / PATCH / DELETE single trip
    └── /lib/
        ├── db.ts               → MongoDB connection (singleton)
        ├── auth.ts             → NextAuth config
        └── ai.ts               → Claude API calls
```

---

## Authentication & authorization

- Passwords are hashed with **bcrypt** (12 rounds) before storage — never stored in plain text
- Sessions use **JWT** via NextAuth — stateless, no server-side session store needed
- Every API route calls `getServerSession()` and returns 401 if not authenticated
- **Data isolation**: every trip is stored with a `userId` field. All DB queries filter by `userId: session.user.id`, so users can never access each other's data — even if they guess a trip ID

---

## AI agent design

The AI integration lives in `/src/lib/ai.ts` and uses two functions:

**`generateTripPlan()`** — Called when creating a new trip. Sends a single prompt to Claude that returns structured JSON containing:
- Full day-by-day itinerary (activities with name, time, duration, notes)
- Budget breakdown (flights, accommodation, food, activities, total)
- Hotel suggestions (3 tiers: budget, mid-range, luxury)

Using a single prompt for all three reduces latency and API costs. The prompt explicitly instructs Claude to return only valid JSON, which is then parsed and stored in MongoDB.

**`regenerateDay()`** — Called when user asks to regenerate a specific day. Sends the current activities + user instruction to Claude and replaces just that day in the stored itinerary.

---

## Creative / custom feature

**Tabbed itinerary view with inline day regeneration**

Instead of a simple list, each day card has an inline text input where users can type a natural language instruction like *"More outdoor activities"* or *"Add a cooking class"* and regenerate just that day without touching the rest of the itinerary. This solves the real problem of AI-generated content feeling "all or nothing" — users can surgically adjust individual days while keeping the rest intact.

The PATCH endpoint accepts an `action` field (`remove_activity`, `add_activity`, `regenerate_day`) to handle all three edit types in one route, keeping the API clean and extensible.

---

## Local setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/wanderly.git
cd wanderly
npm install

# 2. Create .env.local (see SETUP.md for how to get each key)
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open http://localhost:3000

---

## Environment variables

```env
NEXTAUTH_SECRET=        # Random string (openssl rand -base64 32)
NEXTAUTH_URL=           # http://localhost:3000 (or your deployed URL)
MONGODB_URI=            # MongoDB Atlas connection string
ANTHROPIC_API_KEY=      # From console.anthropic.com
```

---

## Key design decisions & trade-offs

**Single repo, no separate backend**: Using Next.js API routes instead of a standalone Express server reduces complexity significantly. The trade-off is that compute-heavy operations run on serverless functions with a 10s default timeout — mitigated by using fast Claude API calls.

**Structured JSON prompting**: Prompting Claude to return only JSON (no prose, no markdown fences) makes parsing reliable. The prompt includes explicit type hints and examples so the output schema is consistent.

**Mongoose over raw MongoDB driver**: Adds a schema layer that validates data before saving, which is important when storing AI-generated content that could have unexpected shapes.

**Client-side trip editing**: Edits (add/remove activity, regenerate day) use client-side state updated optimistically after each PATCH response. This keeps the UI feeling fast without a full page reload.

---

## Known limitations

- Hotel suggestions are AI-generated estimates, not real availability data
- Budget estimates are rough approximations based on destination and budget level
- No image support — destination emoji is mapped from keywords
- Regenerating a day takes ~5–10 seconds (Claude API latency)
