import { describe, it, expect } from "vitest";
import {
  SEVEN_DAY_WORKOUT_PLAN,
  AVAILABLE_DUMBBELL_WEIGHTS_KG,
  DayOfWeekKey,
} from "@/lib/workout/seven-day-plan";
import {
  createInitialSetsForExercise,
  calculateWeeklyStats,
  checkProgressionOpportunity,
  advanceToNextWeek,
  SevenDayPlanState,
} from "@/lib/workout/plan-store";

describe("7-Day Personalized Dumbbell Workout Plan", () => {
  it("contains all 7 days of the week with complete schedules", () => {
    const days: DayOfWeekKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    days.forEach((day) => {
      expect(SEVEN_DAY_WORKOUT_PLAN[day]).toBeDefined();
      expect(SEVEN_DAY_WORKOUT_PLAN[day].dayKey).toBe(day);
      expect(SEVEN_DAY_WORKOUT_PLAN[day].title).toBeTruthy();
    });
  });

  describe("Monday — Chest + Triceps", () => {
    const monday = SEVEN_DAY_WORKOUT_PLAN.mon;

    it("has exact prescribed exercises", () => {
      expect(monday.exercises.length).toBe(5);
      const names = monday.exercises.map((e) => e.name);
      expect(names).toContain("Dumbbell Bench Press");
      expect(names).toContain("Dumbbell Floor Press");
      expect(names).toContain("Dumbbell Chest Fly");
      expect(names).toContain("Seated Overhead Triceps Extension");
      expect(names).toContain("Triceps Kickback");
    });

    it("correctly prescribes starting weights and bilateral dumbbell clarity", () => {
      const benchPress = monday.exercises.find((e) => e.id === "plan_db_bench_press")!;
      expect(benchPress.startingWeightKg).toBe(5);
      expect(benchPress.weightType).toBe("per_dumbbell");
      expect(benchPress.weightDisplay).toContain("per dumbbell");
      expect(benchPress.defaultSets).toBe(2);
      expect(benchPress.repMin).toBe(10);
      expect(benchPress.repMax).toBe(12);

      // Floor press alternative provided
      expect(benchPress.alternatives.length).toBeGreaterThan(0);
      expect(benchPress.alternatives[0].name).toBe("Dumbbell Floor Press");

      const overheadTriceps = monday.exercises.find((e) => e.id === "plan_db_overhead_triceps")!;
      expect(overheadTriceps.startingWeightKg).toBe(5);
      expect(overheadTriceps.weightType).toBe("total");
    });
  });

  describe("Tuesday — Back + Biceps", () => {
    const tuesday = SEVEN_DAY_WORKOUT_PLAN.tue;

    it("has exact prescribed exercises and weights", () => {
      expect(tuesday.exercises.length).toBe(5);
      const row = tuesday.exercises.find((e) => e.id === "plan_db_one_arm_row")!;
      expect(row.startingWeightKg).toBe(10);
      expect(row.weightType).toBe("total");
      expect(row.defaultSets).toBe(2);
      expect(row.repMin).toBe(10);
      expect(row.repMax).toBe(12);

      const chestSupportedRow = tuesday.exercises.find((e) => e.id === "plan_db_chest_supported_row")!;
      expect(chestSupportedRow.startingWeightKg).toBe(5);
      expect(chestSupportedRow.weightType).toBe("per_dumbbell");

      const revFly = tuesday.exercises.find((e) => e.id === "plan_db_bent_reverse_fly")!;
      expect(revFly.startingWeightKg).toBe(5);
      expect(revFly.repMin).toBe(12);
      expect(revFly.repMax).toBe(15);
    });
  });

  describe("Wednesday — Cardio + Core", () => {
    const wednesday = SEVEN_DAY_WORKOUT_PLAN.wed;

    it("includes comfortable low-impact walking and core stability", () => {
      expect(wednesday.exercises.length).toBe(4);
      const walking = wednesday.exercises.find((e) => e.id === "plan_cardio_walking")!;
      expect(walking.isCardioOrMobility).toBe(true);
      expect(walking.repMin).toBe(15);
      expect(walking.repMax).toBe(25);

      const deadBug = wednesday.exercises.find((e) => e.id === "plan_core_dead_bug")!;
      expect(deadBug.weightType).toBe("bodyweight");
      expect(deadBug.repMin).toBe(8);

      const kneeRaises = wednesday.exercises.find((e) => e.id === "plan_core_standing_knee_raises")!;
      expect(kneeRaises.repMin).toBe(10);
    });
  });

  describe("Thursday — Legs + Glutes", () => {
    const thursday = SEVEN_DAY_WORKOUT_PLAN.thu;

    it("protects 110 kg bodyweight knees with sit-to-stand and goblet squats to bench", () => {
      expect(thursday.exercises.length).toBe(5);

      const sitToStand = thursday.exercises.find((e) => e.id === "plan_legs_sit_to_stand")!;
      expect(sitToStand.weightType).toBe("bodyweight");
      expect(sitToStand.repMin).toBe(8);
      expect(sitToStand.repMax).toBe(12);

      const rdl = thursday.exercises.find((e) => e.id === "plan_legs_db_rdl")!;
      expect(rdl.startingWeightKg).toBe(5);
      expect(rdl.weightType).toBe("per_dumbbell");

      const gobletSquat = thursday.exercises.find((e) => e.id === "plan_legs_goblet_squat_bench")!;
      expect(gobletSquat.startingWeightKg).toBe(5);
      expect(gobletSquat.weightType).toBe("total");
    });
  });

  describe("Friday — Shoulders + Abs", () => {
    const friday = SEVEN_DAY_WORKOUT_PLAN.fri;

    it("calibrates shoulder press, lateral raises, rear delts, and shrugs safely", () => {
      expect(friday.exercises.length).toBe(5);

      const shoulderPress = friday.exercises.find((e) => e.id === "plan_sh_db_press")!;
      expect(shoulderPress.startingWeightKg).toBe(5);
      expect(shoulderPress.weightType).toBe("per_dumbbell");

      const lateralRaise = friday.exercises.find((e) => e.id === "plan_sh_db_lateral_raise")!;
      expect(lateralRaise.startingWeightKg).toBe(5);
      expect(lateralRaise.alternatives.length).toBeGreaterThan(0);

      const shrug = friday.exercises.find((e) => e.id === "plan_sh_db_shrug")!;
      expect(shrug.repMin).toBe(12);
      expect(shrug.repMax).toBe(15);
    });
  });

  describe("Saturday — Light Full Body + Cardio", () => {
    const saturday = SEVEN_DAY_WORKOUT_PLAN.sat;

    it("keeps volume light to promote recovery rather than systemic fatigue", () => {
      expect(saturday.exercises.length).toBe(5);
      expect(saturday.isLightCardioDay).toBe(true);

      const pushups = saturday.exercises.find((e) => e.id === "plan_sat_wall_pushups")!;
      expect(pushups.weightType).toBe("bodyweight");

      const lightRow = saturday.exercises.find((e) => e.id === "plan_sat_light_db_row")!;
      expect(lightRow.startingWeightKg).toBe(5);
    });
  });

  describe("Sunday — Rest and Recovery", () => {
    const sunday = SEVEN_DAY_WORKOUT_PLAN.sun;

    it("has zero scheduled resistance training and clear recovery guidance", () => {
      expect(sunday.isRestDay).toBe(true);
      expect(sunday.exercises.length).toBe(0);
      expect(sunday.recoveryGuidance).toBeDefined();
      expect(sunday.recoveryGuidance?.sleep).toContain("sleep");
      expect(sunday.recoveryGuidance?.hydration).toContain("water");
    });
  });

  describe("Progressive Overload & Equipment Calibration Rules", () => {
    it("restricts available quick dumbbell choices to 0, 5, 10, 20 kg", () => {
      expect(AVAILABLE_DUMBBELL_WEIGHTS_KG).toEqual([0, 5, 10, 20]);
    });

    it("creates exactly 2 sets per exercise in phase 1 (weeks 1–2)", () => {
      const benchPress = SEVEN_DAY_WORKOUT_PLAN.mon.exercises[0];
      const sets = createInitialSetsForExercise(benchPress, 2);
      expect(sets.length).toBe(2);
      expect(sets[0].completed).toBe(false);
      expect(sets[0].weightKg).toBe(5);
      expect(sets[0].reps).toBe(10);
    });

    it("detects progression opportunity when all sets max the rep range", () => {
      const benchPress = SEVEN_DAY_WORKOUT_PLAN.mon.exercises[0];
      const maxedSets = [
        { setNumber: 1, weightKg: 5, reps: 12, completed: true },
        { setNumber: 2, weightKg: 5, reps: 12, completed: true },
      ];

      const progression = checkProgressionOpportunity(benchPress, maxedSets);
      expect(progression).not.toBeNull();
      expect(progression?.canProgress).toBe(true);
      expect(progression?.suggestedWeightKg).toBe(10);
    });

    it("does not suggest progression when sets are incomplete or below repMax", () => {
      const benchPress = SEVEN_DAY_WORKOUT_PLAN.mon.exercises[0];
      const subMaxSets = [
        { setNumber: 1, weightKg: 5, reps: 10, completed: true },
        { setNumber: 2, weightKg: 5, reps: 11, completed: true },
      ];

      const progression = checkProgressionOpportunity(benchPress, subMaxSets);
      expect(progression).toBeNull();
    });

    it("never automatically assigns 20 kg to small isolation moves like lateral raises", () => {
      const lateralRaise = SEVEN_DAY_WORKOUT_PLAN.fri.exercises.find((e) => e.id === "plan_sh_db_lateral_raise")!;
      const maxedSets = [
        { setNumber: 1, weightKg: 5, reps: 15, completed: true },
        { setNumber: 2, weightKg: 5, reps: 15, completed: true },
      ];

      const progression = checkProgressionOpportunity(lateralRaise, maxedSets);
      // Lateral raise suggests tempo focus rather than jumping to 10kg or 20kg
      expect(progression?.suggestedWeightKg).not.toBe(20);
    });
  });

  describe("Weekly Stats & Resets", () => {
    it("calculates weekly completion correctly over 6 training days", () => {
      const state: SevenDayPlanState = {
        programWeek: 1,
        totalSetsPerExercise: 2,
        activeDay: "mon",
        dayProgress: {
          mon: { completed: true, sets: {} },
          tue: { completed: true, sets: {} },
          wed: { completed: true, sets: {} },
        },
        confirmedProgressions: {},
      };

      const stats = calculateWeeklyStats(state);
      expect(stats.completedDaysCount).toBe(3);
      expect(stats.totalTrainingDays).toBe(6);
      expect(stats.completionPercentage).toBe(50);
      expect(stats.isAllCompleted).toBe(false);
    });

    it("advances to next week with clean reset and 3-set option unlocked", () => {
      const state: SevenDayPlanState = {
        programWeek: 2,
        totalSetsPerExercise: 2,
        activeDay: "sat",
        dayProgress: {
          mon: { completed: true, sets: {} },
        },
        confirmedProgressions: {},
      };

      const advanced = advanceToNextWeek(state);
      expect(advanced.programWeek).toBe(3);
      expect(advanced.totalSetsPerExercise).toBe(3);
      expect(Object.keys(advanced.dayProgress).length).toBe(0);
    });
  });
});

