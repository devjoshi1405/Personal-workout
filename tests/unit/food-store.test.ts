import { describe, it, expect } from "vitest";
import { searchFoods, calculateDailyMacros } from "@/lib/db/food-store";
import { LoggedFoodItem } from "@/lib/db/food-store";

describe("Food Store & Indian Nutrition Engine", () => {
  it("strictly filters out non-vegetarian items (pure vegetarian purity)", () => {
    const vegResults = searchFoods("", "veg");
    expect(vegResults.length).toBeGreaterThan(10);

    // Vegetarian user must never see egg items (diet === 'egg')
    const hasEggDiet = vegResults.some((f) => f.diet === "egg");
    expect(hasEggDiet).toBe(false);

    // Absolutely zero meat, poultry, or fish
    const forbidden = ["chicken", "mutton", "fish", "beef", "pork", "prawn", "salmon", "turkey"];
    for (const item of vegResults) {
      for (const word of forbidden) {
        expect(item.name.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("includes eggs only when user diet is eggetarian", () => {
    const eggResults = searchFoods("egg", "egg");
    expect(eggResults.length).toBeGreaterThan(0);
    expect(eggResults.some((f) => f.diet === "egg")).toBe(true);
  });

  it("accurately aggregates daily calories and protein across meals", () => {
    const sampleLogs: LoggedFoodItem[] = [
      {
        id: "1",
        user_id: "u1",
        date: "2026-10-29",
        meal: "breakfast",
        food_id: "paneer",
        name: "Low-fat Paneer",
        protein_g: 28,
        calories: 320,
        quantity: 1,
        created_at: "2026-10-29T08:00:00Z",
      },
      {
        id: "2",
        user_id: "u1",
        date: "2026-10-29",
        meal: "lunch",
        food_id: "soya",
        name: "Soya Chunks",
        protein_g: 26,
        calories: 175,
        quantity: 1,
        created_at: "2026-10-29T13:00:00Z",
      },
      {
        id: "3",
        user_id: "u1",
        date: "2026-10-29",
        meal: "snack",
        food_id: "chana",
        name: "Roasted Chana",
        protein_g: 10,
        calories: 180,
        quantity: 1,
        created_at: "2026-10-29T17:00:00Z",
      },
      {
        id: "4",
        user_id: "u1",
        date: "2026-10-29",
        meal: "dinner",
        food_id: "dal",
        name: "Moong Dal",
        protein_g: 14,
        calories: 220,
        quantity: 1,
        created_at: "2026-10-29T20:30:00Z",
      },
    ];

    const totals = calculateDailyMacros(sampleLogs);
    expect(totals.proteinGrams).toBe(78);
    expect(totals.calories).toBe(895);
  });
});
