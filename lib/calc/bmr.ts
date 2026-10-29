export type Sex = "male" | "female";

export interface BMRParams {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula.
 * Men: 10*w + 6.25*h - 5*a + 5
 * Women: 10*w + 6.25*h - 5*a - 161
 */
export function calculateBMR({ weightKg, heightCm, age, sex }: BMRParams): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    throw new Error("Weight, height, and age must be positive values.");
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * Activity multipliers:
 * - 1.375: Mostly sitting / light activity
 * - 1.55: On feet a lot / moderate activity
 * - 1.725: Physical job / heavy daily activity
 */
export function calculateTDEE(bmr: number, activityFactor: number): number {
  if (activityFactor <= 0) {
    throw new Error("Activity factor must be positive.");
  }
  return Math.round(bmr * activityFactor);
}
