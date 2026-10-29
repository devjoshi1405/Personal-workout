export interface PreviousSetLog {
  weight_kg: number;
  reps: number;
}

export interface OverloadInput {
  lastSessionSets?: PreviousSetLog[];
  repMin: number;
  repMax: number;
  dumbbellStepKg: number;
  unit?: "reps" | "seconds";
  isBodyweight?: boolean;
  userHasNextWeight?: boolean;
  previousBest1RM?: number;
}

export interface OverloadSuggestion {
  suggestedWeightKg: number;
  suggestedReps: number;
  tempoSuggestion?: string;
  rationale: string;
  action: "bump_weight" | "bump_reps_or_time" | "reduce_weight" | "slow_tempo" | "first_time";
}

export interface PRResult {
  isPR: boolean;
  estimated1RM: number;
  previous1RM: number;
  improvementKg: number;
}

/**
 * Calculates estimated 1 Rep Max (1RM) using Epley's formula:
 * 1RM = weight * (1 + reps / 30)
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const est = weightKg * (1 + reps / 30);
  return Math.round(est * 100) / 100;
}

/**
 * Evaluates whether a session achieved a new personal record compared to previous history.
 */
export function detectPersonalRecord(
  sets: { weight_kg: number; reps: number }[],
  previousBest1RM: number = 0
): PRResult {
  if (!sets || sets.length === 0 || previousBest1RM <= 0) {
    // Cannot claim PR without prior baseline
    const currentBest = sets && sets.length > 0
      ? Math.max(...sets.map((s) => calculateEstimated1RM(s.weight_kg, s.reps)))
      : 0;
    return {
      isPR: false,
      estimated1RM: currentBest,
      previous1RM: previousBest1RM,
      improvementKg: 0,
    };
  }

  const currentBest = Math.max(...sets.map((s) => calculateEstimated1RM(s.weight_kg, s.reps)));
  const improvementKg = Math.round((currentBest - previousBest1RM) * 100) / 100;
  const isPR = improvementKg >= 0.25;

  return {
    isPR,
    estimated1RM: currentBest,
    previous1RM: previousBest1RM,
    improvementKg: isPR ? improvementKg : 0,
  };
}

/**
 * Progressive Overload Engine:
 * Analyzes previous performance and recommends the exact weight, reps, or tempo for the upcoming session.
 */
export function calculateOverloadSuggestion(input: OverloadInput): OverloadSuggestion {
  const {
    lastSessionSets,
    repMin,
    repMax,
    dumbbellStepKg = 2.0,
    unit = "reps",
    isBodyweight = false,
    userHasNextWeight = true,
  } = input;

  // 1. First time exercising: guide user to calibrate
  if (!lastSessionSets || lastSessionSets.length === 0) {
    return {
      suggestedWeightKg: 0,
      suggestedReps: repMin,
      rationale: "Choose a weight where the last rep is hard but form stays clean.",
      action: "first_time",
    };
  }

  // Representative weight from last session (usually the highest or mode)
  const lastWeight = Math.max(...lastSessionSets.map((s) => s.weight_kg));
  const isTimeBased = unit === "seconds";

  // Check if every set hit or exceeded the top of the rep range
  const allSetsHitTop = lastSessionSets.every((s) => s.reps >= repMax);

  // Check if two or more sets fell below the bottom of the range
  const belowRangeSetsCount = lastSessionSets.filter((s) => s.reps < repMin).length;
  const twoOrMoreBelow = belowRangeSetsCount >= 2;

  // Branch A: Every set reached top of range
  if (allSetsHitTop) {
    if (isTimeBased) {
      return {
        suggestedWeightKg: lastWeight,
        suggestedReps: repMax + 10,
        rationale: "You maxed out the target time on every set. Add 5 to 10 seconds this session.",
        action: "bump_reps_or_time",
      };
    }

    if (isBodyweight) {
      return {
        suggestedWeightKg: 0,
        suggestedReps: repMax + 2,
        rationale: "Max reps achieved. Aim for 1-2 additional reps per set.",
        action: "bump_reps_or_time",
      };
    }

    // Dumbbell weight progression
    if (!userHasNextWeight) {
      return {
        suggestedWeightKg: lastWeight,
        suggestedReps: repMax,
        tempoSuggestion: "3 seconds down, 1 second pause",
        rationale:
          "Target hit! Since next heavier dumbbell is unavailable, increase time under tension: 3 seconds down, 1 second pause.",
        action: "slow_tempo",
      };
    }

    const nextWeight = lastWeight + dumbbellStepKg;
    return {
      suggestedWeightKg: nextWeight,
      suggestedReps: repMin,
      rationale: `Top of rep range hit on all sets. Increase weight by +${dumbbellStepKg} kg to ${nextWeight} kg and reset to bottom of rep range.`,
      action: "bump_weight",
    };
  }

  // Branch B: Two or more sets fell below bottom of range
  if (twoOrMoreBelow) {
    const reducedWeight = Math.max(0, lastWeight - dumbbellStepKg);
    return {
      suggestedWeightKg: reducedWeight,
      suggestedReps: repMin,
      rationale: `Two or more sets fell below ${repMin} reps. Lower weight by ${dumbbellStepKg} kg to rebuild clean volume.`,
      action: "reduce_weight",
    };
  }

  // Branch C: In range, keep weight and strive for reps
  return {
    suggestedWeightKg: lastWeight,
    suggestedReps: Math.min(repMax, Math.max(...lastSessionSets.map((s) => s.reps)) + 1),
    rationale: "Keep the weight same and aim for +1 rep per set until hitting the top of the range.",
    action: "bump_reps_or_time",
  };
}
