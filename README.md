# 🏋️‍♂️ Bench & Dal

> **Mobile-First Personal Fitness & Progressive Overload Coach for Indian Vegetarians and Eggetarians.**
> *Equipment Constraint: One flat bench and dumbbells only. Zero barbells, zero machines, zero meat.*

---

## 🌟 Overview

**Bench & Dal** is not just another workout log—it is a full-fledged intelligent coach. It determines your exact starting targets, prescribes the precise dumbbell weight and reps to lift next, monitors 7-day smoothed body weight trends, automatically adjusts calories to break through plateaus, and offers high-protein Indian whole-food catch-up suggestions.

### Core Pillars
1. **Dumbbells & Flat Bench Only**: Every exercise, warm-up, and progression is tailored exclusively to home lifters with a pair of dumbbells and a flat bench.
2. **Indian Vegetarian & Eggetarian Purity**: 100% vegetarian (`veg`) or eggetarian (`egg`). Zero chicken, fish, or meat anywhere in the database, recipes, or suggestions. Pure vegetarian users never see egg suggestions.
3. **Progressive Overload Engine**: Automated rep-range progression (e.g. 8–12 reps). When you hit the top of the rep bracket on all sets, the coach instructs you to increase dumbbell weight by your available jump size. If between dumbbell increments, it introduces 3-second eccentric tempo.
4. **Auto-Adjusting Calorie Coach**: Compares 7-day trailing weight averages against your target weekly rate. Clamped to safe thresholds (+/-500 kcal maximum cumulative change), protects against false plateaus (14-day hold), and strictly enforces a 10-day cooldown between adjustments.
5. **Built for Sweaty Gym Hands**: Minimum 44px tap targets, large tabular numeric dials, high-contrast dark/light modes, and floating timestamp-accurate rest timers with haptic vibration (`navigator.vibrate`) and audio chimes.
6. **Offline-First PWA**: Works offline in gym basements. Set logs and weigh-ins are buffered in IndexedDB and automatically synchronized when connectivity returns.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Design Tokens |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security + SSR Client) |
| **State & Cache** | TanStack React Query v5 + React Hook Form + Zod |
| **Visualizations** | Recharts v3 (Responsive weight history & 7-day moving averages) |
| **Offline Storage** | `idb-keyval` (IndexedDB action queue) |
| **Testing** | Vitest (65 unit tests covering calculations, stores, and schemas) |
| **PWA** | Web App Manifest + Service Worker shell cache + Web Push API |

---

## 📂 Architecture & Directory Structure

```
├── app/
│   ├── (app)/                       # Authenticated application shell
│   │   ├── today/page.tsx           # Daily command center, visual barbell plates, checklist, streak
│   │   ├── workout/
│   │   │   ├── page.tsx             # 4-Day Upper/Lower split workout logger & PR detector
│   │   │   └── history/page.tsx     # Past workout sessions history
│   │   ├── food/
│   │   │   ├── page.tsx             # Indian food log, macro dials & protein catch-up suggestions
│   │   │   ├── plan/page.tsx        # 25/30/15/30 macro meal templates & supplement guide
│   │   │   └── grocery/page.tsx     # Interactive checkable weekly Indian grocery checklist
│   │   ├── progress/
│   │   │   ├── page.tsx             # Recharts weight trend, 7-day rolling avg & Calorie Coach
│   │   │   ├── measurements/page.tsx # Waist, chest, arm, thigh circumference tracking
│   │   │   ├── photos/page.tsx      # Private side-by-side progress photo vault
│   │   │   └── badges/page.tsx      # 10 discipline milestone badges in marigold gold
│   │   ├── summary/weekly/page.tsx  # Weekly coaching debrief & Sunday fatigue survey (1-5 scales)
│   │   └── settings/page.tsx        # Profile configuration, data exports (JSON/CSV) & push notifications
│   ├── (auth)/                      # Authentication routes (Login, Signup, Magic Link, OAuth)
│   ├── onboarding/page.tsx          # 4-step wizard with realistic target date calculator
│   └── api/
│       ├── auth/callback/route.ts   # Supabase OAuth PKCE exchange
│       └── push/route.ts            # Web Push subscription handler
├── components/
│   ├── layout/                      # Header, 5-tab BottomNav, Sidebar, ThemeToggle
│   ├── workout/                     # ExerciseCard, RestTimer, InjuryModal
│   ├── pwa/                         # PWAProvider, Offline alert, Install prompt
│   └── ui/                          # Button, Card, Badge, Input, Textarea
├── lib/
│   ├── calc/                        # Pure mathematical engines (100% tested)
│   │   ├── bmr.ts                   # Mifflin-St Jeor formula & TDEE
│   │   ├── plan.ts                  # Goal bounds, safe rate caps, realistic dates
│   │   ├── overload.ts              # Progressive overload suggestions & E1RM PR calculation
│   │   ├── adjust.ts                # Calorie Coach 7-day smoothing & cooldown clamp
│   │   ├── streak.ts                # Streak engine (rest days automatically count)
│   │   ├── badges.ts                # 10 milestone badges evaluation
│   │   └── catchup.ts               # Indian whole-food protein catch-up rankings
│   ├── db/                          # Database clients, stores & fallback mock data
│   │   ├── types.ts                 # TypeScript definitions for all 21 Supabase tables
│   │   ├── workout-store.ts         # Templates, set logging, deload detection
│   │   ├── food-store.ts            # 45+ seeded Indian foods & macro aggregations
│   │   └── progress-store.ts        # Weight entries, measurements, photos, coach proposals
│   ├── offline/sync-queue.ts        # IndexedDB offline buffer & automatic sync
│   └── supabase/                    # SSR client, server, and middleware helpers
├── supabase/
│   ├── migrations/                  # 20261029000000_initial_schema.sql (21 tables with RLS)
│   └── seed.sql                     # Seed data (Upper/Lower templates, 45+ foods)
└── tests/unit/                      # 11 unit test suites (65 tests)
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> bench-and-dal
cd bench-and-dal
pnpm install
```

### 2. Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
*(Note: If you leave Supabase environment variables as placeholders, the app gracefully runs in complete offline/local demo mode with realistic seed data).*

### 3. Run Unit Tests
```bash
pnpm test
```
*All 65 unit tests should pass cleanly.*

### 4. Start Local Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) on your phone or desktop browser.

---

## 🗄️ Supabase Setup & Database Migration

1. Go to [Supabase](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** tab in your Supabase dashboard.
3. Open `supabase/migrations/20261029000000_initial_schema.sql`, copy all contents, and click **Run**.
   - This creates 21 tables with full Row Level Security (RLS) policies and `get_weekly_weight_trend()` helper function.
4. Open `supabase/seed.sql`, copy all contents, and click **Run**.
   - This seeds the 4-day Upper/Lower dumbbell workout program and 45+ Indian vegetarian and eggetarian staple foods.
5. In **Storage**, create a private bucket named `progress-photos`.
6. Copy your **Project URL** and **anon public key** from *Settings -> API* into your `.env.local`.

---

## 📱 PWA Installation Instructions

### Android (Chrome)
1. Open the application URL in Google Chrome.
2. Tap the **"Install App"** prompt banner at the bottom of the screen (or tap the 3 dots menu -> **"Add to Home screen"**).
3. The app will install with standalone orientation and launch full screen like a native app.

### iOS (Safari)
1. Open the application URL in Safari.
2. Tap the **Share** button (box with upward arrow) in the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right.

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://bench-and-dal.vercel.app`)
4. Click **Deploy**. Vercel will build with Turbopack and deploy to the global edge network.

---

## ⚖️ Medical & Coaching Disclaimer

*Bench & Dal is designed for educational fitness tracking and progressive overload guidance for healthy adults. It is not medical advice. Never drop calories below your calculated Basal Metabolic Rate (BMR). Consult a qualified physician or healthcare professional before beginning any intensive exercise regimen or significantly altering your nutritional intake.*

---

© 2026 Bench & Dal. Built with pride for Indian lifters.
#   P e r s o n a l - w o r k o u t  
 "# Personal-workout" 
