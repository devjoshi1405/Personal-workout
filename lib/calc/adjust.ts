import { GoalType } from "./plan";

export interface WeightDataPoint {
  date: string;
  weight_kg: number;
}

export interface CalorieCoachInput {
  recentWeights: WeightDataPoint[]; // Last 14 days of entries
  goal: GoalType;
  plannedWeeklyChangeKg: number;
  currentCalorieAdjustment: number; // Current cumulative adjustment
  lastAdjustmentDate?: string | null;
  currentDate?: string | Date;
}

export interface CalorieAdjustmentProposal {
  shouldAdjust: boolean;
  proposedDeltaKcal: number;
  newTotalAdjustmentKcal: number;
  reason: string;
  isPlateauWarning: boolean;
  cooldownActive: boolean;
  daysSinceLastAdjustment?: number;
  currentAvgKg: number | null;
  previousAvgKg: number | null;
  actualWeeklyChangeKg: number | null;
}

/**
 * Calculates rolling average of weight entries within a specified date window.
 */
function getAverageWeight(entries: WeightDataPoint[]): number | null {
  if (!entries || entries.length === 0) return null;
  const sum = entries.reduce((acc, curr) => acc + curr.weight_kg, 0);
  return Math.round((sum / entries.length) * 100) / 100;
}

/**
 * Calorie Coach Engine:
 * Compares trailing 7-day weight average with previous 7-day average,
 * detects plateaus, observes 10-day cooldowns, and clamps cumulative adjustments to +/-500 kcal.
 */
export function evaluateCalorieAdjustment(input: CalorieCoachInput): CalorieAdjustmentProposal {
  const {
    recentWeights,
    goal,
    plannedWeeklyChangeKg,
    currentCalorieAdjustment = 0,
    lastAdjustmentDate,
    currentDate = new Date(),
  } = input;

  const now = new Date(currentDate);

  // 1. Check 10-day cooldown
  let cooldownActive = false;
  let daysSinceLastAdjustment: number | undefined;

  if (lastAdjustmentDate) {
    const lastDate = new Date(lastAdjustmentDate);
    daysSinceLastAdjustment = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastAdjustment < 10) {
      cooldownActive = true;
    }
  }

  // 2. Partition entries into:
  // - Window 1: Recent 7 days (days 0-6 from today)
  // - Window 2: Previous 7 days (days 7-13 from today)
  const window1: WeightDataPoint[] = [];
  const window2: WeightDataPoint[] = [];

  for (const entry of recentWeights) {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      window1.push(entry);
    } else if (diffDays >= 7 && diffDays < 14) {
      window2.push(entry);
    }
  }

  // Each window needs at least 2 entries
  if (window1.length < 2 || window2.length < 2) {
    return {
      shouldAdjust: false,
      proposedDeltaKcal: 0,
      newTotalAdjustmentKcal: currentCalorieAdjustment,
      reason: "Need at least 2 weigh-ins in both the current 7-day and previous 7-day windows.",
      isPlateauWarning: false,
      cooldownActive,
      daysSinceLastAdjustment,
      currentAvgKg: getAverageWeight(window1),
      previousAvgKg: getAverageWeight(window2),
      actualWeeklyChangeKg: null,
    };
  }

  const currentAvgKg = getAverageWeight(window1)!;
  const previousAvgKg = getAverageWeight(window2)!;
  const actualWeeklyChangeKg = Math.round((currentAvgKg - previousAvgKg) * 100) / 100;

  // 3. Plateau Detection (flat for 14 days when goal is not maintain)
  const isPlateau = goal !== "maintain" && Math.abs(actualWeeklyChangeKg) < 0.1;

  if (isPlateau) {
    return {
      shouldAdjust: false,
      proposedDeltaKcal: 0,
      newTotalAdjustmentKcal: currentCalorieAdjustment,
      reason:
        "Weight has remained flat for 14 days. This is commonly temporary water retention or muscle glycogen replenishment. Hold steady before adjusting calories.",
      isPlateauWarning: true,
      cooldownActive,
      daysSinceLastAdjustment,
      currentAvgKg,
      previousAvgKg,
      actualWeeklyChangeKg,
    };
  }

  // 4. If cooldown is active, hold off on new suggestion
  if (cooldownActive) {
    return {
      shouldAdjust: false,
      proposedDeltaKcal: 0,
      newTotalAdjustmentKcal: currentCalorieAdjustment,
      reason: `Calorie adjustment made ${daysSinceLastAdjustment} days ago. Allowing body 10 full days to equilibrate.`,
      isPlateauWarning: false,
      cooldownActive: true,
      daysSinceLastAdjustment,
      currentAvgKg,
      previousAvgKg,
      actualWeeklyChangeKg,
    };
  }

  let proposedDeltaKcal = 0;
  let reason = "Weight trend is progressing according to plan.";

  // 5. Evaluate based on goal
  if (goal === "lose") {
    // Slower than planned by > 0.25 kg (actual - planned > 0.25)
    // E.g. planned: -0.5, actual: -0.2 => -0.2 - (-0.5) = +0.3 > 0.25
    if (actualWeeklyChangeKg - plannedWeeklyChangeKg > 0.25) {
      proposedDeltaKcal = -150;
      reason = `Fat loss rate (${actualWeeklyChangeKg} kg/wk) is slower than target (${plannedWeeklyChangeKg} kg/wk). Proposing -150 kcal/day.`;
    }
    // Faster than planned by > 0.4 kg (planned - actual > 0.4)
    // E.g. planned: -0.5, actual: -1.0 => -0.5 - (-1.0) = +0.5 > 0.4
    else if (plannedWeeklyChangeKg - actualWeeklyChangeKg > 0.4) {
      proposedDeltaKcal = 150;
      reason = `Fat loss rate (${actualWeeklyChangeKg} kg/wk) is faster than safe targets. Adding +150 kcal/day to preserve lean muscle.`;
    }
  } else if (goal === "gain") {
    // Slower than planned by > 0.15 kg
    // E.g. planned: +0.25, actual: +0.05 => +0.25 - 0.05 = 0.20 > 0.15
    if (plannedWeeklyChangeKg - actualWeeklyChangeKg > 0.15) {
      proposedDeltaKcal = 150;
      reason = `Weight gain (${actualWeeklyChangeKg} kg/wk) is slower than target (${plannedWeeklyChangeKg} kg/wk). Proposing +150 kcal/day.`;
    }
    // Faster than planned by > 0.3 kg
    // E.g. planned: +0.25, actual: +0.60 => +0.60 - 0.25 = 0.35 > 0.30
    else if (actualWeeklyChangeKg - plannedWeeklyChangeKg > 0.3) {
      proposedDeltaKcal = -100;
      reason = `Weight gain (${actualWeeklyChangeKg} kg/wk) is faster than planned. Reducing -100 kcal/day to minimize unwanted fat gain.`;
    }
  } else if (goal === "maintain") {
    // Drifting more than 0.25 kg in either direction
    if (actualWeeklyChangeKg > 0.25) {
      proposedDeltaKcal = -100;
      reason = `Weight drifting upward (+${actualWeeklyChangeKg} kg/wk). Reducing -100 kcal/day.`;
    } else if (actualWeeklyChangeKg < -0.25) {
      proposedDeltaKcal = 100;
      reason = `Weight drifting downward (${actualWeeklyChangeKg} kg/wk). Adding +100 kcal/day.`;
    }
  }

  // 6. Clamp cumulative adjustment to [-500, +500] kcal
  const unclampedTotal = currentCalorieAdjustment + proposedDeltaKcal;
  const clampedTotal = Math.max(-500, Math.min(500, unclampedTotal));
  const effectiveDelta = clampedTotal - currentCalorieAdjustment;

  const shouldAdjust = effectiveDelta !== 0;

  return {
    shouldAdjust,
    proposedDeltaKcal: effectiveDelta,
    newTotalAdjustmentKcal: clampedTotal,
    reason,
    isPlateauWarning: false,
    cooldownActive: false,
    daysSinceLastAdjustment,
    currentAvgKg,
    previousAvgKg,
    actualWeeklyChangeKg,
  };
}
