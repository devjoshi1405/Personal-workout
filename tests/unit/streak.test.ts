import { describe, it, expect } from "vitest";
import { calculateStreak, isScheduledWorkoutDay } from "@/lib/calc/streak";

describe("Workout Streak Calculation Engine", () => {
  it("accurately identifies scheduled workout days (Mon, Tue, Thu, Fri)", () => {
    // 2026-03-02 is Monday (1)
    expect(isScheduledWorkoutDay("2026-03-02")).toBe(true);
    // 2026-03-03 is Tuesday (2)
    expect(isScheduledWorkoutDay("2026-03-03")).toBe(true);
    // 2026-03-04 is Wednesday (3) - Rest
    expect(isScheduledWorkoutDay("2026-03-04")).toBe(false);
    // 2026-03-05 is Thursday (4)
    expect(isScheduledWorkoutDay("2026-03-05")).toBe(true);
    // 2026-03-06 is Friday (5)
    expect(isScheduledWorkoutDay("2026-03-06")).toBe(true);
    // 2026-03-07 is Saturday (6) - Rest
    expect(isScheduledWorkoutDay("2026-03-07")).toBe(false);
    // 2026-03-08 is Sunday (0) - Rest
    expect(isScheduledWorkoutDay("2026-03-08")).toBe(false);
  });

  it("counts completed workouts and scheduled rest days seamlessly", () => {
    // Mon (work), Tue (work), Wed (rest), Thu (work)
    const history = [
      { date: "2026-03-02", workoutCompleted: true }, // Mon -> streak 1
      { date: "2026-03-03", workoutCompleted: true }, // Tue -> streak 2
      { date: "2026-03-04", workoutCompleted: false }, // Wed (rest) -> streak 3
      { date: "2026-03-05", workoutCompleted: true }, // Thu -> streak 4
    ];

    const result = calculateStreak(history, "2026-03-05");
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
  });

  it("resets current streak when a scheduled workout day is missed", () => {
    const history = [
      { date: "2026-03-02", workoutCompleted: true },  // Mon (1)
      { date: "2026-03-03", workoutCompleted: true },  // Tue (2)
      { date: "2026-03-04", workoutCompleted: false }, // Wed (rest) (3)
      { date: "2026-03-05", workoutCompleted: false }, // Thu missed -> streak breaks to 0
      { date: "2026-03-06", workoutCompleted: true },  // Fri (1)
    ];

    const result = calculateStreak(history, "2026-03-06");
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(3); // Mon, Tue, Wed = 3
  });

  it("returns 0 for empty history", () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(0);
  });
});
