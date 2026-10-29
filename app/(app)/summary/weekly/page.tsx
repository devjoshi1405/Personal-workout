"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Award, 
  TrendingDown, 
  Dumbbell, 
  Sparkles, 
  CheckCircle2, 
  Moon, 
  Battery, 
  Activity, 
  Smile,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { fetchWeeklyCheckins, logWeeklyCheckin } from "@/lib/db/progress-store";
import { WeeklyCheckin } from "@/lib/db/types";

export default function WeeklySummaryPage() {
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [energy, setEnergy] = useState<number>(4);
  const [sleep, setSleep] = useState<number>(4);
  const [soreness, setSoreness] = useState<number>(2);
  const [mood, setMood] = useState<number>(4);
  const [notes, setNotes] = useState<string>("");
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    const list = await fetchWeeklyCheckins();
    setCheckins(list);
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logWeeklyCheckin({
      energy,
      sleep_quality: sleep,
      soreness,
      mood,
      notes,
    });

    setNotes("");
    setSubmittedFeedback("Weekly check-in logged! Coaching insights updated.");
    setTimeout(() => setSubmittedFeedback(null), 4000);
    await loadCheckins();
  };

  // Coaching intelligence deduction based on survey
  const needsDeload = soreness >= 4 && sleep <= 2;
  const isPrimed = energy >= 4 && soreness <= 3 && sleep >= 3;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/progress">
          <Button variant="ghost" size="icon" aria-label="Back to progress">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Weekly Coaching Debrief</span>
            <Sparkles className="w-5 h-5 text-gold" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Holistic recovery analysis, training volume review &amp; weekly check-in
          </p>
        </div>
      </div>

      {submittedFeedback && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{submittedFeedback}</span>
        </div>
      )}

      {/* Weekly High-Level Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Workouts</span>
            <div className="text-2xl font-black tabular-nums text-foreground">3 / 4</div>
            <p className="text-[11px] text-muted-foreground">Target: 4 Upper/Lower</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Avg Protein</span>
            <div className="text-2xl font-black text-gold tabular-nums">142 g</div>
            <p className="text-[11px] text-muted-foreground">Target: 140 g / day</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">7-Day Weight Trend</span>
            <div className="text-2xl font-black text-green-600 tabular-nums">-0.4 kg</div>
            <p className="text-[11px] text-muted-foreground">Rolling smoothed change</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Best 1RM PR</span>
            <div className="text-2xl font-black text-primary tabular-nums">28.5 kg</div>
            <p className="text-[11px] text-muted-foreground">Flat DB Bench Press</p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Coaching Intelligence Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-bold uppercase">
              Weekly Coach Assessment
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">Updated from survey</span>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 pt-1 text-foreground">
            {needsDeload ? (
              <span className="text-amber-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Deload Recommended: Systemic Fatigue Detected
              </span>
            ) : isPrimed ? (
              <span className="text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Peak Recovery Primed: Push Progressive Overload
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Steady Adaptation &amp; High Consistency
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            {needsDeload
              ? "Your sleep is low while muscle soreness remains acute. Continuing high intensity will blunt muscle hypertrophy and invite tendon strain. Drop weight by 10% or reduce working sets from 3 to 2 for this week."
              : isPrimed
              ? "Your recovery scores (energy, sleep, manageable soreness) are optimal. You are in a prime muscle protein synthesis window. Aim to add +1 rep or +1-2 kg to your working dumbbell sets on Day 1."
              : "Great job showing up consistently. Your 7-day trailing average weight dropped at the exact planned rate (-0.4 kg/wk) and your daily protein hit 142g. Maintain this rhythm."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Weekly Check-in Form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-bold">
            Sunday Check-in Survey
          </CardTitle>
          <CardDescription className="text-xs">
            Rate your subjective fatigue from 1 (lowest) to 5 (highest) so your coach can adapt volume.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCheckinSubmit}>
          <CardContent className="space-y-4">
            {/* Energy Slider/Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Battery className="w-4 h-4 text-primary" />
                  Energy Levels (1 = Drained, 5 = High Voltage)
                </span>
                <span className="text-primary font-black text-sm">{energy} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEnergy(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      energy === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Moon className="w-4 h-4 text-primary" />
                  Sleep Restorativeness (1 = Poor/Broken, 5 = Deep/Restorative)
                </span>
                <span className="text-primary font-black text-sm">{sleep} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSleep(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      sleep === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle Soreness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Activity className="w-4 h-4 text-primary" />
                  Muscle Soreness (1 = Fresh, 5 = Extreme DOMS/Stiff)
                </span>
                <span className="text-primary font-black text-sm">{soreness} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSoreness(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      soreness === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood & Motivation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Smile className="w-4 h-4 text-primary" />
                  Motivation / Mood (1 = Sluggish, 5 = Hyped &amp; Ready)
                </span>
                <span className="text-primary font-black text-sm">{mood} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMood(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      mood === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Personal Reflection / Notes</label>
              <Textarea
                placeholder="e.g. Right shoulder felt slightly tight on flat presses; had late wedding dinners on Friday."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[75px]"
              />
            </div>
          </CardContent>
          <div className="p-4 pt-0 flex justify-end">
            <Button type="submit" className="font-bold text-xs h-10 px-5">
              Submit Check-in
            </Button>
          </div>
        </form>
      </Card>

      {/* Past Check-ins History */}
      {checkins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Past Check-in Records</h2>
          <div className="space-y-2">
            {checkins.map((chk) => (
              <Card key={chk.id} className="border-border">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="font-bold text-foreground">{chk.date}</div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">Energy: {chk.energy}/5</span>
                    <span className="bg-muted px-2 py-0.5 rounded">Sleep: {chk.sleep_quality}/5</span>
                    <span className="bg-muted px-2 py-0.5 rounded">Soreness: {chk.soreness}/5</span>
                    <span className="bg-muted px-2 py-0.5 rounded">Mood: {chk.mood}/5</span>
                  </div>
                  {chk.notes && <div className="text-[11px] text-muted-foreground italic sm:max-w-xs truncate">{chk.notes}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
