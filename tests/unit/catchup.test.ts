import { describe, it, expect } from "vitest";
import { suggestProteinCatchUp, FoodCandidate } from "@/lib/calc/catchup";

describe("Protein Catch-up Engine", () => {
  const sampleFoods: FoodCandidate[] = [
    {
      id: "food_soya_chunks",
      name: "Soya Chunks (Dry)",
      serving: "50g",
      protein_g: 26.0,
      calories: 172,
      diet: "veg",
      optional: false,
    },
    {
      id: "food_paneer_low_fat",
      name: "Paneer (Low Fat)",
      serving: "100g",
      protein_g: 22.0,
      calories: 180,
      diet: "veg",
      optional: false,
    },
    {
      id: "food_egg_whites",
      name: "Egg Whites",
      serving: "2 whites",
      protein_g: 7.2,
      calories: 34,
      diet: "egg",
      optional: false,
    },
    {
      id: "food_whey_isolate",
      name: "Whey Protein Isolate",
      serving: "1 scoop",
      protein_g: 27.0,
      calories: 115,
      diet: "veg",
      optional: true, // Optional powder item
    },
    {
      id: "food_roti",
      name: "Roti",
      serving: "1 medium",
      protein_g: 3.2,
      calories: 85,
      diet: "veg",
      optional: false,
    },
  ];

  it("excludes optional items (whey powders) from whole food catch-up recommendations", () => {
    const suggestions = suggestProteinCatchUp(sampleFoods, 20, "veg");
    const ids = suggestions.map((s) => s.food.id);
    expect(ids).not.toContain("food_whey_isolate");
  });

  it("strictly hides egg foods from pure vegetarian users", () => {
    const suggestions = suggestProteinCatchUp(sampleFoods, 20, "veg");
    const ids = suggestions.map((s) => s.food.id);
    expect(ids).not.toContain("food_egg_whites");
    expect(suggestions[0].food.id).toBe("food_soya_chunks"); // Highest density veg whole food
  });

  it("includes egg foods for eggetarian users when density is superior", () => {
    // Egg whites: 7.2 / 34 = 0.211 g/kcal
    // Soya chunks: 26 / 172 = 0.151 g/kcal
    const suggestions = suggestProteinCatchUp(sampleFoods, 15, "egg");
    expect(suggestions[0].food.id).toBe("food_egg_whites");
  });

  it("calculates suggested quantity and rounded servings text to close the gap", () => {
    // Gap: 26g protein, using Soya Chunks (26g per serving) -> 1x serving
    const suggestions = suggestProteinCatchUp(sampleFoods, 26, "veg");
    const soya = suggestions.find((s) => s.food.id === "food_soya_chunks");

    expect(soya).toBeDefined();
    expect(soya!.suggestedQuantity).toBe(1);
    expect(soya!.servingsText).toContain("1 serving");
    expect(soya!.proteinProvidedGrams).toBe(26);
    expect(soya!.caloriesAdded).toBe(172);
  });

  it("returns empty array when protein gap is 0 or negative", () => {
    expect(suggestProteinCatchUp(sampleFoods, 0, "veg")).toEqual([]);
    expect(suggestProteinCatchUp(sampleFoods, -5, "veg")).toEqual([]);
  });
});
