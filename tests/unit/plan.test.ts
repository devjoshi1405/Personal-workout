import { describe, it, expect } from "vitest";
import { calculatePlan } from "@/lib/calc/plan";

describe("Goal and Calorie Plan Engine", () => {
  const baseInput = {
    currentWeightKg: 80,
    targetWeightKg: 74,
    heightCm: 175,
    age: 28,
    sex: "male" as const,
    activityFactor: 1.375,
    startDate: "2026-01-01",
    targetDate: "2026-03-26", // 12 weeks
  };

  it("identifies 'lose' goal when target weight is below current weight", () => {
    const plan = calculatePlan(baseInput);
    expect(plan.goal).toBe("lose");
    expect(plan.deltaKg).toBe(-6);
  });

  it("identifies 'maintain' goal when delta is within 0.3 kg", () => {
    const plan = calculatePlan({
      ...baseInput,
      targetWeightKg: 80.2,
    });
    expect(plan.goal).toBe("maintain");
    expect(plan.walkingMinutesPerDay).toBe(20);
    expect(plan.nutrition.proteinGrams).toBe(144); // 80 * 1.8 = 144
  });

  it("identifies 'gain' goal when target weight is above current weight", () => {
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 65,
      targetWeightKg: 70,
      targetDate: "2026-06-01",
    });
    expect(plan.goal).toBe("gain");
    expect(plan.walkingMinutesPerDay).toBe(15);
  });

  it("enforces safe loss cap min(0.75, 0.008 * weight) and calculates realistic target date", () => {
    // 80 kg * 0.008 = 0.64 kg/wk cap
    // Desired: lose 8 kg in 4 weeks (2.0 kg/wk) -> exceeds cap!
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 80,
      targetWeightKg: 72,
      targetDate: "2026-01-29", // 4 weeks
    });

    expect(plan.capped).toBe(true);
    expect(plan.safeWeeklyChangeKg).toBe(-0.64);
    expect(plan.realisticWeeks).toBe(13); // ceil(8 / 0.64) = 13 weeks
    expect(plan.realisticTargetDate).toBeTruthy();
  });

  it("enforces safe gain cap (0.3 kg/week)", () => {
    // Want to gain 4 kg in 4 weeks (1.0 kg/week) -> exceeds 0.3 kg cap!
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 60,
      targetWeightKg: 64,
      targetDate: "2026-01-29",
    });

    expect(plan.capped).toBe(true);
    expect(plan.safeWeeklyChangeKg).toBe(0.3);
    expect(plan.realisticWeeks).toBe(14); // ceil(4 / 0.3) = 14
  });

  it("never suggests calories below BMR", () => {
    // Aggressive deficit request
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 90,
      targetWeightKg: 70,
      targetDate: "2026-02-01",
    });

    expect(plan.dailyCalories).toBeGreaterThanOrEqual(plan.bmr);
    expect(plan.dailyCalories % 10).toBe(0); // Rounded to nearest 10
  });

  it("sets 2.0g/kg protein when losing and caps protein at 170g", () => {
    // 95 kg person losing weight -> 95 * 2.0 = 190g -> capped at 170g
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 95,
      targetWeightKg: 85,
    });

    expect(plan.nutrition.proteinGrams).toBe(170);
  });

  it("computes water glasses (weight * 35 / 250)", () => {
    // 80 * 35 / 250 = 2800 / 250 = 11.2 -> 11 glasses
    const plan = calculatePlan(baseInput);
    expect(plan.nutrition.waterGlasses).toBe(11);
  });

  it("sets walking minutes to 40 min when weekly loss exceeds 0.4 kg", () => {
    const plan = calculatePlan({
      ...baseInput,
      currentWeightKg: 80,
      targetWeightKg: 74,
      targetDate: "2026-03-12", // ~10 weeks, -0.6 kg/week
    });

    expect(plan.walkingMinutesPerDay).toBe(40);
  });
});
