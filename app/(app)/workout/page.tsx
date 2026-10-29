"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dumbbell,
  History,
  Timer,
  CheckCircle2,
  Sparkles,
  Flame,
  AlertTriangle,
  Heart,
  ChevronRight,
  ShieldCheck,
  Award,
  Footprints,
  Info,
} from "lucide-react";
import { TemplateKey } from "@/lib/db/types";
import {
  loadWorkoutTemplate,
  saveWorkoutSession,
  FullTemplateData,
  getDeloadRecommendation,
  FULL_BODY_MOBILITY_REST_DAY,
} from "@/lib/db/workout-store";
import { ExerciseCard, LoggedSet } from "@/components/workout/exercise-card";
import { RestTimer } from "@/components/workout/rest-timer";
import { InjuryModal } from "@/components/workout/injury-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ActiveTab = TemplateKey | "REST";

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("UA");
  const [templateData, setTemplateData] = React.useState<FullTemplateData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Per-exercise set state: exercise_id -> LoggedSet[]
  const [exerciseSets, setExerciseSets] = React.useState<Record<string, LoggedSet[]>>({});

  // Active rest timer
  const [activeRestSeconds, setActiveRestSeconds] = React.useState<number | null>(null);

  // Workout timing
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [isFinishing, setIsFinishing] = React.useState(false);

  React.useEffect(() => {
    setStartTime(Date.now());
  }, []);
  const [completionSummary, setCompletionSummary] = React.useState<{
    volumeKg: number;
    completedSets: number;
    newPRs: { exercise_id: string; est_1rm: number }[];
  } | null>(null);

  // Injury & Soreness swaps
  const [showInjuryModal, setShowInjuryModal] = React.useState(false);
  const [activeInjuries, setActiveInjuries] = React.useState<string[]>([]);

  // Deload checks
  const deloadInfo = React.useMemo(() => {
    return getDeloadRecommendation(2); // Current week 2 (deload triggers at week 7)
  }, []);

  // Load template whenever activeTab changes
  React.useEffect(() => {
    if (activeTab === "REST") {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadWorkoutTemplate(activeTab).then((data) => {
      setTemplateData(data);
      if (data) {
        // Initialize sets for all exercises
        const initialSets: Record<string, LoggedSet[]> = {};
        for (const item of data.exercises) {
          const defaultWeight = item.overloadSuggestion.suggestedWeightKg || (item.lastPerformance?.[0]?.weight_kg ?? 14);
          const defaultReps = item.overloadSuggestion.suggestedReps || item.rep_min;

          initialSets[item.exercise_id] = Array.from({ length: item.sets }, (_, i) => ({
            setNumber: i + 1,
            weightKg: defaultWeight,
            reps: defaultReps,
            completed: false,
          }));
        }
        setExerciseSets(initialSets);
      }
      setLoading(false);
    });
  }, [activeTab]);

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
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleToggleInjury = (areaId: string) => {
    setActiveInjuries((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  const handleFinishWorkout = async () => {
    setIsFinishing(true);

    const elapsedMinutes = startTime
      ? Math.max(1, Math.round((Date.now() - startTime) / (1000 * 60)))
      : 45;
    const allSetsFlat = Object.entries(exerciseSets).flatMap(([exId, sets]) =>
      sets
        .filter((s) => s.completed)
        .map((s) => ({
          exercise_id: exId,
          set_number: s.setNumber,
          weight_kg: s.weightKg,
          reps: s.reps,
        }))
    );

    const totalVolume = allSetsFlat.reduce((acc, curr) => acc + curr.weight_kg * curr.reps, 0);

    const { newPRs } = await saveWorkoutSession({
      templateKey: activeTab === "REST" ? "UA" : activeTab,
      durationMinutes: elapsedMinutes,
      sets: allSetsFlat,
    });

    setCompletionSummary({
      volumeKg: totalVolume,
      completedSets: allSetsFlat.length,
      newPRs: newPRs.map((p) => ({ exercise_id: p.exercise_id, est_1rm: p.est_1rm })),
    });

    setIsFinishing(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Workout Tracker</span>
            <span className="w-2 h-2 rounded-full bg-gold" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Dumbbells &amp; flat bench progressive overload engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInjuryModal(true)}
            className="min-h-[44px] font-semibold text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Injury Swaps</span>
            {activeInjuries.length > 0 && (
              <Badge variant="gold" className="text-[10px] h-4 px-1.5">
                {activeInjuries.length}
              </Badge>
            )}
          </Button>

          <Link href="/workout/history">
            <Button variant="outline" size="sm" className="min-h-[44px] font-semibold text-xs flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Split Tabs (Upper A, Lower A, Upper B, Lower B, Rest Day) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
        {[
          { key: "UA" as const, label: "Upper A", subtitle: "Mon" },
          { key: "LA" as const, label: "Lower A", subtitle: "Tue" },
          { key: "UB" as const, label: "Upper B", subtitle: "Thu" },
          { key: "LB" as const, label: "Lower B", subtitle: "Fri" },
          { key: "REST" as const, label: "Rest Day", subtitle: "Recovery" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[76px] min-h-[44px] py-2 px-3 rounded-xl text-center border font-bold transition-all flex flex-col items-center justify-center ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground"
              }`}
            >
              <span className="text-xs leading-none">{tab.label}</span>
              <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deload / Fatigue Alert Banner */}
      {deloadInfo.message && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">{deloadInfo.message}</p>
        </div>
      )}

      {/* Completed Workout Celebration Card */}
      {completionSummary && (
        <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-lg animate-in zoom-in-95 duration-200">
          <CardHeader className="pb-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-black text-emerald-900 dark:text-emerald-100">
              Workout Complete!
            </CardTitle>
            <CardDescription className="text-emerald-800 dark:text-emerald-300">
              {completionSummary.completedSets} sets recorded • {completionSummary.volumeKg.toLocaleString()} kg total volume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionSummary.newPRs.length > 0 && (
              <div className="p-3 rounded-xl bg-gold-subtle border border-gold/40 text-gold-foreground flex items-center gap-2 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-gold shrink-0" />
                <span>New Personal Record achieved! 1RM updated in your profile.</span>
              </div>
            )}
            <div className="flex gap-2">
              <Link href="/today" className="flex-1">
                <Button className="w-full font-bold min-h-[44px]">Go to Dashboard</Button>
              </Link>
              <Link href="/workout/history" className="flex-1">
                <Button variant="outline" className="w-full font-bold min-h-[44px]">View History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REST DAY VIEW */}
      {activeTab === "REST" && (
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Active Recovery</Badge>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-emerald-500" />
                  <span>30 Min Walk</span>
                </span>
              </div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 pt-1 text-foreground">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Rest Day Mobility &amp; Full Body Stretch</span>
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Muscle hypertrophy occurs during rest and sleep. This 10-minute flow increases blood flow, alleviates DOMS soreness, and improves hip and thoracic mobility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {FULL_BODY_MOBILITY_REST_DAY.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{idx + 1}. {item.name}</span>
                    <Badge variant="outline" className="text-[10px]">{item.duration}</Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{item.instruction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ACTIVE WORKOUT VIEW */}
      {activeTab !== "REST" && templateData && (
        <div className="space-y-4">
          {/* Warm-up Drawer Preview */}
          <details className="group border border-border rounded-xl bg-card p-3 text-xs">
            <summary className="font-bold flex items-center justify-between cursor-pointer list-none select-none text-foreground">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <span>5-Minute Dynamic Warm-up ({templateData.warmup.length} movements)</span>
              </span>
              <span className="text-muted-foreground text-[10px] group-open:rotate-90 transition-transform">
                ▶
              </span>
            </summary>
            <div className="pt-3 space-y-2 border-t border-border/40 mt-2">
              {templateData.warmup.map((w, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="font-medium text-foreground">{w.name}</span>
                  <span className="text-muted-foreground tabular-nums">{w.duration}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Exercise Cards */}
          <div className="space-y-4">
            {templateData.exercises.map((item) => (
              <ExerciseCard
                key={item.exercise_id}
                exerciseItem={item}
                sets={exerciseSets[item.exercise_id] || []}
                onUpdateSet={(setIndex, field, value) =>
                  handleUpdateSet(item.exercise_id, setIndex, field, value)
                }
                onSetCompleted={(rest) => setActiveRestSeconds(rest)}
              />
            ))}
          </div>

          {/* Cool-down Stretches Drawer */}
          <details className="group border border-border rounded-xl bg-card p-3 text-xs">
            <summary className="font-bold flex items-center justify-between cursor-pointer list-none select-none text-foreground">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-500" />
                <span>Cool-down Static Stretches</span>
              </span>
              <span className="text-muted-foreground text-[10px] group-open:rotate-90 transition-transform">
                ▶
              </span>
            </summary>
            <div className="pt-3 space-y-2 border-t border-border/40 mt-2">
              {templateData.cooldown.map((c, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground tabular-nums">{c.duration}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Finish Workout Action */}
          <div className="pt-4 sticky bottom-16 lg:bottom-4 z-30">
            <Button
              type="button"
              onClick={handleFinishWorkout}
              disabled={isFinishing}
              className="w-full min-h-[52px] text-base font-black shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isFinishing ? "Saving Sets..." : "Finish Workout"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Floating Rest Timer */}
      {activeRestSeconds !== null && (
        <RestTimer
          initialSeconds={activeRestSeconds}
          onDismiss={() => setActiveRestSeconds(null)}
        />
      )}

      {/* Injury Modal */}
      {showInjuryModal && (
        <InjuryModal
          activeInjuries={activeInjuries}
          onToggleInjury={handleToggleInjury}
          onClose={() => setShowInjuryModal(false)}
        />
      )}
    </div>
  );
}
