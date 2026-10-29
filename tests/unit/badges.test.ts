import { describe, it, expect } from "vitest";
import { evaluateBadges, UserStatsForBadges } from "@/lib/calc/badges";

describe("Badges and Milestones Engine", () => {
  const baseStats: UserStatsForBadges = {
    totalSessions: 0,
    bestStreak: 0,
    hasPersonalRecord: false,
    startWeightKg: 80,
    currentWeightKg: 80,
    goal: "lose",
    daysHitProteinTarget: 0,
    totalWeighIns: 0,
    currentlyEarnedBadgeKeys: [],
  };

  it("awards 'first_workout' on completion of first session", () => {
    const result = evaluateBadges({
      ...baseStats,
      totalSessions: 1,
    });

    expect(result.allEarnedKeys).toContain("first_workout");
    expect(result.newlyEarnedBadges.some((b) => b.key === "first_workout")).toBe(true);
  });

  it("awards session volume badges (10 and 25 sessions)", () => {
    const result = evaluateBadges({
      ...baseStats,
      totalSessions: 26,
    });

    expect(result.allEarnedKeys).toContain("first_workout");
    expect(result.allEarnedKeys).toContain("sessions_10");
    expect(result.allEarnedKeys).toContain("sessions_25");
  });

  it("awards streak badges (7-day and 30-day)", () => {
    const result = evaluateBadges({
      ...baseStats,
      bestStreak: 32,
    });

    expect(result.allEarnedKeys).toContain("streak_7");
    expect(result.allEarnedKeys).toContain("streak_30");
  });

  it("awards 'first_pr' when personal record exists", () => {
    const result = evaluateBadges({
      ...baseStats,
      hasPersonalRecord: true,
    });

    expect(result.allEarnedKeys).toContain("first_pr");
  });

  it("awards 1kg and 5kg progress badges in the target direction (losing)", () => {
    const result = evaluateBadges({
      ...baseStats,
      goal: "lose",
      startWeightKg: 80,
      currentWeightKg: 74.8, // 5.2 kg lost
    });

    expect(result.allEarnedKeys).toContain("progress_1kg");
    expect(result.allEarnedKeys).toContain("progress_5kg");
  });

  it("awards 1kg and 5kg progress badges in the target direction (gaining)", () => {
    const result = evaluateBadges({
      ...baseStats,
      goal: "gain",
      startWeightKg: 65,
      currentWeightKg: 70.5, // 5.5 kg gained
    });

    expect(result.allEarnedKeys).toContain("progress_1kg");
    expect(result.allEarnedKeys).toContain("progress_5kg");
  });

  it("awards 'protein_7' and 'weighins_14' for consistency", () => {
    const result = evaluateBadges({
      ...baseStats,
      daysHitProteinTarget: 7,
      totalWeighIns: 15,
    });

    expect(result.allEarnedKeys).toContain("protein_7");
    expect(result.allEarnedKeys).toContain("weighins_14");
  });

  it("filters out previously earned badges from newlyEarnedBadges", () => {
    const result = evaluateBadges({
      ...baseStats,
      totalSessions: 1,
      currentlyEarnedBadgeKeys: ["first_workout"], // Already earned in DB
    });

    expect(result.allEarnedKeys).toContain("first_workout");
    expect(result.newlyEarnedBadges.some((b) => b.key === "first_workout")).toBe(false);
  });
});
