import { createClient } from "@/lib/supabase/client";
import { WeightEntry, Measurement, ProgressPhoto, WeeklyCheckin, CalorieAdjustment, Profile } from "./types";
import { evaluateCalorieAdjustment, CalorieAdjustmentProposal, WeightDataPoint } from "@/lib/calc/adjust";
import { evaluateBadges, ALL_BADGE_DEFINITIONS, BadgeDefinition, UserStatsForBadges } from "@/lib/calc/badges";

const STORAGE_KEYS = {
  WEIGHTS: "bench_and_dal_weights",
  MEASUREMENTS: "bench_and_dal_measurements",
  PHOTOS: "bench_and_dal_photos",
  CHECKINS: "bench_and_dal_checkins",
  ADJUSTMENTS: "bench_and_dal_adjustments",
  BADGES: "bench_and_dal_badges",
};

// Seed realistic fallback history for initial demo/offline if none exists
const SEED_WEIGHTS: WeightEntry[] = [
  { id: "w-1", user_id: "demo", date: "2026-10-15", weight_kg: 76.5, created_at: "2026-10-15T07:00:00Z" },
  { id: "w-2", user_id: "demo", date: "2026-10-17", weight_kg: 76.3, created_at: "2026-10-17T07:00:00Z" },
  { id: "w-3", user_id: "demo", date: "2026-10-19", weight_kg: 76.2, created_at: "2026-10-19T07:00:00Z" },
  { id: "w-4", user_id: "demo", date: "2026-10-21", weight_kg: 75.9, created_at: "2026-10-21T07:00:00Z" },
  { id: "w-5", user_id: "demo", date: "2026-10-23", weight_kg: 75.8, created_at: "2026-10-23T07:00:00Z" },
  { id: "w-6", user_id: "demo", date: "2026-10-25", weight_kg: 75.6, created_at: "2026-10-25T07:00:00Z" },
  { id: "w-7", user_id: "demo", date: "2026-10-27", weight_kg: 75.4, created_at: "2026-10-27T07:00:00Z" },
  { id: "w-8", user_id: "demo", date: "2026-10-29", weight_kg: 75.2, created_at: "2026-10-29T07:00:00Z" },
];

function isMockSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return !url || url.includes("placeholder-project") || url.includes("your-project-ref");
}

/* =========================================================================
   1. WEIGHT ENTRIES & ROLLING AVERAGES
   ========================================================================= */

export async function fetchWeightHistory(): Promise<WeightEntry[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      }
    } catch {
      // Local storage read error
    }
  }

  if (isMockSupabase()) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(SEED_WEIGHTS));
      } catch {}
    }
    return SEED_WEIGHTS;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return SEED_WEIGHTS;

    const { data, error } = await supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error || !data || data.length === 0) {
      return SEED_WEIGHTS;
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(data));
      } catch {}
    }

    return data;
  } catch {
    return SEED_WEIGHTS;
  }
}

export async function logWeightEntry(weightKg: number, dateStr?: string): Promise<WeightEntry> {
  const today = dateStr || new Date().toISOString().split("T")[0];
  const newEntry: WeightEntry = {
    id: "w-" + Date.now().toString(),
    user_id: "user-current",
    date: today,
    weight_kg: Math.round(weightKg * 10) / 10,
    created_at: new Date().toISOString(),
  };

  // 1. Update local storage
  if (typeof window !== "undefined") {
    try {
      const existing = await fetchWeightHistory();
      // Remove any duplicate for the same date
      const filtered = existing.filter((e) => e.date !== today);
      const updated = [...filtered, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(updated));
      localStorage.setItem("bench_and_dal_weight_entries", JSON.stringify(updated));
    } catch {}
  }

  // 2. Sync to Supabase if configured
  if (!isMockSupabase()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newEntry.user_id = user.id;
        await supabase
          .from("weight_entries")
          .upsert({
            user_id: user.id,
            date: today,
            weight_kg: newEntry.weight_kg,
          }, { onConflict: "user_id,date" });
      }
    } catch {}
  }

  return newEntry;
}

export interface WeightChartPoint {
  date: string;
  displayDate: string;
  weight: number;
  rollingAvg: number | null;
  targetWeight: number;
}

export function computeWeightChartSeries(
  entries: WeightEntry[],
  targetWeightKg: number
): WeightChartPoint[] {
  if (!entries || entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((entry, index) => {
    // 7-day rolling window preceding this entry
    const entryDate = new Date(entry.date);
    const windowStart = new Date(entryDate);
    windowStart.setDate(windowStart.getDate() - 6);

    const windowEntries = sorted.filter((e) => {
      const d = new Date(e.date);
      return d >= windowStart && d <= entryDate;
    });

    const sum = windowEntries.reduce((acc, curr) => acc + curr.weight_kg, 0);
    const rollingAvg = windowEntries.length > 0
      ? Math.round((sum / windowEntries.length) * 10) / 10
      : null;

    const parts = entry.date.split("-");
    const displayDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : entry.date;

    return {
      date: entry.date,
      displayDate,
      weight: entry.weight_kg,
      rollingAvg,
      targetWeight: targetWeightKg,
    };
  });
}

/* =========================================================================
   2. CALORIE COACH EVALUATION & ADJUSTMENTS
   ========================================================================= */

export async function fetchCalorieAdjustments(): Promise<CalorieAdjustment[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
      if (local) return JSON.parse(local);
    } catch {}
  }
  return [];
}

export function evaluateUserCalorieCoach(
  entries: WeightEntry[],
  goal: "lose" | "maintain" | "gain" = "lose",
  weeklyRateKg: number = 0.5,
  lastAdjustment?: CalorieAdjustment | null
): CalorieAdjustmentProposal {
  const points: WeightDataPoint[] = entries.map((e) => ({
    date: e.date,
    weight_kg: e.weight_kg,
  }));

  const plannedDelta = goal === "lose" ? -Math.abs(weeklyRateKg) : goal === "gain" ? Math.abs(weeklyRateKg) : 0;

  return evaluateCalorieAdjustment({
    recentWeights: points,
    goal,
    plannedWeeklyChangeKg: plannedDelta,
    currentCalorieAdjustment: lastAdjustment?.delta_kcal || 0,
    lastAdjustmentDate: lastAdjustment?.date,
  });
}

export async function recordCalorieAdjustment(deltaKcal: number, reason: string): Promise<CalorieAdjustment> {
  const adjustment: CalorieAdjustment = {
    id: "adj-" + Date.now().toString(),
    user_id: "user-current",
    date: new Date().toISOString().split("T")[0],
    delta_kcal: deltaKcal,
    reason,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = await fetchCalorieAdjustments();
      const updated = [adjustment, ...current];
      localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(updated));
    } catch {}
  }

  if (!isMockSupabase()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        adjustment.user_id = user.id;
        await supabase.from("calorie_adjustments").insert({
          user_id: user.id,
          date: adjustment.date,
          delta_kcal: deltaKcal,
          reason,
        });
      }
    } catch {}
  }

  return adjustment;
}

/* =========================================================================
   3. BODY MEASUREMENTS
   ========================================================================= */

const SEED_MEASUREMENTS: Measurement[] = [
  {
    id: "m-1",
    user_id: "demo",
    date: "2026-10-15",
    waist_cm: 86.5,
    chest_cm: 98.0,
    arm_cm: 34.0,
    thigh_cm: 57.5,
    created_at: "2026-10-15T07:00:00Z",
  },
];

export async function fetchMeasurements(): Promise<Measurement[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      if (local) return JSON.parse(local);
    } catch {}
  }

  if (isMockSupabase()) {
    return SEED_MEASUREMENTS;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return SEED_MEASUREMENTS;

    const { data } = await supabase
      .from("measurements")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    return data && data.length > 0 ? data : SEED_MEASUREMENTS;
  } catch {
    return SEED_MEASUREMENTS;
  }
}

export async function logMeasurement(data: {
  waist_cm?: number | null;
  chest_cm?: number | null;
  arm_cm?: number | null;
  thigh_cm?: number | null;
  date?: string;
}): Promise<Measurement> {
  const newM: Measurement = {
    id: "m-" + Date.now().toString(),
    user_id: "user-current",
    date: data.date || new Date().toISOString().split("T")[0],
    waist_cm: data.waist_cm ?? null,
    chest_cm: data.chest_cm ?? null,
    arm_cm: data.arm_cm ?? null,
    thigh_cm: data.thigh_cm ?? null,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = await fetchMeasurements();
      const updated = [newM, ...current.filter((m) => m.date !== newM.date)];
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
    } catch {}
  }

  if (!isMockSupabase()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newM.user_id = user.id;
        await supabase.from("measurements").insert({
          user_id: user.id,
          date: newM.date,
          waist_cm: newM.waist_cm,
          chest_cm: newM.chest_cm,
          arm_cm: newM.arm_cm,
          thigh_cm: newM.thigh_cm,
        });
      }
    } catch {}
  }

  return newM;
}

/* =========================================================================
   4. PROGRESS PHOTOS
   ========================================================================= */

export async function fetchProgressPhotos(): Promise<ProgressPhoto[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      if (local) return JSON.parse(local);
    } catch {}
  }
  return [];
}

export async function logProgressPhoto(storagePath: string, note?: string, dateStr?: string): Promise<ProgressPhoto> {
  const newPhoto: ProgressPhoto = {
    id: "p-" + Date.now().toString(),
    user_id: "user-current",
    date: dateStr || new Date().toISOString().split("T")[0],
    storage_path: storagePath,
    note: note || null,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = await fetchProgressPhotos();
      const updated = [newPhoto, ...current];
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    } catch {}
  }

  if (!isMockSupabase()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newPhoto.user_id = user.id;
        await supabase.from("progress_photos").insert({
          user_id: user.id,
          date: newPhoto.date,
          storage_path: newPhoto.storage_path,
          note: newPhoto.note,
        });
      }
    } catch {}
  }

  return newPhoto;
}

/* =========================================================================
   5. MILESTONE BADGES
   ========================================================================= */

export async function fetchEarnedBadges(): Promise<string[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.BADGES);
      if (local) return JSON.parse(local);
    } catch {}
  }

  if (isMockSupabase()) {
    return ["first_workout", "first_pr"];
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ["first_workout", "first_pr"];

    const { data } = await supabase
      .from("badges_earned")
      .select("badge_key")
      .eq("user_id", user.id);

    return data ? data.map((b) => b.badge_key) : ["first_workout", "first_pr"];
  } catch {
    return ["first_workout", "first_pr"];
  }
}

export async function syncAndCheckBadges(stats: UserStatsForBadges): Promise<{
  allEarnedKeys: string[];
  newlyUnlocked: BadgeDefinition[];
}> {
  const currentEarned = await fetchEarnedBadges();
  const evaluation = evaluateBadges({
    ...stats,
    currentlyEarnedBadgeKeys: currentEarned,
  });

  if (evaluation.newlyEarnedBadges.length > 0) {
    const updated = Array.from(new Set([...currentEarned, ...evaluation.allEarnedKeys]));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updated));
      } catch {}
    }

    if (!isMockSupabase()) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const b of evaluation.newlyEarnedBadges) {
            await supabase.from("badges_earned").upsert({
              user_id: user.id,
              badge_key: b.key,
            });
          }
        }
      } catch {}
    }
  }

  return {
    allEarnedKeys: evaluation.allEarnedKeys,
    newlyUnlocked: evaluation.newlyEarnedBadges,
  };
}

/* =========================================================================
   6. WEEKLY REVIEWS & CHECK-INS
   ========================================================================= */

export async function fetchWeeklyCheckins(): Promise<WeeklyCheckin[]> {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.CHECKINS);
      if (local) return JSON.parse(local);
    } catch {}
  }
  return [];
}

export async function logWeeklyCheckin(data: {
  energy: number;
  sleep_quality: number;
  soreness: number;
  mood: number;
  notes?: string;
  date?: string;
}): Promise<WeeklyCheckin> {
  const newCheckin: WeeklyCheckin = {
    id: "chk-" + Date.now().toString(),
    user_id: "user-current",
    date: data.date || new Date().toISOString().split("T")[0],
    energy: data.energy,
    sleep_quality: data.sleep_quality,
    soreness: data.soreness,
    mood: data.mood,
    notes: data.notes || null,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = await fetchWeeklyCheckins();
      const updated = [newCheckin, ...current.filter((c) => c.date !== newCheckin.date)];
      localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(updated));
    } catch {}
  }

  if (!isMockSupabase()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newCheckin.user_id = user.id;
        await supabase.from("weekly_checkins").insert({
          user_id: user.id,
          date: newCheckin.date,
          energy: newCheckin.energy,
          sleep_quality: newCheckin.sleep_quality,
          soreness: newCheckin.soreness,
          mood: newCheckin.mood,
          notes: newCheckin.notes,
        });
      }
    } catch {}
  }

  return newCheckin;
}
