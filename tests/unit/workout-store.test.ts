import { describe, it, expect } from "vitest";
import {
  getDeloadRecommendation,
  loadWorkoutTemplate,
  UPPER_WARMUP,
  LOWER_WARMUP,
  FULL_BODY_MOBILITY_REST_DAY,
} from "@/lib/db/workout-store";

describe("Workout Engine & Deload Logic", () => {
  it("flags deload week on every 7th week of the plan", () => {
    // Week 1 to 6 should not be deload
    expect(getDeloadRecommendation(1).isDeloadWeek).toBe(false);
    expect(getDeloadRecommendation(6).isDeloadWeek).toBe(false);

    // Week 7 is a deload week
    const deloadW7 = getDeloadRecommendation(7);
    expect(deloadW7.isDeloadWeek).toBe(true);
    expect(deloadW7.message).toContain("2 sets per exercise at approximately 70%");

    // Week 14 is also a deload week
    expect(getDeloadRecommendation(14).isDeloadWeek).toBe(true);
  });

  it("suggests a lighter session when user reports high soreness and low energy", () => {
    // Soreness 4 (high), Energy 2 (low)
    const rec = getDeloadRecommendation(3, 4, 2);
    expect(rec.isDeloadWeek).toBe(false);
    expect(rec.isFatigued).toBe(true);
    expect(rec.message).toContain("High soreness and low energy");
  });

  it("loads 4-day split templates with dumbbell-only exercises and rest periods", async () => {
    const ua = await loadWorkoutTemplate("UA");
    expect(ua).toBeDefined();
    expect(ua!.template.name).toBe("Upper Body A");
    expect(ua!.exercises.length).toBe(6);
    expect(ua!.exercises[0].exercise.name).toBe("Flat dumbbell bench press");
    expect(ua!.exercises[0].rest_seconds).toBe(120);

    const la = await loadWorkoutTemplate("LA");
    expect(la).toBeDefined();
    expect(la!.template.name).toBe("Lower Body A");
    expect(la!.exercises[0].exercise.name).toBe("Goblet squat");
  });

  it("provides comprehensive dynamic warm-ups and rest-day mobility flows", () => {
    expect(UPPER_WARMUP.length).toBeGreaterThanOrEqual(4);
    expect(LOWER_WARMUP.length).toBeGreaterThanOrEqual(4);
    expect(FULL_BODY_MOBILITY_REST_DAY.length).toBeGreaterThanOrEqual(5);
  });
});
