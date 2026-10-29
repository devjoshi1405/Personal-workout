"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dumbbell,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Flame,
  Droplet,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { profileSchema, ProfileFormData } from "@/lib/validators/profile";
import { calculatePlan, PlanOutput } from "@/lib/calc/plan";
import { saveUserProfile } from "@/lib/db/profile-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OnboardingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [todayStr, setTodayStr] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      sex: "male",
      age: 26,
      height_cm: 175,
      current_weight_kg: 80,
      target_weight_kg: 74,
      target_date: "",
      activity_factor: "1.375",
      diet: "veg",
      dumbbell_step_kg: 2.0,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split("T")[0]);
    const target = new Date();
    target.setDate(target.getDate() + 84); // 12 weeks
    setValue("target_date", target.toISOString().split("T")[0]);
  }, [setValue]);

  const formValues = watch();

  // Dynamic real-time calculation preview
  const planPreview = React.useMemo<PlanOutput | null>(() => {
    try {
      const currentW = Number(formValues.current_weight_kg) || 80;
      const targetW = Number(formValues.target_weight_kg) || 74;
      const height = Number(formValues.height_cm) || 175;
      const age = Number(formValues.age) || 26;
      const activity = Number(formValues.activity_factor) || 1.375;

      return calculatePlan({
        currentWeightKg: currentW,
        targetWeightKg: targetW,
        heightCm: height,
        age: age,
        sex: formValues.sex || "male",
        activityFactor: activity,
        startDate: todayStr || "2026-01-01",
        targetDate: formValues.target_date || "2026-04-01",
      });
    } catch {
      return null;
    }
  }, [formValues, todayStr]);

  const handleUseRealisticDate = () => {
    if (planPreview?.realisticTargetDate) {
      setValue("target_date", planPreview.realisticTargetDate, {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await saveUserProfile(
        {
          user_id: "",
          name: data.name,
          sex: data.sex,
          age: Number(data.age),
          height_cm: Number(data.height_cm),
          activity_factor: Number(data.activity_factor),
          diet: data.diet,
          goal_weight_kg: Number(data.target_weight_kg),
          target_date: data.target_date,
          dumbbell_step_kg: Number(data.dumbbell_step_kg),
          start_date: todayStr,
          calorie_adjustment: 0,
          theme: "system",
          timezone: "Asia/Kolkata",
        },
        Number(data.current_weight_kg)
      );

      router.push("/today");
      router.refresh();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black shadow-md mx-auto mb-2">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            <span>Welcome to Bench &amp; Dal</span>
            <span className="w-2.5 h-2.5 rounded-full bg-gold" />
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Calibrate your personal dumbbell progression and vegetarian nutrition targets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Your Biometrics &amp; Goals</CardTitle>
                <CardDescription>
                  Enter your details once. We calibrate Mifflin-St Jeor BMR and overload jumps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      placeholder="e.g. Arjun"
                      {...register("name")}
                      className="min-h-[44px]"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Biological Sex */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Biological Sex (for Mifflin-St Jeor formula)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("sex", "male", { shouldValidate: true })}
                        className={`min-h-[44px] rounded-xl font-bold text-sm border transition-colors flex items-center justify-center ${
                          formValues.sex === "male"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Male (+5 BMR)
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("sex", "female", { shouldValidate: true })}
                        className={`min-h-[44px] rounded-xl font-bold text-sm border transition-colors flex items-center justify-center ${
                          formValues.sex === "female"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Female (-161 BMR)
                      </button>
                    </div>
                  </div>

                  {/* Age and Height */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="age" className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Age (14-80)
                      </label>
                      <Input
                        id="age"
                        type="number"
                        {...register("age", { valueAsNumber: true })}
                        className="min-h-[44px]"
                      />
                      {errors.age && (
                        <p className="text-xs text-destructive font-medium">{errors.age.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="height_cm" className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Height (cm)
                      </label>
                      <Input
                        id="height_cm"
                        type="number"
                        {...register("height_cm", { valueAsNumber: true })}
                        className="min-h-[44px]"
                      />
                      {errors.height_cm && (
                        <p className="text-xs text-destructive font-medium">{errors.height_cm.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Current and Target Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="current_weight_kg" className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Current Weight (kg)
                      </label>
                      <Input
                        id="current_weight_kg"
                        type="number"
                        step="0.1"
                        {...register("current_weight_kg", { valueAsNumber: true })}
                        className="min-h-[44px]"
                      />
                      {errors.current_weight_kg && (
                        <p className="text-xs text-destructive font-medium">{errors.current_weight_kg.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="target_weight_kg" className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Target Weight (kg)
                      </label>
                      <Input
                        id="target_weight_kg"
                        type="number"
                        step="0.1"
                        {...register("target_weight_kg", { valueAsNumber: true })}
                        className="min-h-[44px]"
                      />
                      {errors.target_weight_kg && (
                        <p className="text-xs text-destructive font-medium">{errors.target_weight_kg.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="target_date" className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center justify-between">
                      <span>Target Date (at least 7 days out)</span>
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </label>
                    <Input
                      id="target_date"
                      type="date"
                      {...register("target_date")}
                      className="min-h-[44px]"
                    />
                    {errors.target_date && (
                      <p className="text-xs text-destructive font-medium">{errors.target_date.message}</p>
                    )}
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Daily Activity Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: "1.375", title: "Sedentary", desc: "Mostly sitting" },
                        { val: "1.55", title: "Active", desc: "On feet often" },
                        { val: "1.725", title: "Physical", desc: "Heavy daily work" },
                      ].map((act) => (
                        <button
                          key={act.val}
                          type="button"
                          onClick={() => setValue("activity_factor", act.val as "1.375" | "1.55" | "1.725", { shouldValidate: true })}
                          className={`p-3 rounded-xl border text-left transition-colors ${
                            formValues.activity_factor === act.val
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="text-xs font-bold text-foreground">{act.title}</div>
                          <div className="text-[11px] opacity-80">{act.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diet & Equipment Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Diet */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Diet Preference
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setValue("diet", "veg", { shouldValidate: true })}
                          className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                            formValues.diet === "veg"
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          Pure Veg
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("diet", "egg", { shouldValidate: true })}
                          className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                            formValues.diet === "egg"
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          Eggetarian
                        </button>
                      </div>
                    </div>

                    {/* Smallest Dumbbell Jump */}
                    <div className="space-y-1.5">
                      <label htmlFor="dumbbell_step_kg" className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Smallest DB Jump (kg)
                      </label>
                      <select
                        id="dumbbell_step_kg"
                        {...register("dumbbell_step_kg", { valueAsNumber: true })}
                        className="w-full min-h-[44px] rounded-xl border border-input bg-card px-3 text-sm font-semibold"
                      >
                        <option value={1.0}>1.0 kg</option>
                        <option value={1.5}>1.5 kg</option>
                        <option value={2.0}>2.0 kg (Standard)</option>
                        <option value={2.5}>2.5 kg</option>
                        <option value={5.0}>5.0 kg</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[48px] text-base font-bold flex items-center justify-center gap-2 mt-4"
                  >
                    <span>{submitting ? "Calibrating..." : "Launch My Plan"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Dynamic Live Plan Engine Preview */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border shadow-md bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span>Live Plan Preview</span>
                  </span>
                  <Badge variant={planPreview?.goal === "maintain" ? "secondary" : "default"}>
                    {planPreview?.goal?.toUpperCase() || "PLAN"}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-black tabular-nums pt-1">
                  {planPreview?.dailyCalories.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kcal/day</span>
                </CardTitle>
                <CardDescription>
                  BMR: {planPreview?.bmr} kcal • TDEE: {planPreview?.tdee} kcal
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Safe Cap Alert & One-tap Realistic Date Button */}
                {planPreview?.capped && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Target exceeds safe rate cap</span>
                    </div>
                    <p className="leading-relaxed">
                      Safe {planPreview.goal} rate is at most {Math.abs(planPreview.safeWeeklyChangeKg)} kg/week. Realistic timeline is {planPreview.realisticWeeks} weeks ({planPreview.realisticTargetDate}).
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUseRealisticDate}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold min-h-[36px]"
                    >
                      Use Realistic Date ({planPreview.realisticTargetDate})
                    </Button>
                  </div>
                )}

                {/* Macro Breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-gold-subtle/40 border border-gold/30 text-center">
                    <div className="text-[11px] font-bold text-gold-foreground uppercase">Protein</div>
                    <div className="text-lg font-black text-gold-foreground tabular-nums">
                      {planPreview?.nutrition.proteinGrams}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {planPreview?.goal === "lose" ? "2.0 g/kg" : "1.8 g/kg"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Fats (25%)</div>
                    <div className="text-lg font-black text-foreground tabular-nums">
                      {planPreview?.nutrition.fatGrams}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">Clean lipids</div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Carbs</div>
                    <div className="text-lg font-black text-foreground tabular-nums">
                      {planPreview?.nutrition.carbGrams}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">Fuel energy</div>
                  </div>
                </div>

                {/* Habits: Water & Walk */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground tabular-nums">{planPreview?.nutrition.waterGlasses} Glasses</div>
                      <div className="text-muted-foreground text-[10px]">Water per day</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground tabular-nums">{planPreview?.walkingMinutesPerDay} Minutes</div>
                      <div className="text-muted-foreground text-[10px]">Daily walking</div>
                    </div>
                  </div>
                </div>

                {/* Training Split Summary */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span>4-Day Split • Dumbbells &amp; Flat Bench</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Mon: Upper A • Tue: Lower A • Thu: Upper B • Fri: Lower B. About 50 mins/session.
                  </p>
                </div>

                {/* Plain coaching quote */}
                <div className="text-center text-xs text-muted-foreground italic px-2">
                  &ldquo;{planPreview?.coachingMessage}&rdquo;
                </div>
              </CardContent>
            </Card>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                100% Meat-free Indian nutrition database. Tap targets $\ge$ 44px for gym workouts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
