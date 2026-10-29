-- Bench & Dal Database Schema Migration
-- Designed for PostgreSQL 15+ / Supabase with Row Level Security (RLS)

-- 1. Profiles Table
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age integer not null check (age >= 14 and age <= 80),
  height_cm numeric(5,2) not null check (height_cm >= 120 and height_cm <= 230),
  activity_factor numeric(4,3) not null default 1.375,
  diet text not null check (diet in ('veg', 'egg')),
  goal_weight_kg numeric(5,2) not null check (goal_weight_kg >= 30 and goal_weight_kg <= 250),
  target_date date not null,
  dumbbell_step_kg numeric(4,2) not null default 2.0,
  start_date date not null default current_date,
  calorie_adjustment integer not null default 0,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Weight Entries
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric(5,2) not null check (weight_kg >= 30 and weight_kg <= 250),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_weight_entries_user_date on public.weight_entries(user_id, date desc);

-- 3. Exercises Table (Dumbbells + Flat Bench Only)
create table if not exists public.exercises (
  id text primary key,
  name text not null,
  unit text not null default 'reps' check (unit in ('reps', 'seconds')),
  tip text not null,
  muscle_group text not null,
  equipment text not null default 'dumbbells_and_flat_bench',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Workout Templates (Upper A/B, Lower A/B)
create table if not exists public.workout_templates (
  id text primary key,
  key text not null unique check (key in ('UA', 'LA', 'UB', 'LB')),
  name text not null,
  subtitle text not null,
  type text not null check (type in ('upper', 'lower')),
  created_at timestamptz not null default now()
);

-- 5. Template Exercises
create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.workout_templates(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  position integer not null,
  sets integer not null check (sets > 0),
  rep_min integer not null check (rep_min > 0),
  rep_max integer not null check (rep_max >= rep_min),
  rest_seconds integer not null check (rest_seconds >= 15),
  unique (template_id, position)
);
create index if not exists idx_template_exercises_tmpl on public.template_exercises(template_id, position);

-- 6. Exercise Alternatives
create table if not exists public.exercise_alternatives (
  exercise_id text not null references public.exercises(id) on delete cascade,
  alternative_id text not null references public.exercises(id) on delete cascade,
  primary key (exercise_id, alternative_id)
);

-- 7. Workout Sessions
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  template_key text not null check (template_key in ('UA', 'LA', 'UB', 'LB')),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  notes text,
  completed_at timestamptz not null default now(),
  unique (user_id, date, template_key)
);
create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, date desc);

-- 8. Set Logs
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  set_number integer not null check (set_number > 0),
  weight_kg numeric(5,2) not null check (weight_kg >= 0),
  reps integer not null check (reps >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_set_logs_user_exercise on public.set_logs(user_id, exercise_id, created_at desc);

-- 9. Personal Records
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric(5,2) not null check (weight_kg >= 0),
  reps integer not null check (reps >= 0),
  est_1rm numeric(5,2) not null check (est_1rm >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id, date)
);
create index if not exists idx_personal_records_user on public.personal_records(user_id, exercise_id);

-- 10. Foods Table (Reference Seeded + Custom User Foods)
create table if not exists public.foods (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  serving text not null,
  protein_g numeric(5,2) not null check (protein_g >= 0),
  calories numeric(6,2) not null check (calories >= 0),
  diet text not null check (diet in ('veg', 'egg')),
  optional boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_foods_user on public.foods(user_id, diet);

-- 11. Food Logs
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  meal text not null check (meal in ('breakfast', 'lunch', 'snack', 'dinner')),
  food_id text references public.foods(id) on delete set null,
  name text not null,
  protein_g numeric(5,2) not null check (protein_g >= 0),
  calories numeric(6,2) not null check (calories >= 0),
  quantity numeric(5,2) not null default 1.0 check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_food_logs_user_date on public.food_logs(user_id, date desc);

-- 12. Favorite Foods
create table if not exists public.favorite_foods (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

-- 13. Daily Habits
create table if not exists public.daily_habits (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  water_glasses integer not null default 0 check (water_glasses >= 0),
  sleep_hours numeric(3,1) check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  flexible_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);
create index if not exists idx_daily_habits_user_date on public.daily_habits(user_id, date desc);

-- 14. Weekly Check-ins
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  energy integer not null check (energy between 1 and 5),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  mood integer not null check (mood between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_weekly_checkins_user_date on public.weekly_checkins(user_id, date desc);

-- 15. Calorie Adjustments Log
create table if not exists public.calorie_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  delta_kcal integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_calorie_adjustments_user on public.calorie_adjustments(user_id, date desc);

-- 16. Body Measurements
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  waist_cm numeric(5,2) check (waist_cm is null or waist_cm > 0),
  chest_cm numeric(5,2) check (chest_cm is null or chest_cm > 0),
  arm_cm numeric(5,2) check (arm_cm is null or arm_cm > 0),
  thigh_cm numeric(5,2) check (thigh_cm is null or thigh_cm > 0),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_measurements_user_date on public.measurements(user_id, date desc);

-- 17. Progress Photos
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_progress_photos_user on public.progress_photos(user_id, date desc);

-- 18. Injury & Soreness Notes
create table if not exists public.injury_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body_area text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_injury_notes_user on public.injury_notes(user_id, active);

-- 19. Badges Earned
create table if not exists public.badges_earned (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);
create index if not exists idx_badges_user on public.badges_earned(user_id);

-- 20. Push Subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  reminder_times jsonb not null default '{"workout": "08:00", "water": true, "weighin": "07:30"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_push_user on public.push_subscriptions(user_id);

-- 21. Grocery Items
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  name text not null,
  quantity text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_grocery_items_user on public.grocery_items(user_id, week_start);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.exercise_alternatives enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.personal_records enable row level security;
alter table public.foods enable row level security;
alter table public.food_logs enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.daily_habits enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.calorie_adjustments enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.injury_notes enable row level security;
alter table public.badges_earned enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.grocery_items enable row level security;

-- Global / Reference tables: readable by all authenticated users; writable by service role only
create policy "Allow read access to exercises" on public.exercises for select to authenticated using (true);
create policy "Allow read access to templates" on public.workout_templates for select to authenticated using (true);
create policy "Allow read access to template exercises" on public.template_exercises for select to authenticated using (true);
create policy "Allow read access to alternatives" on public.exercise_alternatives for select to authenticated using (true);

-- Foods table: users can read global foods (user_id is null) OR their own custom foods; can manage own custom foods
create policy "Allow read access to global and own foods" on public.foods
  for select to authenticated
  using (user_id is null or user_id = auth.uid());

create policy "Allow insert of custom foods" on public.foods
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Allow update of custom foods" on public.foods
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Allow delete of custom foods" on public.foods
  for delete to authenticated
  using (user_id = auth.uid());

-- Profiles RLS
create policy "Users can select own profile" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own profile" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own profile" on public.profiles for delete to authenticated using (user_id = auth.uid());

-- Weight Entries RLS
create policy "Users can manage own weight entries" on public.weight_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Workout Sessions RLS
create policy "Users can manage own workout sessions" on public.workout_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Set Logs RLS
create policy "Users can manage own set logs" on public.set_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Personal Records RLS
create policy "Users can manage own personal records" on public.personal_records for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Food Logs RLS
create policy "Users can manage own food logs" on public.food_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Favorite Foods RLS
create policy "Users can manage own favorite foods" on public.favorite_foods for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Daily Habits RLS
create policy "Users can manage own daily habits" on public.daily_habits for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Weekly Checkins RLS
create policy "Users can manage own weekly checkins" on public.weekly_checkins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Calorie Adjustments RLS
create policy "Users can manage own calorie adjustments" on public.calorie_adjustments for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Measurements RLS
create policy "Users can manage own measurements" on public.measurements for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Progress Photos RLS
create policy "Users can manage own progress photos" on public.progress_photos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Injury Notes RLS
create policy "Users can manage own injury notes" on public.injury_notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Badges Earned RLS
create policy "Users can manage own badges" on public.badges_earned for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Push Subscriptions RLS
create policy "Users can manage own push subscriptions" on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Grocery Items RLS
create policy "Users can manage own grocery items" on public.grocery_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ==============================================================================
-- DATABASE HELPER FUNCTIONS & VIEWS
-- ==============================================================================

-- Rolling 7-day weight trend calculation function
create or replace function public.get_weekly_weight_trend(target_user_id uuid)
returns table(
  current_avg numeric(5,2),
  previous_avg numeric(5,2),
  delta_change numeric(5,2),
  current_count bigint,
  previous_count bigint
) language plpgsql security definer as $$
begin
  return query
  with recent_7_days as (
    select weight_kg
    from public.weight_entries
    where user_id = target_user_id
      and date >= (current_date - interval '7 days')
  ),
  previous_7_days as (
    select weight_kg
    from public.weight_entries
    where user_id = target_user_id
      and date >= (current_date - interval '14 days')
      and date < (current_date - interval '7 days')
  )
  select
    round(avg(r.weight_kg)::numeric, 2) as current_avg,
    round(avg(p.weight_kg)::numeric, 2) as previous_avg,
    round((avg(r.weight_kg) - avg(p.weight_kg))::numeric, 2) as delta_change,
    count(r.weight_kg) as current_count,
    count(p.weight_kg) as previous_count
  from recent_7_days r
  full outer join previous_7_days p on true;
end;
$$;
