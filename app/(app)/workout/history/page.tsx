"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadWorkoutHistory } from "@/lib/db/workout-store";
import { WorkoutSession } from "@/lib/db/types";

export default function WorkoutHistoryPage() {
  const [history, setHistory] = React.useState<
    (WorkoutSession & { totalSets: number; totalVolumeKg: number })[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadWorkoutHistory().then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  const templateTitles: Record<string, string> = {
    UA: "Upper Body A",
    LA: "Lower Body A",
    UB: "Upper Body B",
    LB: "Lower Body B",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workout">
          <Button variant="ghost" size="icon" aria-label="Back to workouts">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Workout History
          </h1>
          <p className="text-xs text-muted-foreground">
            Past dumbbell sessions, lifted volume, and personal records
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <Card className="border-border p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-foreground">No completed workouts yet</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Log your first dumbbell session today. Your progressive overload jumps, set volume, and personal records will be preserved here.
          </p>
          <Link href="/workout" className="inline-block pt-2">
            <Button size="sm" className="font-bold flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span>Start Upper Body A</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((sess) => {
            const splitName = templateTitles[sess.template_key] || sess.template_key;
            return (
              <Card key={sess.id} className="border-border hover:border-primary/40 transition-colors shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs font-bold">
                        {sess.template_key}
                      </Badge>
                      <span className="font-bold text-sm text-foreground">{splitName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{sess.date}</span>
                      </span>
                      {sess.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{sess.duration_minutes} min</span>
                        </span>
                      )}
                      <span>• {sess.totalSets} sets</span>
                      {sess.totalVolumeKg > 0 && (
                        <span className="font-bold text-foreground">
                          • {sess.totalVolumeKg.toLocaleString()} kg volume
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href="/workout">
                    <Button variant="ghost" size="sm" className="font-bold text-xs">
                      Repeat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
