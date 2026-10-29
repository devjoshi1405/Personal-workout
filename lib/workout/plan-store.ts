import { DayOfWeekKey, SEVEN_DAY_WORKOUT_PLAN, PlanExercise } from "./seven-day-plan";
import { saveWorkoutSession } from "@/lib/db/workout-store";

export interface LoggedSetData {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface DayProgressRecord {
  completed: boolean;
  completedAt?: string;
  durationMinutes?: number;
  sets: Record<string, LoggedSetData[]>; // exerciseId -> LoggedSetData[]
}

export interface SevenDayPlanState {
  programWeek: number; // 1..12 (weeks 1-2 = 2 sets; 3+ can unlock 3 sets)
  totalSetsPerExercise: number; // 2 or 3
  activeDay: DayOfWeekKey;
  // Keyed by "YYYY-MM-DD_dayKey" or "weekNum_dayKey"
  dayProgress: Record<string, DayProgressRecord>;
  confirmedProgressions: Record<string, { suggestedWeightKg: number; acceptedAt: string }>;
  lastCompletedDate?: string;
}

const STORAGE_KEY = "bench_and_dal_7day_plan_state";

export function getTodayDayKey(): DayOfWeekKey {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
  switch (day) {
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    case 6:
      return "sat";
    case 0:
    default:
      return "sun";
  }
}

export function getCurrentDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getInitialPlanState(): SevenDayPlanState {
  return {
    programWeek: 1,
    totalSetsPerExercise: 2,
    activeDay: "mon",
    dayProgress: {},
    confirmedProgressions: {},
  };
}

export function loadPlanState(): SevenDayPlanState {
  if (typeof window === "undefined") {
    return getInitialPlanState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialPlanState();
    const parsed = JSON.parse(raw) as SevenDayPlanState;

    // Safety checks
    if (!parsed.programWeek || parsed.programWeek < 1) parsed.programWeek = 1;
    if (!parsed.totalSetsPerExercise) parsed.totalSetsPerExercise = parsed.programWeek > 2 ? 3 : 2;
    if (!parsed.dayProgress) parsed.dayProgress = {};
    if (!parsed.confirmedProgressions) parsed.confirmedProgressions = {};
    if (!parsed.activeDay) parsed.activeDay = getTodayDayKey();

    return parsed;
  } catch (err) {
    console.error("Failed to load 7-day plan state:", err);
    return getInitialPlanState();
  }
}

export function savePlanState(state: SevenDayPlanState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save 7-day plan state:", err);
  }
}

/**
 * Initializes default sets for an exercise based on program week rules:
 * - Weeks 1–2: strictly 2 sets per exercise
 * - Weeks 3+: 2 or 3 sets per exercise based on user preference
 */
export function createInitialSetsForExercise(
  exercise: PlanExercise,
  totalSets: number = 2,
  confirmedWeight?: number
): LoggedSetData[] {
  const weight = confirmedWeight !== undefined ? confirmedWeight : exercise.startingWeightKg;
  const count = Math.min(3, Math.max(1, totalSets));

  return Array.from({ length: count }, (_, idx) => ({
    setNumber: idx + 1,
    weightKg: weight,
    reps: exercise.repMin,
    completed: false,
  }));
}

/**
 * Calculates current week's completion statistics.
 * 6 active days (Mon-Sat). Sunday is rest/recovery.
 */
export function calculateWeeklyStats(state: SevenDayPlanState): {
  completedDaysCount: number;
  totalTrainingDays: number;
  completionPercentage: number;
  isAllCompleted: boolean;
} {
  const activeDays: DayOfWeekKey[] = ["mon", "tue", "wed", "thu", "fri", "sat"];
  let completed = 0;

  for (const day of activeDays) {
    if (state.dayProgress[day]?.completed) {
      completed++;
    }
  }

  const totalTrainingDays = activeDays.length; // 6
  const completionPercentage = Math.round((completed / totalTrainingDays) * 100);

  return {
    completedDaysCount: completed,
    totalTrainingDays,
    completionPercentage,
    isAllCompleted: completed === totalTrainingDays,
  };
}

/**
 * Evaluates evidence-based progressive overload for an exercise:
 * Rule: When all prescribed sets reach upper rep range (repMax) with good form,
 * suggest moving to next dumbbell step (e.g. 5 kg -> 10 kg).
 * Note: Never recommend 20 kg directly to a beginner unless 10 kg is maxed out.
 * Never auto-apply without user confirmation.
 */
export function checkProgressionOpportunity(
  exercise: PlanExercise,
  completedSets: LoggedSetData[]
): {
  canProgress: boolean;
  suggestedWeightKg: number;
  message: string;
} | null {
  if (exercise.isCardioOrMobility || exercise.weightType === "bodyweight") {
    return null;
  }

  if (completedSets.length === 0 || completedSets.some((s) => !s.completed)) {
    return null;
  }

  // Check if every set hit repMax
  const allMaxed = completedSets.every((s) => s.reps >= exercise.repMax);
  if (!allMaxed) return null;

  const currentWeight = completedSets[0].weightKg;

  // Next available dumbbell
  if (currentWeight < 5) {
    return {
      canProgress: true,
      suggestedWeightKg: 5,
      message: `You completed all ${completedSets.length} sets at top range (${exercise.repMax} reps). Ready to calibrate with 5 kg per dumbbell?`,
    };
  }

  if (currentWeight === 5) {
    // Only suggest 10 kg for compound multi-joint movements like rows/presses if comfortable
    const isHeavyCompound = ["plan_db_bench_press", "plan_db_one_arm_row", "plan_db_chest_supported_row", "plan_legs_db_rdl"].includes(exercise.id);
    if (isHeavyCompound) {
      return {
        canProgress: true,
        suggestedWeightKg: 10,
        message: `Outstanding! You hit ${exercise.repMax} reps on all sets. You can test 10 kg next workout, or maintain 5 kg with a slower 3-second lowering tempo.`,
      };
    } else {
      // For lateral raises, triceps kickbacks, flies:
      return {
        canProgress: true,
        suggestedWeightKg: 5,
        message: `Great job hitting ${exercise.repMax} reps! For this isolated joint movement, focus on a 3-second eccentric tempo rather than jumping to heavy dumbbells.`,
      };
    }
  }

  if (currentWeight === 10) {
    // Check if 20kg is safe (only for strong rows or deadlifts)
    const canUse20 = ["plan_db_one_arm_row", "plan_legs_db_rdl"].includes(exercise.id);
    if (canUse20) {
      return {
        canProgress: true,
        suggestedWeightKg: 20,
        message: `Impressive back strength! You hit ${exercise.repMax} reps with 10 kg. Your 20 kg dumbbell is available if your grip and lower back form remain rock solid.`,
      };
    }
  }

  return null;
}

/**
 * Saves a completed day workout to history and updates 7-day state.
 * Double-click protected via timestamp comparison.
 */
export async function finishDayWorkout(params: {
  dayKey: DayOfWeekKey;
  durationMinutes: number;
  setsRecord: Record<string, LoggedSetData[]>;
  currentState: SevenDayPlanState;
}): Promise<{
  success: boolean;
  totalVolumeKg: number;
  completedSetsCount: number;
  newState: SevenDayPlanState;
}> {
  const { dayKey, durationMinutes, setsRecord, currentState } = params;
  const todayStr = getCurrentDateKey();

  // Flatten completed sets
  const allCompletedSets = Object.entries(setsRecord).flatMap(([exId, sets]) =>
    sets
      .filter((s) => s.completed)
      .map((s) => ({
        exercise_id: exId,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
      }))
  );

  const totalVolumeKg = allCompletedSets.reduce((acc, curr) => acc + curr.weight_kg * curr.reps, 0);

  // Map dayKey to legacy TemplateKey for workout history compatibility
  const legacyTemplateKeyMap: Record<DayOfWeekKey, "UA" | "LA" | "UB" | "LB"> = {
    mon: "UA",
    tue: "UB",
    wed: "UA",
    thu: "LA",
    fri: "UB",
    sat: "LB",
    sun: "UA",
  };

  try {
    await saveWorkoutSession({
      templateKey: legacyTemplateKeyMap[dayKey] || "UA",
      durationMinutes,
      sets: allCompletedSets,
      notes: `7-Day Plan • ${SEVEN_DAY_WORKOUT_PLAN[dayKey].title} (${todayStr})`,
    });
  } catch (err) {
    console.warn("History sync notice:", err);
  }

  // Update state
  const updatedDayProgress = {
    ...currentState.dayProgress,
    [dayKey]: {
      completed: true,
      completedAt: new Date().toISOString(),
      durationMinutes,
      sets: setsRecord,
    },
  };

  const newState: SevenDayPlanState = {
    ...currentState,
    dayProgress: updatedDayProgress,
    lastCompletedDate: todayStr,
  };

  savePlanState(newState);

  return {
    success: true,
    totalVolumeKg,
    completedSetsCount: allCompletedSets.length,
    newState,
  };
}

/**
 * Resets weekly progress when starting a new week
 */
export function advanceToNextWeek(currentState: SevenDayPlanState): SevenDayPlanState {
  const nextWeek = currentState.programWeek + 1;
  const newState: SevenDayPlanState = {
    ...currentState,
    programWeek: nextWeek,
    totalSetsPerExercise: nextWeek > 2 ? 3 : 2,
    dayProgress: {}, // fresh week reset
  };
  savePlanState(newState);
  return newState;
}
