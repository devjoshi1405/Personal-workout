"use client";

import * as React from "react";
import {
  Info,
  Check,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  Dumbbell,
  AlertCircle,
} from "lucide-react";
import { Exercise, TemplateExercise } from "@/lib/db/types";
import { OverloadSuggestion } from "@/lib/calc/overload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

interface ExerciseCardProps {
  exerciseItem: TemplateExercise & {
    exercise: Exercise;
    lastPerformance?: { weight_kg: number; reps: number }[];
    overloadSuggestion: OverloadSuggestion;
    best1RM: number;
  };
  sets: LoggedSet[];
  onUpdateSet: (setIndex: number, field: "weightKg" | "reps" | "completed", value: number | boolean) => void;
  onSetCompleted: (restSeconds: number) => void;
  onSwapExercise?: (exerciseId: string) => void;
}

export function ExerciseCard({
  exerciseItem,
  sets,
  onUpdateSet,
  onSetCompleted,
  onSwapExercise,
}: ExerciseCardProps) {
  const [showTip, setShowTip] = React.useState(false);
  const [missingNextDumbbell, setMissingNextDumbbell] = React.useState(false);

  const { exercise, rep_min, rep_max, rest_seconds, overloadSuggestion, lastPerformance, best1RM } = exerciseItem;
  const isSeconds = exercise.unit === "seconds";

  const handleToggleComplete = (index: number) => {
    const current = sets[index]?.completed ?? false;
    const nextState = !current;
    onUpdateSet(index, "completed", nextState);

    // Auto-trigger rest timer when completing a set
    if (nextState) {
      onSetCompleted(rest_seconds);
    }
  };

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-card">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-bold">
                {exercise.muscle_group}
              </Badge>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{rest_seconds}s rest</span>
              </span>
            </div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2 pt-0.5">
              <span>{exercise.name}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Target: {exerciseItem.sets} sets × {rep_min}-{rep_max} {isSeconds ? "secs" : "reps"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTip((prev) => !prev)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Toggle exercise form tip"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Form Tip */}
        {showTip && (
          <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground mt-2 animate-in fade-in duration-150">
            <strong className="text-foreground">Form Cue:</strong> {exercise.tip}
          </div>
        )}

        {/* Overload Engine Suggestion Badge */}
        <div className="mt-2.5 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span className="text-foreground font-medium">
              {missingNextDumbbell
                ? "Tempo Overload: 3s down, 1s pause at peak."
                : overloadSuggestion.rationale}
            </span>
          </div>

          {overloadSuggestion.action === "bump_weight" && (
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold cursor-pointer shrink-0 select-none">
              <input
                type="checkbox"
                checked={missingNextDumbbell}
                onChange={(e) => setMissingNextDumbbell(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary"
              />
              <span>I don&apos;t have heavier DB</span>
            </label>
          )}
        </div>

        {/* Last Time Performance */}
        {lastPerformance && lastPerformance.length > 0 && (
          <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5 tabular-nums">
            <span className="font-bold text-foreground">Last session:</span>
            <span>
              {lastPerformance.map((s, i) => `${s.weight_kg}kg × ${s.reps}`).join(", ")}
            </span>
            {best1RM > 0 && (
              <span className="ml-auto text-primary font-bold">1RM: {best1RM} kg</span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-2">
        {/* Set Header */}
        <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase px-2">
          <span className="col-span-2 text-center">Set</span>
          <span className="col-span-5">{isSeconds ? "Seconds" : "Weight (kg)"}</span>
          <span className="col-span-3">{isSeconds ? "Hold (s)" : "Reps"}</span>
          <span className="col-span-2 text-center">Done</span>
        </div>

        {/* Set Rows */}
        {sets.map((set, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
              set.completed
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-card border-border/60 hover:border-border"
            }`}
          >
            {/* Set Number */}
            <div className="col-span-2 flex items-center justify-center font-black text-sm tabular-nums text-foreground">
              {idx + 1}
            </div>

            {/* Weight Input */}
            <div className="col-span-5">
              <Input
                type="number"
                step="0.5"
                value={set.weightKg === 0 ? "" : set.weightKg}
                onChange={(e) => onUpdateSet(idx, "weightKg", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-10 text-center font-bold text-sm tabular-nums min-h-[44px]"
              />
            </div>

            {/* Reps Input */}
            <div className="col-span-3">
              <Input
                type="number"
                value={set.reps === 0 ? "" : set.reps}
                onChange={(e) => onUpdateSet(idx, "reps", parseInt(e.target.value, 10) || 0)}
                placeholder={rep_min.toString()}
                className="h-10 text-center font-bold text-sm tabular-nums min-h-[44px]"
              />
            </div>

            {/* Complete Checkmark Button (Min 44px for sweaty fingers) */}
            <div className="col-span-2 flex justify-center">
              <button
                type="button"
                onClick={() => handleToggleComplete(idx)}
                className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all ${
                  set.completed
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border-2 border-border bg-muted/40 text-muted-foreground hover:border-primary/50"
                }`}
                aria-label={`Mark set ${idx + 1} complete`}
              >
                <Check className={`w-5 h-5 ${set.completed ? "stroke-[3]" : "opacity-40"}`} />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
