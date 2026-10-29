import { createClient } from "@/lib/supabase/client";
import { Profile, WeightEntry, DailyHabit } from "./types";
import { calculatePlan, PlanOutput } from "@/lib/calc/plan";

const LOCAL_PROFILE_KEY = "bench_and_dal_user_profile";
const LOCAL_WEIGHTS_KEY = "bench_and_dal_weight_entries";
const LOCAL_HABITS_KEY = "bench_and_dal_daily_habits";

export interface FullUserData {
  profile: Profile | null;
  plan: PlanOutput | null;
  weightEntries: WeightEntry[];
  todayHabits: DailyHabit | null;
}

/**
 * Default fallback profile for immediate interactive preview/demo.
 */
export const DEFAULT_DEMO_PROFILE: Profile = {
  user_id: "demo-user",
  name: "Arjun",
  sex: "male",
  age: 27,
  height_cm: 176,
  activity_factor: 1.375,
  diet: "veg",
  goal_weight_kg: 72.0,
  target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 70).toISOString().split("T")[0],
  dumbbell_step_kg: 2.0,
  start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split("T")[0],
  calorie_adjustment: 0,
  theme: "system",
  timezone: "Asia/Kolkata",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Loads current user profile and calculated targets.
 */
export async function loadUserProfile(): Promise<FullUserData> {
  const supabase = createClient();
  let profile: Profile | null = null;
  let weightEntries: WeightEntry[] = [];
  let todayHabits: DailyHabit | null = null;

  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        profile = profileData as Profile;
      }

      // 2. Fetch Weight Entries
      const { data: weightsData } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (weightsData) {
        weightEntries = weightsData as WeightEntry[];
      }

      // 3. Fetch Today's Daily Habits
      const { data: habitData } = await supabase
        .from("daily_habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (habitData) {
        todayHabits = habitData as DailyHabit;
      }
    }
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to local storage:", err);
  }

  // Fallback to local storage if not found in Supabase
  if (!profile && typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (saved) {
      try {
        profile = JSON.parse(saved);
      } catch {
        profile = null;
      }
    }
    let savedWeights = localStorage.getItem(LOCAL_WEIGHTS_KEY);
    if (!savedWeights) {
      savedWeights = localStorage.getItem("bench_and_dal_weights");
    }
    if (savedWeights) {
      try {
        weightEntries = JSON.parse(savedWeights);
      } catch {
        weightEntries = [];
      }
    }
    const savedHabits = localStorage.getItem(`${LOCAL_HABITS_KEY}_${todayStr}`);
    if (savedHabits) {
      try {
        todayHabits = JSON.parse(savedHabits);
      } catch {
        todayHabits = null;
      }
    }
  }

  // Use demo profile if brand new test
  if (!profile) {
    profile = DEFAULT_DEMO_PROFILE;
    if (weightEntries.length === 0) {
      weightEntries = [
        {
          id: "w1",
          user_id: profile.user_id,
          date: profile.start_date,
          weight_kg: 80.0,
          created_at: profile.start_date,
        },
        {
          id: "w2",
          user_id: profile.user_id,
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split("T")[0],
          weight_kg: 79.2,
          created_at: new Date().toISOString(),
        },
        {
          id: "w3",
          user_id: profile.user_id,
          date: todayStr,
          weight_kg: 78.4,
          created_at: new Date().toISOString(),
        },
      ];
    }
  }

  // Calculate current weight
  const latestWeight = weightEntries.length > 0
    ? weightEntries[weightEntries.length - 1].weight_kg
    : profile.goal_weight_kg + 5;

  const plan = calculatePlan({
    currentWeightKg: latestWeight,
    targetWeightKg: profile.goal_weight_kg,
    heightCm: profile.height_cm,
    age: profile.age,
    sex: profile.sex,
    activityFactor: Number(profile.activity_factor),
    startDate: profile.start_date,
    targetDate: profile.target_date,
    calorieAdjustment: profile.calorie_adjustment,
  });

  return {
    profile,
    plan,
    weightEntries,
    todayHabits,
  };
}

/**
 * Saves user profile and initial weight entry.
 */
export async function saveUserProfile(
  profileData: Omit<Profile, "created_at" | "updated_at">,
  initialWeightKg: number
): Promise<void> {
  const supabase = createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user ? user.id : profileData.user_id || "demo-user";

    const fullProfile: Profile = {
      ...profileData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Upsert Profile
    if (user) {
      await supabase.from("profiles").upsert(fullProfile);
      // 2. Insert First Weight Entry
      await supabase.from("weight_entries").upsert({
        user_id: userId,
        date: todayStr,
        weight_kg: initialWeightKg,
      }, { onConflict: "user_id,date" });
    }

    // Always mirror to local storage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(fullProfile));
      const existingWeightsStr = localStorage.getItem(LOCAL_WEIGHTS_KEY) || localStorage.getItem("bench_and_dal_weights");
      const list: WeightEntry[] = existingWeightsStr ? JSON.parse(existingWeightsStr) : [];
      const filtered = list.filter((w) => w.date !== todayStr);
      filtered.push({
        id: `w_${Date.now()}`,
        user_id: userId,
        date: todayStr,
        weight_kg: initialWeightKg,
        created_at: new Date().toISOString(),
      });
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      localStorage.setItem(LOCAL_WEIGHTS_KEY, JSON.stringify(filtered));
      localStorage.setItem("bench_and_dal_weights", JSON.stringify(filtered));
    }
  } catch (err) {
    console.error("Error saving profile:", err);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profileData));
    }
  }
}

/**
 * Updates water glasses in daily habits with instant optimistic feedback.
 */
export async function updateWaterGlasses(delta: number): Promise<number> {
  const supabase = createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  let currentGlasses = 0;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`water_${todayStr}`);
    currentGlasses = stored ? parseInt(stored, 10) : 0;
  }

  const newGlasses = Math.max(0, currentGlasses + delta);
  if (typeof window !== "undefined") {
    localStorage.setItem(`water_${todayStr}`, newGlasses.toString());
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("daily_habits").upsert({
        user_id: user.id,
        date: todayStr,
        water_glasses: newGlasses,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,date" });
    }
  } catch (err) {
    console.warn("Could not sync water with Supabase:", err);
  }

  return newGlasses;
}
