import { DietType } from "@/lib/db/types";

export interface FoodCandidate {
  id: string;
  name: string;
  serving: string;
  protein_g: number;
  calories: number;
  diet: DietType;
  optional: boolean;
}

export interface CatchUpSuggestion {
  food: FoodCandidate;
  proteinDensity: number; // grams of protein per 100 calories
  suggestedQuantity: number; // multiplier of the serving size
  servingsText: string;
  proteinProvidedGrams: number;
  caloriesAdded: number;
}

/**
 * Protein Catch-up Engine:
 * When a user is short on their daily protein goal, finds the top 3 whole foods
 * with the highest protein-to-calorie ratio to cover the deficit.
 * Excludes optional items (like whey powders) and respects the user's diet (veg vs egg).
 */
export function suggestProteinCatchUp(
  foods: FoodCandidate[],
  proteinGapGrams: number,
  userDiet: DietType,
  maxSuggestions: number = 3
): CatchUpSuggestion[] {
  if (proteinGapGrams <= 0 || !foods || foods.length === 0) {
    return [];
  }

  // 1. Filter eligible foods:
  // - Exclude optional items (e.g. powders)
  // - If user is 'veg', exclude foods where diet === 'egg'
  // - Must have protein_g > 0 and calories > 0
  const eligible = foods.filter((f) => {
    if (f.optional) return false;
    if (userDiet === "veg" && f.diet === "egg") return false;
    return f.protein_g > 0 && f.calories > 0;
  });

  // 2. Sort by protein density: protein_g / calories descending
  const sorted = [...eligible].sort((a, b) => {
    const densityA = a.protein_g / a.calories;
    const densityB = b.protein_g / b.calories;
    return densityB - densityA;
  });

  // 3. Take top candidates and compute suggested quantity to close the gap
  const topCandidates = sorted.slice(0, maxSuggestions);

  return topCandidates.map((food) => {
    const rawQuantity = proteinGapGrams / food.protein_g;
    // Round quantity to 1 decimal place (or minimum 0.5)
    const suggestedQuantity = Math.max(0.5, Math.round(rawQuantity * 10) / 10);
    const proteinProvidedGrams = Math.round(suggestedQuantity * food.protein_g * 10) / 10;
    const caloriesAdded = Math.round(suggestedQuantity * food.calories);
    const proteinDensity = Math.round((food.protein_g / food.calories) * 100 * 10) / 10;

    let servingsText = `${suggestedQuantity}x serving (${food.serving})`;
    if (suggestedQuantity === 1) {
      servingsText = `1 serving (${food.serving})`;
    }

    return {
      food,
      proteinDensity,
      suggestedQuantity,
      servingsText,
      proteinProvidedGrams,
      caloriesAdded,
    };
  });
}
