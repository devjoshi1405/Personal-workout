import { describe, it, expect } from "vitest";
import { evaluateCalorieAdjustment, WeightDataPoint } from "@/lib/calc/adjust";

describe("Calorie Coach Auto-Adjust Engine", () => {
  const mockCurrentDate = "2026-03-15";

  // Helper to generate mock daily weights
  function generateWeights(
    w1Values: number[], // Days 0..6
    w2Values: number[]  // Days 7..13
  ): WeightDataPoint[] {
    const list: WeightDataPoint[] = [];

    // Window 1: Recent (Days 0 to 6)
    w1Values.forEach((val, i) => {
      const d = new Date(mockCurrentDate);
      d.setDate(d.getDate() - i);
      list.push({ date: d.toISOString().split("T")[0], weight_kg: val });
    });

    // Window 2: Previous (Days 7 to 13)
    w2Values.forEach((val, i) => {
      const d = new Date(mockCurrentDate);
      d.setDate(d.getDate() - (7 + i));
      list.push({ date: d.toISOString().split("T")[0], weight_kg: val });
    });

    return list;
  }

  it("returns insufficient data when either window has less than 2 entries", () => {
    const weights: WeightDataPoint[] = [
      { date: "2026-03-15", weight_kg: 78.0 }, // Only 1 in Window 1
      { date: "2026-03-08", weight_kg: 78.5 },
      { date: "2026-03-07", weight_kg: 78.6 },
    ];

    const result = evaluateCalorieAdjustment({
      recentWeights: weights,
      goal: "lose",
      plannedWeeklyChangeKg: -0.5,
      currentCalorieAdjustment: 0,
      currentDate: mockCurrentDate,
    });

    expect(result.shouldAdjust).toBe(false);
    expect(result.reason).toContain("Need at least 2 weigh-ins");
  });

  it("detects 14-day plateau when weight is flat and advises patience before changes", () => {
    // Current window avg ~78.0, previous window avg ~78.05 (|delta| = 0.05 < 0.1)
    const weights = generateWeights([78.0, 78.0, 78.1], [78.05, 78.05, 78.1]);

    const result = evaluateCalorieAdjustment({
      recentWeights: weights,
      goal: "lose",
      plannedWeeklyChangeKg: -0.5,
      currentCalorieAdjustment: 0,
      currentDate: mockCurrentDate,
    });

    expect(result.shouldAdjust).toBe(false);
    expect(result.isPlateauWarning).toBe(true);
    expect(result.reason).toContain("Weight has remained flat for 14 days");
  });

  it("enforces 10-day cooldown after an adjustment was made", () => {
    // Current avg 78.0, previous avg 78.2 (lost 0.2 kg/wk vs planned 0.5 kg/wk)
    const weights = generateWeights([78.0, 78.0, 78.0], [78.2, 78.2, 78.2]);

    const result = evaluateCalorieAdjustment({
      recentWeights: weights,
      goal: "lose",
      plannedWeeklyChangeKg: -0.5,
      currentCalorieAdjustment: -150,
      lastAdjustmentDate: "2026-03-10", // 5 days ago (< 10)
      currentDate: mockCurrentDate,
    });

    expect(result.shouldAdjust).toBe(false);
    expect(result.cooldownActive).toBe(true);
    expect(result.reason).toContain("Allowing body 10 full days to equilibrate");
  });

  describe("Losing Goal Rules", () => {
    it("suggests -150 kcal if fat loss is > 0.25 kg/wk slower than planned", () => {
      // Planned: -0.5 kg/week
      // Actual change: 78.3 (current) - 78.5 (previous) = -0.2 kg/week
      // Difference: -0.2 - (-0.5) = +0.3 kg/wk (> 0.25)
      const weights = generateWeights([78.3, 78.3, 78.3], [78.5, 78.5, 78.5]);

      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "lose",
        plannedWeeklyChangeKg: -0.5,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(-150);
      expect(result.newTotalAdjustmentKcal).toBe(-150);
    });

    it("suggests +150 kcal if fat loss is > 0.4 kg/wk faster than planned", () => {
      // Planned: -0.5 kg/week
      // Actual: 77.5 - 78.5 = -1.0 kg/week
      // Difference: -0.5 - (-1.0) = +0.5 kg/wk (> 0.4)
      const weights = generateWeights([77.5, 77.5, 77.5], [78.5, 78.5, 78.5]);

      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "lose",
        plannedWeeklyChangeKg: -0.5,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(150);
      expect(result.newTotalAdjustmentKcal).toBe(150);
    });
  });

  describe("Gaining Goal Rules", () => {
    it("suggests +150 kcal if weight gain is > 0.15 kg/wk slower than planned", () => {
      // Planned: +0.25 kg/week
      // Actual: 65.05 - 65.00 = +0.05 kg/week
      // Difference: 0.25 - 0.05 = 0.20 (> 0.15)
      const weights = generateWeights([65.20, 65.20], [65.00, 65.00]); // 65.20 - 65.00 = +0.20 vs planned 0.40 -> diff 0.20 > 0.15
      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "gain",
        plannedWeeklyChangeKg: 0.40,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(150);
    });

    it("suggests -100 kcal if weight gain is > 0.3 kg/wk faster than planned", () => {
      // Planned: +0.20 kg/week
      // Actual: 65.80 - 65.20 = +0.60 kg/week
      // Difference: 0.60 - 0.20 = 0.40 (> 0.30)
      const weights = generateWeights([65.80, 65.80], [65.20, 65.20]);
      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "gain",
        plannedWeeklyChangeKg: 0.20,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(-100);
    });
  });

  describe("Maintaining Goal Rules", () => {
    it("suggests -100 kcal when drifting upward by > 0.25 kg", () => {
      const weights = generateWeights([70.40, 70.40], [70.00, 70.00]); // +0.40 kg drift
      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "maintain",
        plannedWeeklyChangeKg: 0,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(-100);
    });

    it("suggests +100 kcal when drifting downward by > 0.25 kg", () => {
      const weights = generateWeights([69.60, 69.60], [70.00, 70.00]); // -0.40 kg drift
      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "maintain",
        plannedWeeklyChangeKg: 0,
        currentCalorieAdjustment: 0,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.proposedDeltaKcal).toBe(100);
    });
  });

  describe("Clamping Rule", () => {
    it("clamps total adjustment within [-500, +500] kcal", () => {
      // Current adjustment is already -450 kcal, proposing another -150
      // Clamped total should be -500 kcal, so effective proposedDelta is -50
      const weights = generateWeights([78.3, 78.3], [78.5, 78.5]); // would propose -150
      const result = evaluateCalorieAdjustment({
        recentWeights: weights,
        goal: "lose",
        plannedWeeklyChangeKg: -0.5,
        currentCalorieAdjustment: -450,
        currentDate: mockCurrentDate,
      });

      expect(result.shouldAdjust).toBe(true);
      expect(result.newTotalAdjustmentKcal).toBe(-500);
      expect(result.proposedDeltaKcal).toBe(-50);
    });
  });
});
