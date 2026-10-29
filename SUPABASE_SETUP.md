# Bench & Dal — Supabase Connection & Setup Guide

This guide walks you through connecting **Bench & Dal** to your Supabase project (both **Supabase Cloud** and **Local Docker**), running database migrations, seeding Indian vegetarian foods and dumbbell templates, and setting up Authentication and Storage.

---

## 1. Quick Overview

Bench & Dal uses **`@supabase/ssr`** for Next.js App Router:
- **Browser Client** (`lib/supabase/client.ts`): Interacts with Supabase using your public anon key.
- **Server Client** (`lib/supabase/server.ts`): Runs in Server Components and Server Actions with secure cookie forwarding.
- **Middleware** (`middleware.ts` / `lib/supabase/middleware.ts`): Refreshes auth tokens on requests and protects authenticated routes (`/today`, `/workout`, `/food`, `/progress`, `/settings`).

---

## 2. Option A: Supabase Cloud (Recommended)

### Step 1: Create a Free Project
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization, name the project (e.g. `bench-and-dal`), choose a database password, and select a region close to your users (e.g., **South Asia - Mumbai** for Indian users).
4. Wait 1–2 minutes for the database to provision.

---

### Step 2: Copy API Credentials
1. In your Supabase dashboard, go to **Project Settings** (gear icon in the sidebar) ➔ **API**.
2. Find the following values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **`anon` `public` API Key** (starts with `ey...`)
   - **`service_role` Secret Key** (starts with `ey...` — keep this private!)

---

### Step 3: Configure `.env.local`
Open `e:\projects\New folder\.env.local` in your editor and replace the placeholder values with your real credentials:

```env
# Supabase Cloud Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Web Push & Automated Reminders (Optional for initial dev)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=bench-and-dal-cron-secret-local
```

---

### Step 4: Run Migrations and Seed Data

You can apply the schema and seed data in two ways:

#### Method 1: Via the Supabase Dashboard SQL Editor (Easiest)
1. Go to the **SQL Editor** tab in your Supabase Dashboard.
2. Click **New query**.
3. Open [`supabase/migrations/20261029000000_initial_schema.sql`](file:///e:/projects/New%20folder/supabase/migrations/20261029000000_initial_schema.sql), copy its entire contents, paste it into the SQL editor, and click **Run**.
   - *This creates all 21 tables, indexes, and Row Level Security (RLS) policies.*
4. Open another query tab, copy the entire contents of [`supabase/seed.sql`](file:///e:/projects/New%20folder/supabase/seed.sql), paste it, and click **Run**.
   - *This seeds the Upper/Lower dumbbell routines, rep ranges, rest timers, alternatives, and 45+ Indian vegetarian and eggetarian staple foods.*

#### Method 2: Via Supabase CLI
In your PowerShell terminal:
```powershell
# 1. Log in to Supabase
npx supabase login

# 2. Link your local project to your cloud project
npx supabase link --project-ref your-project-id

# 3. Push schema migrations
npx supabase db push

# 4. Insert seed data
Get-Content supabase/seed.sql | npx supabase db execute
```

---

### Step 5: Configure Authentication & Redirect URLs

1. In Supabase Dashboard, navigate to **Authentication** ➔ **URL Configuration**.
2. Set **Site URL** to:
   ```text
   http://localhost:3000
   ```
3. Under **Redirect URLs**, add:
   ```text
   http://localhost:3000/api/auth/callback
   ```
   *(When deploying to Vercel later, also add `https://your-deployment-url.vercel.app/api/auth/callback`)*.

4. (Optional) For rapid testing without waiting for confirmation emails:
   - Go to **Authentication** ➔ **Providers** ➔ **Email**.
   - Uncheck **Confirm email** during development.

5. (Optional) Google Sign-in:
   - Go to **Authentication** ➔ **Providers** ➔ **Google**.
   - Enable Google, then provide the **Client ID** and **Client Secret** obtained from Google Cloud Console (Credentials ➔ OAuth 2.0 Client ID for Web Application).

---

### Step 6: Create Storage Bucket for Progress Photos

1. Go to **Storage** ➔ **New Bucket**.
2. Name the bucket: `progress-photos`.
3. Set **Public bucket** to **OFF** (Keep it Private so progress photos remain confidential).
4. Click **Save**.

The schema migration already created policies ensuring each user can only read/write files under their own `user_id` folder (`progress-photos/{user_id}/*`).

---

## 3. Option B: Local Supabase Development (with Docker)

If you prefer running a complete local Supabase instance on your machine:

1. Ensure **Docker Desktop** is installed and running on Windows.
2. In the project root, run:
   ```powershell
   npx supabase start
   ```
3. The CLI will output local credentials:
   - API URL: `http://127.0.0.1:54321`
   - Anon Key: `eyJ...`
   - Studio URL: `http://127.0.0.1:54323`
4. Update `.env.local` with the local URL and anon key.
5. Apply schema and seed:
   ```powershell
   npx supabase db reset
   ```

---

## 4. Verification Checklist

To confirm everything is working:

1. Start the Next.js dev server:
   ```powershell
   pnpm dev
   ```
2. Open `http://localhost:3000/signup`.
3. Create a test account.
4. Check your Supabase Dashboard:
   - Go to **Authentication** ➔ **Users**: You should see your newly registered user.
   - Go to **Table Editor** ➔ **exercises** and **foods**: You will see all dumbbell templates and Indian foods populated.
