import { describe, it, expect } from "vitest";
import { calculateBMR, calculateTDEE } from "@/lib/calc/bmr";

describe("BMR and TDEE Calculations", () => {
  it("calculates Mifflin-St Jeor BMR correctly for males", () => {
    // 10*75 + 6.25*175 - 5*28 + 5 = 750 + 1093.75 - 140 + 5 = 1708.75 -> 1709
    const bmr = calculateBMR({ weightKg: 75, heightCm: 175, age: 28, sex: "male" });
    expect(bmr).toBe(1709);
  });

  it("calculates Mifflin-St Jeor BMR correctly for females", () => {
    // 10*60 + 6.25*162 - 5*26 - 161 = 600 + 1012.5 - 130 - 161 = 1321.5 -> 1322
    const bmr = calculateBMR({ weightKg: 60, heightCm: 162, age: 26, sex: "female" });
    expect(bmr).toBe(1322);
  });

  it("calculates TDEE for different activity factors", () => {
    const bmr = 1700;
    expect(calculateTDEE(bmr, 1.375)).toBe(2338); // 1700 * 1.375 = 2337.5 -> 2338
    expect(calculateTDEE(bmr, 1.55)).toBe(2635);  // 1700 * 1.55 = 2635
    expect(calculateTDEE(bmr, 1.725)).toBe(2933); // 1700 * 1.725 = 2932.5 -> 2933
  });

  it("throws validation error for invalid biometric inputs", () => {
    expect(() => calculateBMR({ weightKg: -10, heightCm: 170, age: 25, sex: "male" })).toThrow();
    expect(() => calculateTDEE(1700, -1)).toThrow();
  });
});
