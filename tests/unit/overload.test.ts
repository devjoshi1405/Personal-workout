import { describe, it, expect } from "vitest";
import {
  calculateOverloadSuggestion,
  calculateEstimated1RM,
  detectPersonalRecord,
} from "@/lib/calc/overload";

describe("Progressive Overload Engine", () => {
  it("provides initial guidance for a first-time exercise", () => {
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [],
      repMin: 8,
      repMax: 12,
      dumbbellStepKg: 2.0,
    });

    expect(suggestion.action).toBe("first_time");
    expect(suggestion.suggestedWeightKg).toBe(0);
    expect(suggestion.rationale).toContain("Choose a weight where the last rep is hard");
  });

  it("bumps dumbbell weight by dumbbellStep when every set hits top of range", () => {
    // 4 sets of 12 reps at 16 kg (range 8-12)
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [
        { weight_kg: 16, reps: 12 },
        { weight_kg: 16, reps: 12 },
        { weight_kg: 16, reps: 12 },
        { weight_kg: 16, reps: 12 },
      ],
      repMin: 8,
      repMax: 12,
      dumbbellStepKg: 2.0,
      userHasNextWeight: true,
    });

    expect(suggestion.action).toBe("bump_weight");
    expect(suggestion.suggestedWeightKg).toBe(18); // 16 + 2
    expect(suggestion.suggestedReps).toBe(8); // resets to bottom of range
  });

  it("suggests slower tempo if next heavier dumbbell is unavailable", () => {
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [
        { weight_kg: 20, reps: 12 },
        { weight_kg: 20, reps: 12 },
        { weight_kg: 20, reps: 12 },
      ],
      repMin: 8,
      repMax: 12,
      dumbbellStepKg: 2.0,
      userHasNextWeight: false,
    });

    expect(suggestion.action).toBe("slow_tempo");
    expect(suggestion.suggestedWeightKg).toBe(20);
    expect(suggestion.tempoSuggestion).toContain("3 seconds down, 1 second pause");
  });

  it("reduces weight by dumbbellStep if two or more sets fell below rep range", () => {
    // 4 sets, 2 fell below repMin (8): set 3 (6 reps) and set 4 (5 reps)
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [
        { weight_kg: 18, reps: 8 },
        { weight_kg: 18, reps: 8 },
        { weight_kg: 18, reps: 6 },
        { weight_kg: 18, reps: 5 },
      ],
      repMin: 8,
      repMax: 12,
      dumbbellStepKg: 2.0,
    });

    expect(suggestion.action).toBe("reduce_weight");
    expect(suggestion.suggestedWeightKg).toBe(16); // 18 - 2
  });

  it("keeps weight and aims for +1 rep when performance is in range but not maxed", () => {
    // sets: 10, 10, 9, 8 reps at 16 kg
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [
        { weight_kg: 16, reps: 10 },
        { weight_kg: 16, reps: 10 },
        { weight_kg: 16, reps: 9 },
        { weight_kg: 16, reps: 8 },
      ],
      repMin: 8,
      repMax: 12,
      dumbbellStepKg: 2.0,
    });

    expect(suggestion.action).toBe("bump_reps_or_time");
    expect(suggestion.suggestedWeightKg).toBe(16);
    expect(suggestion.suggestedReps).toBe(11); // max reps (10) + 1
  });

  it("suggests +10 seconds for time-based exercises hitting max", () => {
    const suggestion = calculateOverloadSuggestion({
      lastSessionSets: [
        { weight_kg: 0, reps: 45 },
        { weight_kg: 0, reps: 45 },
        { weight_kg: 0, reps: 45 },
      ],
      repMin: 30,
      repMax: 45,
      dumbbellStepKg: 0,
      unit: "seconds",
    });

    expect(suggestion.action).toBe("bump_reps_or_time");
    expect(suggestion.suggestedReps).toBe(55); // 45 + 10
  });

  describe("Personal Record (PR) Detection", () => {
    it("calculates estimated 1RM with Epley formula", () => {
      // 20 kg * (1 + 10 / 30) = 20 * 1.3333 = 26.67 kg
      const est1RM = calculateEstimated1RM(20, 10);
      expect(est1RM).toBe(26.67);
    });

    it("detects a new PR when improvement is >= 0.25 kg", () => {
      // Previous best was 25.0 kg
      // New set: 20 kg x 10 reps -> 26.67 kg 1RM
      const result = detectPersonalRecord(
        [{ weight_kg: 20, reps: 10 }],
        25.0
      );

      expect(result.isPR).toBe(true);
      expect(result.estimated1RM).toBe(26.67);
      expect(result.improvementKg).toBe(1.67);
    });

    it("does not trigger PR if improvement is negligible or lower", () => {
      const result = detectPersonalRecord(
        [{ weight_kg: 18, reps: 10 }], // 1RM ~ 24.0 kg
        25.0 // Previous best
      );

      expect(result.isPR).toBe(false);
      expect(result.improvementKg).toBe(0);
    });
  });
});
