import { describe, it, expect } from "vitest";
import { computeWeightChartSeries, evaluateUserCalorieCoach } from "@/lib/db/progress-store";
import { WeightEntry } from "@/lib/db/types";

describe("Progress Store & Weight Series", () => {
  it("computes 7-day rolling average correctly over a series of weigh-ins", () => {
    const entries: WeightEntry[] = [
      { id: "1", user_id: "u1", date: "2026-10-01", weight_kg: 80.0, created_at: "" },
      { id: "2", user_id: "u1", date: "2026-10-02", weight_kg: 79.5, created_at: "" },
      { id: "3", user_id: "u1", date: "2026-10-03", weight_kg: 79.0, created_at: "" },
      { id: "4", user_id: "u1", date: "2026-10-04", weight_kg: 78.5, created_at: "" },
    ];

    const series = computeWeightChartSeries(entries, 75.0);
    expect(series.length).toBe(4);
    expect(series[0].targetWeight).toBe(75.0);
    expect(series[0].rollingAvg).toBe(80.0);
    // On day 4: avg of 80, 79.5, 79, 78.5 = 317 / 4 = 79.25 -> 79.3
    expect(series[3].rollingAvg).toBe(79.3);
  });

  it("evaluates calorie coach from weight entries", () => {
    // Generate 14 days of rapid weight loss to test calorie buffer proposal
    const entries: WeightEntry[] = [];
    const baseDate = new Date("2026-10-15");

    // Days 0 to 6 (window 2): average ~78kg
    entries.push({ id: "1", user_id: "u1", date: "2026-10-16", weight_kg: 78.2, created_at: "" });
    entries.push({ id: "2", user_id: "u1", date: "2026-10-20", weight_kg: 77.8, created_at: "" });

    // Days 7 to 13 (window 1): average ~76.5kg (-1.5kg in a week, faster than planned 0.5kg)
    entries.push({ id: "3", user_id: "u1", date: "2026-10-24", weight_kg: 76.6, created_at: "" });
    entries.push({ id: "4", user_id: "u1", date: "2026-10-28", weight_kg: 76.4, created_at: "" });

    const proposal = evaluateUserCalorieCoach(entries, "lose", 0.5, null);
    // Losing too fast (>0.4kg faster than target rate of 0.5kg)
    expect(proposal.shouldAdjust).toBe(true);
    expect(proposal.proposedDeltaKcal).toBe(150); // Adds +150 to prevent muscle loss
  });
});
