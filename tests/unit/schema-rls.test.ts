import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Database Schema & Seed Verification", () => {
  const schemaPath = path.resolve(__dirname, "../../supabase/migrations/20261029000000_initial_schema.sql");
  const seedPath = path.resolve(__dirname, "../../supabase/seed.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  it("defines all 21 tables with row level security enabled", () => {
    const requiredTables = [
      "profiles",
      "weight_entries",
      "exercises",
      "workout_templates",
      "template_exercises",
      "exercise_alternatives",
      "workout_sessions",
      "set_logs",
      "personal_records",
      "foods",
      "food_logs",
      "favorite_foods",
      "daily_habits",
      "weekly_checkins",
      "calorie_adjustments",
      "measurements",
      "progress_photos",
      "injury_notes",
      "badges_earned",
      "push_subscriptions",
      "grocery_items",
    ];

    for (const table of requiredTables) {
      expect(schemaSql).toContain(`create table if not exists public.${table}`);
      expect(schemaSql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("contains strictly user_id isolation policies on user-owned tables", () => {
    expect(schemaSql).toContain("user_id = auth.uid()");
    expect(schemaSql).toContain("create policy \"Users can select own profile\"");
    expect(schemaSql).toContain("create policy \"Users can manage own weight entries\"");
    expect(schemaSql).toContain("create policy \"Users can manage own workout sessions\"");
    expect(schemaSql).toContain("create policy \"Users can manage own set logs\"");
    expect(schemaSql).toContain("create policy \"Users can manage own food logs\"");
  });

  it("strictly contains ZERO meat, chicken, or fish in the seed SQL", () => {
    const forbiddenKeywords = ["chicken", "mutton", "beef", "pork", "fish", "salmon", "tuna", "prawn", "seafood", "turkey"];
    const lowerSeed = seedSql.toLowerCase();

    for (const keyword of forbiddenKeywords) {
      expect(lowerSeed).not.toContain(keyword);
    }
  });

  it("seeds all 4 Upper/Lower workout templates", () => {
    expect(seedSql).toContain("'UA', 'Upper Body A'");
    expect(seedSql).toContain("'LA', 'Lower Body A'");
    expect(seedSql).toContain("'UB', 'Upper Body B'");
    expect(seedSql).toContain("'LB', 'Lower Body B'");
  });

  it("seeds core dumbbell-only exercises with rest timers and rep ranges", () => {
    expect(seedSql).toContain("Flat dumbbell bench press");
    expect(seedSql).toContain("One-arm dumbbell row");
    expect(seedSql).toContain("Goblet squat");
    expect(seedSql).toContain("Dumbbell Romanian deadlift");
    expect(seedSql).toContain("Bulgarian split squat");
    expect(seedSql).toContain("Arnold press");
  });

  it("seeds 40+ Indian vegetarian staples and egg items", () => {
    expect(seedSql).toContain("Paneer (Raw, Low Fat)");
    expect(seedSql).toContain("Soya Chunks (Nutrela, Dry)");
    expect(seedSql).toContain("Tofu (Firm)");
    expect(seedSql).toContain("Roasted Chana (Bhuna Chana)");
    expect(seedSql).toContain("Sattu (Roasted Gram Flour)");
    expect(seedSql).toContain("Yellow Moong Dal (Cooked)");
    expect(seedSql).toContain("Rajma / Kidney Beans (Cooked)");
    expect(seedSql).toContain("Chole / Chickpea Curry (Cooked)");
    expect(seedSql).toContain("Sprouted Moong (Raw)");
    expect(seedSql).toContain("Besan Chilla with Veggies");
    expect(seedSql).toContain("Moong Dal Chilla");
    expect(seedSql).toContain("Whole Egg (Hard Boiled)");
    expect(seedSql).toContain("Whey Protein Isolate");
  });

  it("properly flags egg items with diet = 'egg' so vegetarian users filter them out", () => {
    expect(seedSql).toContain("'food_egg_boiled_whole', null, 'Whole Egg (Hard Boiled)', '1 large (50g)', 6.3, 78, 'egg', false");
    expect(seedSql).toContain("'food_egg_whites_boiled', null, 'Egg Whites (Boiled)', '2 large whites (66g)', 7.2, 34, 'egg', false");
  });
});
