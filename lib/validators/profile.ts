import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be under 50 characters."),
  sex: z.enum(["male", "female"], {
    message: "Please select your biological sex for metabolic BMR calculation.",
  }),
  age: z
    .number({ message: "Please enter your age." })
    .int("Age must be a whole number.")
    .min(14, "Age must be at least 14.")
    .max(80, "Age must be 80 or below."),
  height_cm: z
    .number({ message: "Please enter your height in cm." })
    .min(120, "Height must be at least 120 cm.")
    .max(230, "Height must be 230 cm or below."),
  current_weight_kg: z
    .number({ message: "Please enter your current weight in kg." })
    .min(30, "Weight must be at least 30 kg.")
    .max(250, "Weight must be 250 kg or below."),
  target_weight_kg: z
    .number({ message: "Please enter your target weight in kg." })
    .min(30, "Target weight must be at least 30 kg.")
    .max(250, "Target weight must be 250 kg or below."),
  target_date: z
    .string()
    .refine((dateStr) => {
      const target = new Date(dateStr);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 6); // at least 7 days away
      return target >= minDate;
    }, "Target date must be at least 7 days in the future."),
  activity_factor: z.enum(["1.375", "1.55", "1.725"], {
    message: "Please select your daily activity level.",
  }),
  diet: z.enum(["veg", "egg"], {
    message: "Please select your diet (vegetarian or eggetarian).",
  }),
  dumbbell_step_kg: z
    .number({ message: "Please enter your smallest dumbbell step in kg." })
    .min(0.5, "Smallest jump must be at least 0.5 kg.")
    .max(5, "Smallest jump must be 5 kg or below."),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
