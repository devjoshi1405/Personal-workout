import { createClient } from "@/lib/supabase/client";
import { Food, FoodLog, DietType, MealType } from "./types";
import { suggestProteinCatchUp, CatchUpSuggestion, FoodCandidate } from "@/lib/calc/catchup";

export interface LoggedFoodItem extends FoodLog {
  food_details?: Food;
}

export interface DailyMacroTotals {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

// 45+ Indian Vegetarian & Eggetarian Database
export const SEEDED_INDIAN_FOODS: FoodCandidate[] = [
  // High-Protein Vegetarian Core Staples
  { id: "food_paneer_raw", name: "Paneer (Raw, Low Fat)", serving: "100g", protein_g: 22.0, calories: 180, diet: "veg", optional: false },
  { id: "food_paneer_regular", name: "Paneer (Full Fat)", serving: "100g", protein_g: 18.0, calories: 265, diet: "veg", optional: false },
  { id: "food_soya_chunks_dry", name: "Soya Chunks (Nutrela, Dry)", serving: "50g", protein_g: 26.0, calories: 172, diet: "veg", optional: false },
  { id: "food_soya_chunks_cooked", name: "Soya Chunks (Boiled / Cooked)", serving: "100g", protein_g: 17.5, calories: 125, diet: "veg", optional: false },
  { id: "food_tofu_firm", name: "Tofu (Firm)", serving: "100g", protein_g: 14.0, calories: 120, diet: "veg", optional: false },
  { id: "food_roasted_chana", name: "Roasted Chana (Bhuna Chana)", serving: "50g", protein_g: 11.5, calories: 185, diet: "veg", optional: false },
  { id: "food_sattu", name: "Sattu (Roasted Gram Flour)", serving: "50g", protein_g: 13.0, calories: 205, diet: "veg", optional: false },
  { id: "food_curd_dahi", name: "Curd / Dahi (Homemade)", serving: "100g", protein_g: 3.5, calories: 60, diet: "veg", optional: false },
  { id: "food_greek_curd", name: "Greek Yogurt / Hung Curd (Plain)", serving: "100g", protein_g: 9.0, calories: 75, diet: "veg", optional: false },
  { id: "food_toned_milk", name: "Cow Milk (Toned)", serving: "250ml (1 glass)", protein_g: 8.0, calories: 150, diet: "veg", optional: false },
  { id: "food_sprouted_moong", name: "Sprouted Moong (Raw)", serving: "100g", protein_g: 7.5, calories: 90, diet: "veg", optional: false },

  // Indian Dals & Legumes (Cooked)
  { id: "food_yellow_moong_dal", name: "Yellow Moong Dal (Cooked)", serving: "1 cup (200g)", protein_g: 8.5, calories: 140, diet: "veg", optional: false },
  { id: "food_toor_dal", name: "Toor / Arhar Dal (Cooked)", serving: "1 cup (200g)", protein_g: 8.0, calories: 160, diet: "veg", optional: false },
  { id: "food_masoor_dal", name: "Masoor Dal (Cooked)", serving: "1 cup (200g)", protein_g: 9.0, calories: 150, diet: "veg", optional: false },
  { id: "food_chana_dal", name: "Chana Dal (Cooked)", serving: "1 cup (200g)", protein_g: 10.0, calories: 180, diet: "veg", optional: false },
  { id: "food_rajma", name: "Rajma / Kidney Beans (Cooked)", serving: "1 cup (200g)", protein_g: 9.5, calories: 190, diet: "veg", optional: false },
  { id: "food_chole", name: "Chole / Chickpea Curry (Cooked)", serving: "1 cup (200g)", protein_g: 10.0, calories: 210, diet: "veg", optional: false },
  { id: "food_kala_chana", name: "Kala Chana / Black Chickpeas", serving: "1 cup (180g)", protein_g: 11.0, calories: 195, diet: "veg", optional: false },

  // Breakfast, Chillas & Grains
  { id: "food_besan_chilla", name: "Besan Chilla with Veggies", serving: "1 medium (60g)", protein_g: 6.0, calories: 120, diet: "veg", optional: false },
  { id: "food_moong_chilla", name: "Moong Dal Chilla", serving: "1 medium (60g)", protein_g: 7.5, calories: 130, diet: "veg", optional: false },
  { id: "food_poha", name: "Poha with Peanuts & Veggies", serving: "1 plate (200g)", protein_g: 4.5, calories: 230, diet: "veg", optional: false },
  { id: "food_upma", name: "Rava Upma with Veggies", serving: "1 plate (200g)", protein_g: 5.0, calories: 220, diet: "veg", optional: false },
  { id: "food_idli", name: "Steamed Idli (Rice & Urad Dal)", serving: "2 idlis (100g)", protein_g: 4.0, calories: 140, diet: "veg", optional: false },
  { id: "food_dosa", name: "Plain Dosa", serving: "1 medium (80g)", protein_g: 3.5, calories: 160, diet: "veg", optional: false },
  { id: "food_khichdi", name: "Moong Dal Khichdi", serving: "1 cup (200g)", protein_g: 7.0, calories: 180, diet: "veg", optional: false },

  // Indian Dishes & Prepared Staples
  { id: "food_paneer_bhurji", name: "Paneer Bhurji with Onion & Tomato", serving: "150g", protein_g: 16.0, calories: 240, diet: "veg", optional: false },
  { id: "food_soya_bhurji", name: "Soya Granules Bhurji", serving: "150g", protein_g: 20.0, calories: 190, diet: "veg", optional: false },
  { id: "food_makhana", name: "Roasted Foxnuts / Makhana", serving: "30g", protein_g: 3.0, calories: 110, diet: "veg", optional: false },
  { id: "food_soy_milk", name: "Soy Milk (Unsweetened)", serving: "250ml", protein_g: 8.0, calories: 95, diet: "veg", optional: false },

  // Grains, Nuts, Seeds & Fruits
  { id: "food_roti", name: "Roti / Chapati (Whole Wheat)", serving: "1 medium (35g)", protein_g: 3.2, calories: 85, diet: "veg", optional: false },
  { id: "food_brown_rice", name: "Brown Rice (Cooked)", serving: "1 cup (150g)", protein_g: 4.0, calories: 170, diet: "veg", optional: false },
  { id: "food_white_rice", name: "White Rice (Cooked)", serving: "1 cup (150g)", protein_g: 3.5, calories: 180, diet: "veg", optional: false },
  { id: "food_rolled_oats", name: "Rolled Oats (Dry)", serving: "50g", protein_g: 6.5, calories: 190, diet: "veg", optional: false },
  { id: "food_peanut_butter", name: "Peanut Butter (Natural)", serving: "1 tbsp (32g)", protein_g: 8.0, calories: 190, diet: "veg", optional: false },
  { id: "food_peanuts", name: "Peanuts (Roasted Unsalted)", serving: "30g", protein_g: 7.5, calories: 175, diet: "veg", optional: false },
  { id: "food_almonds", name: "Almonds (Raw)", serving: "30g (~23 nuts)", protein_g: 6.0, calories: 170, diet: "veg", optional: false },
  { id: "food_chia_seeds", name: "Chia Seeds", serving: "1 tbsp (15g)", protein_g: 2.5, calories: 75, diet: "veg", optional: false },
  { id: "food_flaxseeds", name: "Flaxseeds (Ground Roasted)", serving: "1 tbsp (10g)", protein_g: 2.0, calories: 55, diet: "veg", optional: false },
  { id: "food_banana", name: "Banana (Ripe)", serving: "1 medium (118g)", protein_g: 1.3, calories: 105, diet: "veg", optional: false },

  // Egg Items (Flagged diet='egg' - hidden from veg users)
  { id: "food_egg_boiled_whole", name: "Whole Egg (Hard Boiled)", serving: "1 large (50g)", protein_g: 6.3, calories: 78, diet: "egg", optional: false },
  { id: "food_egg_whites_boiled", name: "Egg Whites (Boiled)", serving: "2 whites (66g)", protein_g: 7.2, calories: 34, diet: "egg", optional: false },
  { id: "food_egg_omelette", name: "Egg Omelette (2 Eggs, 1 tsp Oil)", serving: "100g", protein_g: 13.0, calories: 180, diet: "egg", optional: false },
  { id: "food_egg_bhurji", name: "Egg Bhurji (2 Eggs, Onion, Tomato)", serving: "120g", protein_g: 13.5, calories: 190, diet: "egg", optional: false },

  // Protein Powders (Flagged optional=true)
  { id: "food_whey_isolate", name: "Whey Protein Isolate", serving: "1 scoop (30g)", protein_g: 27.0, calories: 115, diet: "veg", optional: true },
  { id: "food_whey_concentrate", name: "Whey Protein Concentrate", serving: "1 scoop (33g)", protein_g: 24.0, calories: 130, diet: "veg", optional: true },
  { id: "food_plant_protein", name: "Plant Protein Powder (Pea & Rice)", serving: "1 scoop (33g)", protein_g: 25.0, calories: 125, diet: "veg", optional: true },
];

const FOOD_LOGS_STORAGE_KEY = "bench_and_dal_food_logs";
const CUSTOM_FOODS_STORAGE_KEY = "bench_and_dal_custom_foods";
const FAVORITE_FOODS_STORAGE_KEY = "bench_and_dal_favorite_foods";

/**
 * Searches food database filtering strictly by user diet.
 */
export function searchFoods(query: string, userDiet: DietType): FoodCandidate[] {
  const customFoods = getStoredCustomFoods();
  const all = [...SEEDED_INDIAN_FOODS, ...customFoods];

  // Pure vegetarian users NEVER see egg items
  const dietFiltered = all.filter((f) => {
    if (userDiet === "veg" && f.diet === "egg") return false;
    return true;
  });

  if (!query.trim()) return dietFiltered;

  const q = query.toLowerCase().trim();
  return dietFiltered.filter((f) => f.name.toLowerCase().includes(q));
}

/**
 * Loads today's logged food entries.
 */
export async function loadTodayFoodLogs(dateStr: string): Promise<LoggedFoodItem[]> {
  const supabase = createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isRealSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project");

  if (isRealSupabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: logs } = await supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", dateStr);

        if (logs) {
          return logs as LoggedFoodItem[];
        }
      }
    } catch (err) {
      console.warn("Supabase food log fetch error:", err);
    }
  }

  // Fallback to local storage
  const stored = getStoredFoodLogs();
  return stored.filter((l) => l.date === dateStr);
}

/**
 * Adds an item to the user's daily food log.
 */
export async function logFoodItem(params: {
  date: string;
  meal: MealType;
  food: FoodCandidate;
  quantity?: number;
}): Promise<LoggedFoodItem> {
  const supabase = createClient();
  const quantity = params.quantity || 1.0;
  const entryId = `food_log_${Date.now()}`;

  const proteinG = Math.round(params.food.protein_g * quantity * 10) / 10;
  const calories = Math.round(params.food.calories * quantity);

  let userId = "demo-user";

  const newLog: LoggedFoodItem = {
    id: entryId,
    user_id: userId,
    date: params.date,
    meal: params.meal,
    food_id: params.food.id,
    name: params.food.name,
    protein_g: proteinG,
    calories,
    quantity,
    created_at: new Date().toISOString(),
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isRealSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project");

  if (isRealSupabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newLog.user_id = user.id;
        await supabase.from("food_logs").insert({
          user_id: user.id,
          date: params.date,
          meal: params.meal,
          food_id: params.food.id,
          name: params.food.name,
          protein_g: proteinG,
          calories,
          quantity,
        });
      }
    } catch (err) {
      console.warn("Supabase log food insert error:", err);
    }
  }

  // Always mirror to local storage
  saveStoredFoodLog(newLog);
  return newLog;
}

/**
 * Deletes a logged food item.
 */
export async function deleteFoodLog(id: string): Promise<void> {
  const supabase = createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isRealSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project");

  if (isRealSupabase) {
    try {
      await supabase.from("food_logs").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase food log delete error:", err);
    }
  }

  deleteStoredFoodLog(id);
}

/**
 * Calculates daily macro totals from a list of logged food items.
 */
export function calculateDailyMacros(logs: LoggedFoodItem[]): DailyMacroTotals {
  let calories = 0;
  let proteinGrams = 0;

  for (const log of logs) {
    calories += log.calories;
    proteinGrams += log.protein_g;
  }

  // Approximate carbs & fats based on healthy whole-food vegetarian distributions
  const fatCalories = calories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);
  const remainingCalories = Math.max(0, calories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCalories / 4);

  return {
    calories: Math.round(calories),
    proteinGrams: Math.round(proteinGrams * 10) / 10,
    carbGrams,
    fatGrams,
  };
}

/**
 * Spreads extra calories across the remaining days of the week when a user
 * marks a date as a flexible / festival day.
 */
export function calculateFlexibleDayDistribution(params: {
  regularDailyCalories: number;
  flexibleDaySurplusCalories: number;
  daysRemainingInWeek: number;
}): {
  flexibleDayCalories: number;
  remainingDaysTargetCalories: number;
  dailyOffset: number;
} {
  const { regularDailyCalories, flexibleDaySurplusCalories, daysRemainingInWeek } = params;

  if (daysRemainingInWeek <= 0) {
    return {
      flexibleDayCalories: regularDailyCalories + flexibleDaySurplusCalories,
      remainingDaysTargetCalories: regularDailyCalories,
      dailyOffset: 0,
    };
  }

  const dailyReduction = Math.round(flexibleDaySurplusCalories / daysRemainingInWeek / 10) * 10;
  const adjustedTarget = Math.max(1200, regularDailyCalories - dailyReduction);

  return {
    flexibleDayCalories: regularDailyCalories + flexibleDaySurplusCalories,
    remainingDaysTargetCalories: adjustedTarget,
    dailyOffset: -dailyReduction,
  };
}

// -----------------------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -----------------------------------------------------------------------------

function getStoredFoodLogs(): LoggedFoodItem[] {
  if (typeof window === "undefined") return [];
  const s = localStorage.getItem(FOOD_LOGS_STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function saveStoredFoodLog(log: LoggedFoodItem) {
  if (typeof window === "undefined") return;
  const logs = getStoredFoodLogs();
  logs.push(log);
  localStorage.setItem(FOOD_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

function deleteStoredFoodLog(id: string) {
  if (typeof window === "undefined") return;
  const logs = getStoredFoodLogs().filter((l) => l.id !== id);
  localStorage.setItem(FOOD_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

function getStoredCustomFoods(): FoodCandidate[] {
  if (typeof window === "undefined") return [];
  const s = localStorage.getItem(CUSTOM_FOODS_STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

export function saveCustomFood(food: FoodCandidate) {
  if (typeof window === "undefined") return;
  const foods = getStoredCustomFoods();
  foods.push(food);
  localStorage.setItem(CUSTOM_FOODS_STORAGE_KEY, JSON.stringify(foods));
}
