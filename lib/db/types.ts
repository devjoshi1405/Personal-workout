export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DietType = "veg" | "egg";
export type SexType = "male" | "female";
export type SplitType = "upper" | "lower";
export type TemplateKey = "UA" | "LA" | "UB" | "LB";
export type ExerciseUnit = "reps" | "seconds";
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          name: string;
          sex: SexType;
          age: number;
          height_cm: number;
          activity_factor: number;
          diet: DietType;
          goal_weight_kg: number;
          target_date: string;
          dumbbell_step_kg: number;
          start_date: string;
          calorie_adjustment: number;
          theme: "system" | "light" | "dark";
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          sex: SexType;
          age: number;
          height_cm: number;
          activity_factor?: number;
          diet: DietType;
          goal_weight_kg: number;
          target_date: string;
          dumbbell_step_kg?: number;
          start_date?: string;
          calorie_adjustment?: number;
          theme?: "system" | "light" | "dark";
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          weight_kg: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weight_entries"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          unit: ExerciseUnit;
          tip: string;
          muscle_group: string;
          equipment: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          unit?: ExerciseUnit;
          tip: string;
          muscle_group: string;
          equipment?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
      workout_templates: {
        Row: {
          id: string;
          key: TemplateKey;
          name: string;
          subtitle: string;
          type: SplitType;
          created_at: string;
        };
        Insert: {
          id: string;
          key: TemplateKey;
          name: string;
          subtitle: string;
          type: SplitType;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_templates"]["Insert"]>;
      };
      template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          position: number;
          sets: number;
          rep_min: number;
          rep_max: number;
          rest_seconds: number;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          position: number;
          sets: number;
          rep_min: number;
          rep_max: number;
          rest_seconds: number;
        };
        Update: Partial<Database["public"]["Tables"]["template_exercises"]["Insert"]>;
      };
      exercise_alternatives: {
        Row: {
          exercise_id: string;
          alternative_id: string;
        };
        Insert: {
          exercise_id: string;
          alternative_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_alternatives"]["Insert"]>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          template_key: TemplateKey;
          duration_minutes: number | null;
          notes: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          template_key: TemplateKey;
          duration_minutes?: number | null;
          notes?: string | null;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_sessions"]["Insert"]>;
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["set_logs"]["Insert"]>;
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          date: string;
          weight_kg: number;
          reps: number;
          est_1rm: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          date?: string;
          weight_kg: number;
          reps: number;
          est_1rm: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["personal_records"]["Insert"]>;
      };
      foods: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          serving: string;
          protein_g: number;
          calories: number;
          diet: DietType;
          optional: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          name: string;
          serving: string;
          protein_g: number;
          calories: number;
          diet: DietType;
          optional?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["foods"]["Insert"]>;
      };
      food_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal: MealType;
          food_id: string | null;
          name: string;
          protein_g: number;
          calories: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          meal: MealType;
          food_id?: string | null;
          name: string;
          protein_g: number;
          calories: number;
          quantity?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_logs"]["Insert"]>;
      };
      favorite_foods: {
        Row: {
          user_id: string;
          food_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          food_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorite_foods"]["Insert"]>;
      };
      daily_habits: {
        Row: {
          user_id: string;
          date: string;
          water_glasses: number;
          sleep_hours: number | null;
          flexible_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date?: string;
          water_glasses?: number;
          sleep_hours?: number | null;
          flexible_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_habits"]["Insert"]>;
      };
      weekly_checkins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          energy: number;
          sleep_quality: number;
          soreness: number;
          mood: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          energy: number;
          sleep_quality: number;
          soreness: number;
          mood: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_checkins"]["Insert"]>;
      };
      calorie_adjustments: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          delta_kcal: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          delta_kcal: number;
          reason: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calorie_adjustments"]["Insert"]>;
      };
      measurements: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          waist_cm: number | null;
          chest_cm: number | null;
          arm_cm: number | null;
          thigh_cm: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          waist_cm?: number | null;
          chest_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["measurements"]["Insert"]>;
      };
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          storage_path: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          storage_path: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["progress_photos"]["Insert"]>;
      };
      injury_notes: {
        Row: {
          id: string;
          user_id: string;
          body_area: string;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          body_area: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["injury_notes"]["Insert"]>;
      };
      badges_earned: {
        Row: {
          user_id: string;
          badge_key: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_key: string;
          earned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["badges_earned"]["Insert"]>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          reminder_times: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          reminder_times?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
      };
      grocery_items: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          name: string;
          quantity: string;
          checked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          name: string;
          quantity: string;
          checked?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["grocery_items"]["Insert"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WeightEntry = Database["public"]["Tables"]["weight_entries"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];
export type TemplateExercise = Database["public"]["Tables"]["template_exercises"]["Row"];
export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type SetLog = Database["public"]["Tables"]["set_logs"]["Row"];
export type PersonalRecord = Database["public"]["Tables"]["personal_records"]["Row"];
export type Food = Database["public"]["Tables"]["foods"]["Row"];
export type FoodLog = Database["public"]["Tables"]["food_logs"]["Row"];
export type DailyHabit = Database["public"]["Tables"]["daily_habits"]["Row"];
export type WeeklyCheckin = Database["public"]["Tables"]["weekly_checkins"]["Row"];
export type CalorieAdjustment = Database["public"]["Tables"]["calorie_adjustments"]["Row"];
export type Measurement = Database["public"]["Tables"]["measurements"]["Row"];
export type ProgressPhoto = Database["public"]["Tables"]["progress_photos"]["Row"];
export type InjuryNote = Database["public"]["Tables"]["injury_notes"]["Row"];
export type BadgeEarned = Database["public"]["Tables"]["badges_earned"]["Row"];
export type PushSubscription = Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
