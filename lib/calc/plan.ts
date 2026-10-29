import { calculateBMR, calculateTDEE, Sex } from "./bmr";

export type GoalType = "lose" | "gain" | "maintain";

export interface PlanInput {
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityFactor: number;
  startDate: string | Date;
  targetDate: string | Date;
  calorieAdjustment?: number;
}

export interface NutritionTargets {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  waterGlasses: number;
}

export interface PlanOutput {
  bmr: number;
  tdee: number;
  goal: GoalType;
  deltaKg: number;
  weeksUntilTargetDate: number;
  weeklyChangeKg: number;
  capped: boolean;
  safeWeeklyChangeKg: number;
  realisticTargetDate: string | null;
  realisticWeeks: number | null;
  dailyCalories: number;
  nutrition: NutritionTargets;
  walkingMinutesPerDay: number;
  trainingDaysPerWeek: number;
  trainingMinutesPerSession: number;
  coachingMessage: string;
}

/**
 * Calculates fitness, nutrition, and timeline targets based on user biometric data and goals.
 */
export function calculatePlan(input: PlanInput): PlanOutput {
  const {
    currentWeightKg,
    targetWeightKg,
    heightCm,
    age,
    sex,
    activityFactor,
    calorieAdjustment = 0,
  } = input;

  const bmr = calculateBMR({ weightKg: currentWeightKg, heightCm, age, sex });
  const tdee = calculateTDEE(bmr, activityFactor);

  const deltaKg = Math.round((targetWeightKg - currentWeightKg) * 100) / 100;

  let goal: GoalType = "maintain";
  if (Math.abs(deltaKg) >= 0.3) {
    goal = deltaKg < 0 ? "lose" : "gain";
  }

  const start = new Date(input.startDate);
  const target = new Date(input.targetDate);
  const diffDays = Math.max(1, Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksUntilTargetDate = Math.max(1, Math.round((diffDays / 7) * 10) / 10);

  const neededWeeklyChangeKg = goal === "maintain" ? 0 : deltaKg / weeksUntilTargetDate;

  // Safe caps:
  // Losing: at most min(0.75, 0.008 * bodyweight) kg/week
  // Gaining: at most 0.3 kg/week
  const maxWeeklyLoss = Math.min(0.75, Math.round(0.008 * currentWeightKg * 100) / 100);
  const maxWeeklyGain = 0.3;

  let capped = false;
  let safeWeeklyChangeKg = neededWeeklyChangeKg;
  let realisticWeeks: number | null = null;
  let realisticTargetDate: string | null = null;

  if (goal === "lose") {
    const weeklyLossRate = Math.abs(neededWeeklyChangeKg);
    if (weeklyLossRate > maxWeeklyLoss) {
      capped = true;
      safeWeeklyChangeKg = -maxWeeklyLoss;
      realisticWeeks = Math.ceil(Math.abs(deltaKg) / maxWeeklyLoss);
      const realisticDate = new Date(start);
      realisticDate.setDate(realisticDate.getDate() + realisticWeeks * 7);
      realisticTargetDate = realisticDate.toISOString().split("T")[0];
    }
  } else if (goal === "gain") {
    if (neededWeeklyChangeKg > maxWeeklyGain) {
      capped = true;
      safeWeeklyChangeKg = maxWeeklyGain;
      realisticWeeks = Math.ceil(deltaKg / maxWeeklyGain);
      const realisticDate = new Date(start);
      realisticDate.setDate(realisticDate.getDate() + realisticWeeks * 7);
      realisticTargetDate = realisticDate.toISOString().split("T")[0];
    }
  }

  // Daily calories = TDEE + weeklyChange * 1100 + calorieAdjustment
  // Never below BMR, rounded to nearest 10
  const rawCalories = tdee + safeWeeklyChangeKg * 1100 + calorieAdjustment;
  const clampedCalories = Math.max(bmr, rawCalories);
  const dailyCalories = Math.round(clampedCalories / 10) * 10;

  // Protein: 2.0 g/kg when losing, 1.8 g/kg otherwise, max 170g
  const proteinMultiplier = goal === "lose" ? 2.0 : 1.8;
  const rawProtein = Math.round(currentWeightKg * proteinMultiplier);
  const proteinGrams = Math.min(170, Math.max(50, rawProtein));

  // Fat 25% of calories
  const fatGrams = Math.round((dailyCalories * 0.25) / 9);

  // Carbs = remainder
  const carbCalories = Math.max(0, dailyCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(carbCalories / 4);

  // Water target = weight * 35 ml / 250 ml glasses
  const waterGlasses = Math.round((currentWeightKg * 35) / 250);

  // Walking target per day:
  // lose: 30 min (40 if weekly loss > 0.4 kg)
  // gain: 15 min
  // maintain: 20 min
  let walkingMinutesPerDay = 20;
  if (goal === "lose") {
    walkingMinutesPerDay = Math.abs(safeWeeklyChangeKg) > 0.4 ? 40 : 30;
  } else if (goal === "gain") {
    walkingMinutesPerDay = 15;
  }

  const coachingMessage =
    "Strength improves in 2-4 weeks, visible change takes 6-8 weeks.";

  return {
    bmr,
    tdee,
    goal,
    deltaKg,
    weeksUntilTargetDate,
    weeklyChangeKg: Math.round(neededWeeklyChangeKg * 100) / 100,
    capped,
    safeWeeklyChangeKg: Math.round(safeWeeklyChangeKg * 100) / 100,
    realisticTargetDate,
    realisticWeeks,
    dailyCalories,
    nutrition: {
      calories: dailyCalories,
      proteinGrams,
      fatGrams,
      carbGrams,
      waterGlasses,
    },
    walkingMinutesPerDay,
    trainingDaysPerWeek: 4,
    trainingMinutesPerSession: 50,
    coachingMessage,
  };
}
