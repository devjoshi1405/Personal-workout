"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dumbbell,
  Clock,
  Flame,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Footprints,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Award,
  Layers,
  History,
  AlertCircle,
} from "lucide-react";
import {
  DayOfWeekKey,
  SEVEN_DAY_WORKOUT_PLAN,
  PlanExercise,
  ExerciseAlternative,
  AVAILABLE_DUMBBELL_WEIGHTS_KG,
} from "@/lib/workout/seven-day-plan";
import {
  SevenDayPlanState,
  LoggedSetData,
  loadPlanState,
  savePlanState,
  getInitialPlanState,
  getTodayDayKey,
  createInitialSetsForExercise,
  calculateWeeklyStats,
  checkProgressionOpportunity,
  finishDayWorkout,
  advanceToNextWeek,
} from "@/lib/workout/plan-store";
import { RestTimer } from "@/components/workout/rest-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function SevenDayPlanner() {
  const [state, setState] = React.useState<SevenDayPlanState>(getInitialPlanState);
  const [activeDay, setActiveDay] = React.useState<DayOfWeekKey>("mon");
  const [todayKey, setTodayKey] = React.useState<DayOfWeekKey>("mon");
  const [exerciseSets, setExerciseSets] = React.useState<Record<string, LoggedSetData[]>>({});
  const [activeRestSeconds, setActiveRestSeconds] = React.useState<number | null>(null);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [expandedInstructions, setExpandedInstructions] = React.useState<Record<string, boolean>>({});
  const [expandedAlternatives, setExpandedAlternatives] = React.useState<Record<string, boolean>>({});
  const [showSafetyGuide, setShowSafetyGuide] = React.useState(false);

  // Swapped exercises for current session (e.g. Floor Press swapped for Bench Press)
  const [swappedExercises, setSwappedExercises] = React.useState<Record<string, ExerciseAlternative>>({});

  // Completion summary modal state
  const [completedSummary, setCompletedSummary] = React.useState<{
    dayKey: DayOfWeekKey;
    volumeKg: number;
    completedSets: number;
    durationMinutes: number;
  } | null>(null);

  // Hydrate from localStorage safely on mount
  React.useEffect(() => {
    const today = getTodayDayKey();
    setTodayKey(today);
    const loaded = loadPlanState();
    setState(loaded);
    setActiveDay(loaded.activeDay || today);
    setStartTime(Date.now());
  }, []);

  const activePlan = SEVEN_DAY_WORKOUT_PLAN[activeDay];

  // Initialize or restore sets whenever activeDay changes
  React.useEffect(() => {
    if (activePlan.isRestDay) return;

    // Check if we already have saved progress for this day
    const savedDayRecord = state.dayProgress[activeDay];
    const initial: Record<string, LoggedSetData[]> = {};

    for (const ex of activePlan.exercises) {
      if (savedDayRecord?.sets && savedDayRecord.sets[ex.id]) {
        initial[ex.id] = savedDayRecord.sets[ex.id];
      } else {
        const confirmedWeight = state.confirmedProgressions[ex.id]?.suggestedWeightKg;
        initial[ex.id] = createInitialSetsForExercise(
          ex,
          state.totalSetsPerExercise,
          confirmedWeight
        );
      }
    }

    setExerciseSets(initial);
    setStartTime(Date.now());
    // Auto-scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeDay, state.totalSetsPerExercise, activePlan]);

  const weeklyStats = React.useMemo(() => calculateWeeklyStats(state), [state]);

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: "weightKg" | "reps" | "completed",
    value: number | boolean
  ) => {
    setExerciseSets((prev) => {
      const current = prev[exerciseId] || [];
      const updated = [...current];
      updated[setIndex] = {
        ...updated[setIndex],
        [field]: value,
      };

      const nextRecord = { ...prev, [exerciseId]: updated };

      // Optimistically save current unsubmitted session draft to local storage
      const updatedProgress = {
        ...state.dayProgress,
        [activeDay]: {
          completed: state.dayProgress[activeDay]?.completed || false,
          sets: nextRecord,
        },
      };
      const newState = { ...state, dayProgress: updatedProgress };
      setState(newState);
      savePlanState(newState);

      return nextRecord;
    });
  };

  const handleToggleSetComplete = (exerciseId: string, setIndex: number, restSeconds: number) => {
    const currentStatus = exerciseSets[exerciseId]?.[setIndex]?.completed ?? false;
    const nextStatus = !currentStatus;

    handleUpdateSet(exerciseId, setIndex, "completed", nextStatus);

    // If marked complete, trigger rest timer
    if (nextStatus) {
      setActiveRestSeconds(restSeconds);
    }
  };

  const handleQuickWeightSelect = (exerciseId: string, setIndex: number, weightKg: number) => {
    handleUpdateSet(exerciseId, setIndex, "weightKg", weightKg);
  };

  const handleSwapToAlternative = (originalExerciseId: string, alt: ExerciseAlternative) => {
    setSwappedExercises((prev) => ({
      ...prev,
      [originalExerciseId]: alt,
    }));

    // Reset sets for this swapped exercise with the alternative suggested weight
    setExerciseSets((prev) => ({
      ...prev,
      [originalExerciseId]: Array.from({ length: state.totalSetsPerExercise }, (_, idx) => ({
        setNumber: idx + 1,
        weightKg: alt.suggestedWeightKg,
        reps: 10,
        completed: false,
      })),
    }));
  };

  const handleResetAlternative = (originalExerciseId: string) => {
    setSwappedExercises((prev) => {
      const copy = { ...prev };
      delete copy[originalExerciseId];
      return copy;
    });
  };

  const handleAcceptProgression = (exerciseId: string, suggestedWeightKg: number) => {
    const updated = {
      ...state,
      confirmedProgressions: {
        ...state.confirmedProgressions,
        [exerciseId]: {
          suggestedWeightKg,
          acceptedAt: new Date().toISOString(),
        },
      },
    };
    setState(updated);
    savePlanState(updated);
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    const elapsedMinutes = startTime
      ? Math.max(5, Math.round((Date.now() - startTime) / (1000 * 60)))
      : activePlan.estimatedDurationMinutes || 35;

    const res = await finishDayWorkout({
      dayKey: activeDay,
      durationMinutes: elapsedMinutes,
      setsRecord: exerciseSets,
      currentState: state,
    });

    setState(res.newState);
    setCompletedSummary({
      dayKey: activeDay,
      volumeKg: res.totalVolumeKg,
      completedSets: res.completedSetsCount,
      durationMinutes: elapsedMinutes,
    });
    setIsFinishing(false);
  };

  const handleToggleSetsCount = () => {
    const nextCount = state.totalSetsPerExercise === 2 ? 3 : 2;
    const nextState = { ...state, totalSetsPerExercise: nextCount };
    setState(nextState);
    savePlanState(nextState);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Plan Header & Program Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Personalized 7-Day Dumbbell Program • 110 kg Beginner Calibration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Dumbbell Overload Planner</span>
            <span className="w-2.5 h-2.5 rounded-full bg-gold" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Home training with flat bench &amp; 5 kg, 10 kg, 20 kg dumbbells. Zero machines required.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSafetyGuide((prev) => !prev)}
            className="min-h-[44px] text-xs font-bold gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Safety &amp; Rules</span>
          </Button>

          <Link href="/workout/history">
            <Button variant="outline" size="sm" className="min-h-[44px] text-xs font-bold gap-1.5">
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Safety & Evidence-Based Guidelines Accordion */}
      {showSafetyGuide && (
        <Card className="border-primary/30 bg-primary/5 animate-in fade-in duration-150">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Safety, Progression &amp; Realistic Expectations</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Evidence-based guidelines designed specifically for joint longevity and sustainable fat loss
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <span>RPE 7–8 Rule (Reps in Reserve)</span>
              </span>
              <p>
                Stop each working set when you could still perform approximately <strong>2 to 3 more repetitions</strong> with pristine technique. Never train to muscle failure as a beginner.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Sharp Pain vs. Muscle Fatigue</span>
              </span>
              <p>
                A gentle burning sensation in the muscle belly is normal. <strong>Sharp, clicking, or pinching joint sensations in shoulders or knees are reasons to stop immediately</strong> or swap to the provided beginner alternative (such as the Dumbbell Floor Press).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Fat Loss &amp; Weight Truth</span>
              </span>
              <p>
                No single resistance exercise burns fat from a specific body region (spot reduction is a myth). This program preserves metabolically active lean muscle while your daily caloric deficit and low-impact walking steadily burn systemic adipose tissue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Progress Banner & Phase Config */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Program Week {state.programWeek} of 12
                </span>
                <Badge variant={state.totalSetsPerExercise === 2 ? "secondary" : "default"} className="text-[11px] font-bold">
                  {state.totalSetsPerExercise} Sets / Exercise
                </Badge>
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground pt-0.5">
                {weeklyStats.completedDaysCount} of {weeklyStats.totalTrainingDays} Workouts Completed ({weeklyStats.completionPercentage}%)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSetsCount}
                className="text-xs font-bold min-h-[40px] gap-1.5"
                title="Weeks 1-2 default to 2 sets. Weeks 3+ can unlock 3 sets."
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Switch to {state.totalSetsPerExercise === 2 ? "3 Sets (Phase 2)" : "2 Sets (Phase 1)"}</span>
              </Button>

              {weeklyStats.isAllCompleted && (
                <Button
                  size="sm"
                  onClick={() => {
                    const next = advanceToNextWeek(state);
                    setState(next);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[40px] gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Start Week {state.programWeek + 1}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${weeklyStats.completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold pt-0.5">
              <span>Equipment: 5 kg, 10 kg, 20 kg Dumbbells &amp; Flat Bench</span>
              <span>Sunday Rest Day Excluded from Ratio</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seven-Day Interactive Tab Selector */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
          Select Day
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as DayOfWeekKey[]).map((dayKey) => {
            const plan = SEVEN_DAY_WORKOUT_PLAN[dayKey];
            const isSelected = activeDay === dayKey;
            const isToday = todayKey === dayKey;
            const isCompleted = state.dayProgress[dayKey]?.completed;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => {
                  setActiveDay(dayKey);
                  const updatedState = { ...state, activeDay: dayKey };
                  setState(updatedState);
                  savePlanState(updatedState);
                }}
                className={`min-h-[64px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-[1.02]"
                    : isCompleted
                    ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-foreground hover:border-emerald-500"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
              >
                {/* Today Dot Marker */}
                {isToday && (
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                      isSelected ? "bg-gold ring-2 ring-card" : "bg-primary"
                    }`}
                    title="Today"
                  />
                )}

                <span className="text-[11px] sm:text-xs font-black uppercase">
                  {plan.shortDay}
                </span>

                <span
                  className={`text-[9px] sm:text-[10px] font-semibold leading-tight line-clamp-1 ${
                    isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                  }`}
                >
                  {plan.dayKey === "sun" ? "Rest" : plan.muscleFocus.split(",")[0]}
                </span>

                <div className="pt-0.5">
                  {isCompleted ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                      ✓
                    </span>
                  ) : plan.isRestDay ? (
                    <Heart className={`w-3.5 h-3.5 ${isSelected ? "text-rose-200" : "text-rose-500"}`} />
                  ) : plan.isLightCardioDay ? (
                    <Footprints className={`w-3.5 h-3.5 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                  ) : (
                    <Dumbbell className={`w-3.5 h-3.5 opacity-60`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout Completion Success Modal */}
      {completedSummary && (
        <Card className="border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 shadow-xl animate-in zoom-in-95 duration-200">
          <CardHeader className="text-center pb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-black text-emerald-950 dark:text-emerald-100">
              Workout Finished &amp; Recorded!
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              {SEVEN_DAY_WORKOUT_PLAN[completedSummary.dayKey].title} • {completedSummary.durationMinutes} mins duration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-card/80 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Sets Logged</span>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  {completedSummary.completedSets}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-card/80 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Volume Moved</span>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  {completedSummary.volumeKg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setCompletedSummary(null)}
                className="flex-1 font-bold min-h-[44px]"
              >
                Continue Planning
              </Button>
              <Link href="/today" className="flex-1">
                <Button variant="outline" className="w-full font-bold min-h-[44px]">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUNDAY REST & RECOVERY VIEW */}
      {activePlan.isRestDay && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-bold">
                  Active Recovery &amp; System Reset
                </Badge>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Sunday Restoration</span>
                </span>
              </div>
              <CardTitle className="text-2xl font-black text-foreground pt-1 flex items-center gap-2">
                <span>Sunday — Rest and Recovery</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed">
                No resistance training scheduled today. Muscles do not grow in the gym; workouts provide the stimulus, while recovery synthesizes new muscle tissue and restores joint fluid.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground">1. Deep Sleep Optimization</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {activePlan.recoveryGuidance?.sleep}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground">2. Hydration Recovery</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {activePlan.recoveryGuidance?.hydration}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground">3. Vegetarian Protein Maintenance</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {activePlan.recoveryGuidance?.nutrition}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground">4. Mindset &amp; Patience</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {activePlan.recoveryGuidance?.mindset}
                  </p>
                </div>
              </div>

              {/* Weekly Review Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-primary">Weekly Performance Debrief</span>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    You completed {weeklyStats.completedDaysCount} of 6 active days this week.
                  </p>
                </div>
                <Link href="/summary/weekly">
                  <Button size="sm" className="font-bold text-xs min-h-[40px] gap-1.5 shrink-0">
                    <span>Open Weekly Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ACTIVE RESISTANCE OR CARDIO/CORE WORKOUT VIEW */}
      {!activePlan.isRestDay && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Active Workout Card Header */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={state.dayProgress[activeDay]?.completed ? "success" : "default"} className="font-bold">
                  {state.dayProgress[activeDay]?.completed ? "Completed Workout ✓" : activePlan.dayName}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{activePlan.estimatedDurationMinutes} mins</span>
                  </span>
                  <span>•</span>
                  <span>{activePlan.exercises.length} Exercises</span>
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black text-foreground pt-1">
                {activePlan.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">
                Focus: {activePlan.muscleFocus}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 pb-3 space-y-3">
              {/* Dynamic 5-Min Warm-up Accordion */}
              {activePlan.warmup.length > 0 && (
                <details className="group border border-border/80 rounded-xl bg-muted/30 p-3 text-xs">
                  <summary className="font-bold flex items-center justify-between cursor-pointer list-none select-none text-foreground">
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-primary" />
                      <span>5-Minute Dynamic Warm-up ({activePlan.warmup.length} Movements)</span>
                    </span>
                    <span className="text-muted-foreground text-[10px] group-open:rotate-90 transition-transform">
                      ▶
                    </span>
                  </summary>
                  <div className="pt-2.5 space-y-2 border-t border-border/40 mt-2">
                    {activePlan.warmup.map((w, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                        <span className="font-bold text-foreground">
                          {idx + 1}. {w.name}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{w.focus}</span>
                          <Badge variant="outline" className="text-[10px] h-5 tabular-nums">
                            {w.duration}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Exercise List */}
          <div className="space-y-4">
            {activePlan.exercises.map((ex, exerciseIndex) => {
              const activeExercise = swappedExercises[ex.id] || ex;
              const isSwapped = Boolean(swappedExercises[ex.id]);
              const sets = exerciseSets[ex.id] || [];
              const isInstructionsOpen = expandedInstructions[ex.id] ?? false;
              const isAlternativesOpen = expandedAlternatives[ex.id] ?? false;
              const progression = checkProgressionOpportunity(ex, sets);

              return (
                <Card key={ex.id} className="border-border shadow-sm overflow-hidden bg-card">
                  {/* Exercise Header */}
                  <CardHeader className="pb-3 border-b border-border/40 bg-card">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-primary tabular-nums">
                            #{exerciseIndex + 1}
                          </span>
                          <Badge variant="secondary" className="text-[11px] font-bold">
                            {ex.primaryMuscle}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{ex.restSeconds}s rest</span>
                          </span>
                          {isSwapped && (
                            <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 font-bold">
                              Swapped Alternative
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2 pt-0.5">
                          <span>{activeExercise.name}</span>
                        </CardTitle>

                        {/* Explicit Weight and Rep Prescription */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-xs font-bold text-foreground bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
                            Prescribed: {activeExercise.weightDisplay}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Target: {sets.length} sets × {ex.repMin}–{ex.repMax} reps
                          </span>
                        </div>
                      </div>

                      {/* Controls: Form Info & Alternatives toggle */}
                      <div className="flex items-center gap-1 self-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedInstructions((prev) => ({
                              ...prev,
                              [ex.id]: !isInstructionsOpen,
                            }))
                          }
                          className="min-h-[40px] text-xs font-bold gap-1 px-2.5"
                          aria-label="Toggle exercise instructions"
                        >
                          <Info className="w-4 h-4 text-primary" />
                          <span>Cues</span>
                          {isInstructionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>

                        {ex.alternatives.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedAlternatives((prev) => ({
                                ...prev,
                                [ex.id]: !isAlternativesOpen,
                              }))
                            }
                            className="min-h-[40px] text-xs font-bold gap-1 px-2.5 text-amber-700 dark:text-amber-300"
                            aria-label="Toggle beginner alternatives"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Swap</span>
                            {isAlternativesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Step-by-Step Instructions */}
                    {isInstructionsOpen && (
                      <div className="mt-2.5 p-3 rounded-xl bg-muted/50 border border-border text-xs space-y-2 animate-in fade-in duration-150">
                        <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                          Form Execution Steps:
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                          {(Array.isArray(activeExercise.instructions)
                            ? activeExercise.instructions
                            : [activeExercise.instructions]
                          ).map((step: string, idx: number) => (
                            <li key={idx} className="pl-1">
                              {step}
                            </li>
                          ))}
                        </ol>
                        <div className="text-[11px] text-foreground font-medium pt-1 border-t border-border/40">
                          <strong>Equipment Required:</strong> {activeExercise.equipment}
                        </div>
                      </div>
                    )}

                    {/* Expandable Beginner Alternatives Drawer */}
                    {isAlternativesOpen && ex.alternatives.length > 0 && (
                      <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px]">
                            Mobility &amp; Beginner Safe Alternatives:
                          </span>
                          {isSwapped && (
                            <button
                              type="button"
                              onClick={() => handleResetAlternative(ex.id)}
                              className="text-[11px] font-bold text-primary underline"
                            >
                              Reset to Original
                            </button>
                          )}
                        </div>
                        {ex.alternatives.map((alt) => (
                          <div key={alt.id} className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground">{alt.name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSwapToAlternative(ex.id, alt)}
                                className="h-7 text-[11px] font-bold px-2.5 border-primary text-primary"
                              >
                                {isSwapped && swappedExercises[ex.id].id === alt.id ? "Selected ✓" : "Use This Instead"}
                              </Button>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              <strong>Why:</strong> {alt.reason}
                            </p>
                            <div className="text-[10px] text-muted-foreground font-medium">
                              Load: {alt.weightDisplay} • {alt.equipment}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Safety Alert Note */}
                    {ex.safetyNotes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-start gap-2 text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-foreground">Safety cue:</strong> {ex.safetyNotes}
                        </span>
                      </div>
                    )}

                    {/* Progressive Overload Notification Banner */}
                    {progression && (
                      <div className="mt-2 p-2.5 rounded-xl bg-gold-subtle border border-gold/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-gold-foreground animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-gold shrink-0" />
                          <span className="font-medium">{progression.message}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptProgression(ex.id, progression.suggestedWeightKg)}
                          className="bg-gold text-gold-foreground font-bold text-xs h-8 px-3 shrink-0"
                        >
                          Calibrate {progression.suggestedWeightKg} kg Next Week
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  {/* Interactive Sets Table */}
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase px-2">
                      <span className="col-span-2 text-center">Set</span>
                      <span className="col-span-6 sm:col-span-5">Weight (kg)</span>
                      <span className="col-span-2 sm:col-span-3 text-center">Reps</span>
                      <span className="col-span-2 text-center">Done</span>
                    </div>

                    {sets.map((set, setIdx) => {
                      const isCompleted = set.completed;

                      return (
                        <div
                          key={setIdx}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                            isCompleted
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-card border-border/60 hover:border-border"
                          }`}
                        >
                          {/* Set Number */}
                          <div className="col-span-2 flex items-center justify-center font-black text-sm tabular-nums text-foreground">
                            {set.setNumber}
                          </div>

                          {/* Weight Column: Input + Available Quick Pills */}
                          <div className="col-span-6 sm:col-span-5 space-y-1">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={set.weightKg === 0 ? "0" : set.weightKg}
                              onChange={(e) =>
                                handleUpdateSet(ex.id, setIdx, "weightKg", parseFloat(e.target.value) || 0)
                              }
                              placeholder="kg"
                              className="h-10 text-center font-bold text-sm tabular-nums min-h-[44px]"
                            />
                            {/* Quick Selection Pills: 0kg, 5kg, 10kg, 20kg */}
                            <div className="hidden sm:flex items-center gap-1 justify-center">
                              {AVAILABLE_DUMBBELL_WEIGHTS_KG.map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => handleQuickWeightSelect(ex.id, setIdx, w)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                    set.weightKg === w
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/60 text-muted-foreground border-border hover:text-foreground"
                                  }`}
                                >
                                  {w === 0 ? "BW" : `${w}kg`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reps Column */}
                          <div className="col-span-2 sm:col-span-3">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={set.reps === 0 ? "" : set.reps}
                              onChange={(e) =>
                                handleUpdateSet(ex.id, setIdx, "reps", parseInt(e.target.value, 10) || 0)
                              }
                              placeholder={ex.repMin.toString()}
                              className="h-10 text-center font-bold text-sm tabular-nums min-h-[44px]"
                            />
                          </div>

                          {/* Done Checkbox Button (Min 44px for sweaty fingers) */}
                          <div className="col-span-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSetComplete(ex.id, setIdx, ex.restSeconds)}
                              className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all ${
                                isCompleted
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "border-2 border-border bg-muted/40 text-muted-foreground hover:border-primary/50"
                              }`}
                              aria-label={`Mark set ${setIdx + 1} of ${ex.name} complete`}
                            >
                              <Check className={`w-5 h-5 ${isCompleted ? "stroke-[3]" : "opacity-40"}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Cool-down Drawer */}
          {activePlan.cooldown.length > 0 && (
            <details className="group border border-border/80 rounded-xl bg-card p-3 text-xs">
              <summary className="font-bold flex items-center justify-between cursor-pointer list-none select-none text-foreground">
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-500" />
                  <span>Cool-down Static Stretches ({activePlan.cooldown.length} Stretches)</span>
                </span>
                <span className="text-muted-foreground text-[10px] group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="pt-2.5 space-y-2 border-t border-border/40 mt-2">
                {activePlan.cooldown.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="font-bold text-foreground">
                      {idx + 1}. {c.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{c.duration}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Finish Workout Action Button (Sticky for convenience on phone) */}
          <div className="pt-4 sticky bottom-16 lg:bottom-4 z-30">
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="w-full min-h-[52px] text-base font-black shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isFinishing ? "Saving Sets..." : "Finish Workout & Save"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Floating Rest Timer on Set Completion */}
      {activeRestSeconds !== null && (
        <RestTimer
          initialSeconds={activeRestSeconds}
          onDismiss={() => setActiveRestSeconds(null)}
        />
      )}
    </div>
  );
}
