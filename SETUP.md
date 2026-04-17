# Wanderly — AI Travel Planner
## Complete Setup Guide

---

## 1. Prerequisites

Make sure you have these installed:
- Node.js 18+ → https://nodejs.org
- Git → https://git-scm.com
- A code editor (VS Code recommended)

---

## 2. Create the Next.js project

Open your terminal and run these commands ONE BY ONE:

```bash
npx create-next-app@latest wanderly --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd wanderly
```

When prompted, say YES to everything.

---

## 3. Install dependencies

```bash
npm install mongoose next-auth bcryptjs
npm install @types/bcryptjs --save-dev
```

---

## 4. Set up your folder structure

Run this to create all the folders:

```bash
mkdir -p src/app/api/auth/\[...nextauth\]
mkdir -p src/app/api/trips
mkdir -p src/app/api/itinerary
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/trips/\[id\]
mkdir -p src/app/\(dashboard\)/plan
mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/types
```

---

## 5. Create your .env.local file

Create a file called `.env.local` in the ROOT of your project (same level as package.json):

```env
NEXTAUTH_SECRET=your-random-secret-string-here-make-it-long
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/wanderly?retryWrites=true&w=majority
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Getting your keys:

**NEXTAUTH_SECRET**: Run this in terminal to generate one:
```bash
openssl rand -base64 32
```

**MONGODB_URI**: 
1. Go to https://mongodb.com/atlas
2. Create free account → Create free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string, replace `<password>` with your password

**ANTHROPIC_API_KEY**:
1. Go to https://console.anthropic.com
2. API Keys → Create Key
3. Copy it

---

## 6. Copy all the code files

Copy each file from this folder into your project at the exact same path.

---

## 7. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 — you should see the login page!

---

## 8. Git setup

```bash
git init
git add .
git commit -m "initial commit: wanderly AI travel planner"
```

Create a repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/wanderly.git
git push -u origin main
```

---

## 9. Deploy to Vercel (free)

1. Go to https://vercel.com → Sign in with GitHub
2. Click "New Project" → Import your wanderly repo
3. Add your environment variables (same as .env.local)
4. Click Deploy — done!

---

## File structure overview

```
wanderly/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   ← NextAuth handler
│   │   │   ├── trips/route.ts                ← GET/POST trips
│   │   │   └── itinerary/route.ts            ← AI generation
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    ← Sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── plan/page.tsx
│   │   │   └── trips/[id]/page.tsx
│   │   ├── layout.tsx                        ← Root layout
│   │   └── page.tsx                          ← Redirects to login
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── lib/
│   │   ├── db.ts                             ← MongoDB connection
│   │   ├── auth.ts                           ← NextAuth config
│   │   └── ai.ts                             ← Claude API calls
│   └── types/
│       └── index.ts                          ← TypeScript types
├── .env.local
└── tailwind.config.ts
```
