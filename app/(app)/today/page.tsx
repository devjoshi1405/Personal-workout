"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dumbbell,
  Flame,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Droplet,
  Plus,
  Minus,
  Sparkles,
  Scale,
  Moon,
  Clock,
  ChevronRight,
  Coffee,
  Heart,
  Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadUserProfile, updateWaterGlasses, FullUserData } from "@/lib/db/profile-store";
import { logWeightEntry } from "@/lib/db/progress-store";

const DAILY_TIPS = [
  "Strength improves in 2-4 weeks through motor unit recruitment. Visible muscle shape changes take 6-8 weeks of consistent progressive overload.",
  "Low-fat paneer and boiled soya chunks provide complete amino acids with high leucine content to trigger muscle protein synthesis without meat.",
  "Weigh yourself once a day in the morning after using the washroom and before drinking water. Rolling weekly averages filter out water fluctuations.",
  "Dumbbell jump steps: When you hit the top rep range on all sets, bump the weight. If you don't have the next dumbbell, slow the tempo to 3 seconds down.",
  "Creatine monohydrate (3-5g daily) supports cellular ATP in explosive lifts. It is naturally lower in vegetarian diets, making consistency especially effective.",
];

export default function TodayPage() {
  const [data, setData] = React.useState<FullUserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [waterCount, setWaterCount] = React.useState(0);
  const [weighInInput, setWeighInInput] = React.useState("");
  const [weighInSaved, setWeighInSaved] = React.useState(false);
  const [sleepHours, setSleepHours] = React.useState(7.5);
  const [currentDateStr, setCurrentDateStr] = React.useState("");
  const [dayOfWeek, setDayOfWeek] = React.useState(1); // default to Mon

  // Determine 7-day plan split for today
  const todayWorkout = React.useMemo(() => {
    switch (dayOfWeek) {
      case 1:
        return { key: "mon", name: "Monday — Chest + Triceps", exercises: 5, isRest: false, desc: "Dumbbell bench press, floor press, chest fly, overhead triceps & kickbacks" };
      case 2:
        return { key: "tue", name: "Tuesday — Back + Biceps", exercises: 5, isRest: false, desc: "One-arm dumbbell rows, chest-supported rows, reverse fly, curls & hammer curls" };
      case 3:
        return { key: "wed", name: "Wednesday — Cardio + Core", exercises: 4, isRest: false, desc: "Comfortable walking (15–25m), dead bugs, standing knee raises & gentle mobility" };
      case 4:
        return { key: "thu", name: "Thursday — Legs + Glutes", exercises: 5, isRest: false, desc: "Sit-to-stand from bench, dumbbell RDLs, glute bridges, calf raises & goblet squats" };
      case 5:
        return { key: "fri", name: "Friday — Shoulders + Abs", exercises: 5, isRest: false, desc: "Seated shoulder press, lateral raises, rear-delt fly, dumbbell shrugs & dead bugs" };
      case 6:
        return { key: "sat", name: "Saturday — Light Full Body + Cardio", exercises: 5, isRest: false, desc: "Sit-to-stand, wall push-ups, light rows, glute bridges & comfortable walk" };
      case 0:
      default:
        return { key: "sun", name: "Sunday — Rest and Recovery", exercises: 0, isRest: true, desc: "Restoration day: deep sleep, hydration, vegetarian nutrition & weekly debrief" };
    }
  }, [dayOfWeek]);

  // Load user data on mount
  React.useEffect(() => {
    const now = new Date();
    setDayOfWeek(now.getDay());
    setCurrentDateStr(
      now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    );

    loadUserProfile().then((res) => {
      setData(res);
      const todayStr = now.toISOString().split("T")[0];
      const savedWater = localStorage.getItem(`water_${todayStr}`);
      if (savedWater) {
        setWaterCount(parseInt(savedWater, 10));
      } else if (res.todayHabits?.water_glasses) {
        setWaterCount(res.todayHabits.water_glasses);
      }
      setLoading(false);
    });
  }, []);

  const handleWaterDelta = async (delta: number) => {
    const updated = await updateWaterGlasses(delta);
    setWaterCount(updated);
  };

  const handleQuickWeighIn = async () => {
    const val = parseFloat(weighInInput);
    if (!isNaN(val) && val >= 30 && val <= 250) {
      await logWeightEntry(val);
      const updated = await loadUserProfile();
      setData(updated);
      setWeighInSaved(true);
    }
  };

  const profile = data?.profile;
  const plan = data?.plan;

  // Weight progress calculations
  const startWeight = profile?.goal_weight_kg ? profile.goal_weight_kg + 6 : 80;
  const currentWeight = data?.weightEntries?.length
    ? data.weightEntries[data.weightEntries.length - 1].weight_kg
    : 78;
  const targetWeight = profile?.goal_weight_kg || 72;

  const totalDeltaNeeded = Math.abs(startWeight - targetWeight) || 1;
  const totalDeltaAchieved = Math.abs(startWeight - currentWeight);
  const progressPercent = Math.min(100, Math.max(0, Math.round((totalDeltaAchieved / totalDeltaNeeded) * 100)));

  // Plate fill visualizer calculations (5 plates on a barbell)
  const plateThresholds = [20, 40, 60, 80, 100];

  const dailyTip = DAILY_TIPS[dayOfWeek % DAILY_TIPS.length];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Namaste, {profile?.name || "Athlete"}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentDateStr || "Today"} • {todayWorkout.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gold" className="text-xs px-3 py-1 font-bold">
            <Flame className="w-3.5 h-3.5 mr-1 fill-gold text-gold" />
            <span>3-Day Streak</span>
          </Badge>
          <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
            Week 2 of 12
          </Badge>
        </div>
      </div>

      {/* Hero Weight Goal Barbell Plate Visualizer */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-primary" />
              <span>Weight Goal Progress ({progressPercent}%)</span>
            </span>
            <span className="text-xs font-bold text-primary flex items-center gap-1 tabular-nums">
              {plan?.goal === "lose" ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>Goal: {targetWeight.toFixed(1)} kg</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <CardTitle className="text-3xl sm:text-4xl font-black tabular-nums">
              {currentWeight.toFixed(1)}
            </CardTitle>
            <span className="text-sm font-semibold text-muted-foreground">kg current weight</span>
          </div>
          <CardDescription>
            Started at {startWeight.toFixed(1)} kg • {totalDeltaAchieved.toFixed(1)} kg {plan?.goal === "lose" ? "lost" : "gained"} • {(Math.abs(currentWeight - targetWeight)).toFixed(1)} kg to goal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barbell Plates Progress Visualizer */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Barbell Loading Progress</span>
              <span className="tabular-nums font-semibold text-foreground">{progressPercent}% Loaded</span>
            </div>
            {/* Plates Graphic */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
              {plateThresholds.map((threshold, idx) => {
                const isLoaded = progressPercent >= threshold;
                const plateLabels = ["20kg", "15kg", "10kg", "5kg", "2.5kg"];
                const plateHeights = ["h-14", "h-12", "h-10", "h-8", "h-7"];
                const plateWidths = ["w-6 sm:w-8", "w-5 sm:w-7", "w-5 sm:w-6", "w-4 sm:w-5", "w-4 sm:w-5"];

                return (
                  <div key={threshold} className="flex flex-col items-center gap-1">
                    <div
                      className={`rounded-lg border-2 flex items-center justify-center transition-all duration-300 font-bold text-[9px] tabular-nums select-none ${plateHeights[idx]} ${plateWidths[idx]} ${
                        isLoaded
                          ? "bg-primary border-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-card border-border/80 text-muted-foreground/60"
                      }`}
                    >
                      <span className="rotate-90 sm:rotate-0">{plateLabels[idx]}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{threshold}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Workout Hero Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant={todayWorkout.isRest ? "secondary" : "default"} className="text-xs font-bold uppercase">
              {todayWorkout.isRest ? "Rest & Recovery" : "Today's Scheduled Session"}
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{todayWorkout.isRest ? "10 mins" : "~50 mins"}</span>
            </span>
          </div>
          <CardTitle className="text-xl font-bold flex items-center gap-2 pt-1 text-foreground">
            {todayWorkout.isRest ? <Heart className="w-5 h-5 text-rose-500" /> : <Dumbbell className="w-5 h-5 text-primary" />}
            <span>{todayWorkout.name}</span>
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            {todayWorkout.desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Link href={todayWorkout.isRest ? "/workout" : `/workout?template=${todayWorkout.key}`}>
            <Button className="w-full min-h-[48px] text-base font-bold flex items-center justify-center gap-2">
              <span>{todayWorkout.isRest ? "View Stretch Routine or Manual Workout" : "Start Workout"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Daily Targets: Protein (Gold highlight), Calories, Water, Walking */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Protein Target (Gold strictly for protein) */}
        <Card className="border-gold/40 bg-gold-subtle/30 shadow-none">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-gold-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Protein</span>
              <Sparkles className="w-3.5 h-3.5 text-gold" />
            </span>
            <div className="text-2xl font-black text-gold-foreground tabular-nums">
              0 <span className="text-xs font-semibold text-muted-foreground">/ {plan?.nutrition.proteinGrams || 140}g</span>
            </div>
            <div className="h-2 rounded-full bg-gold/20 overflow-hidden">
              <div className="h-full bg-gold w-0 transition-all" />
            </div>
            <p className="text-[10px] text-gold-foreground/80 font-medium pt-0.5">
              {profile?.diet === "egg" ? "Veg + Egg items" : "100% Pure Vegetarian"}
            </p>
          </CardContent>
        </Card>

        {/* Calories Target */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Calories
            </span>
            <div className="text-2xl font-black text-foreground tabular-nums">
              0 <span className="text-xs font-semibold text-muted-foreground">/ {(plan?.dailyCalories || 2150).toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary w-0" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
              Goal: {plan?.goal || "lose"} weight
            </p>
          </CardContent>
        </Card>

        {/* Water Target with +/- buttons */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-sky-500" />
              <span>Water</span>
            </span>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {waterCount} <span className="text-xs font-semibold text-muted-foreground">/ {plan?.nutrition.waterGlasses || 11} gl</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWaterDelta(-1)}
                className="h-8 w-8 p-0 min-h-[32px] min-w-[32px] rounded-lg"
                aria-label="Decrease water"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWaterDelta(1)}
                className="h-8 w-8 p-0 min-h-[32px] min-w-[32px] rounded-lg"
                aria-label="Increase water"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Walking Target */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-emerald-500" />
              <span>Walk</span>
            </span>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {plan?.walkingMinutesPerDay || 30} <span className="text-xs font-semibold text-muted-foreground">min</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium pt-2">
              Non-exercise activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Checklist */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Daily Checklist</span>
          </CardTitle>
          <CardDescription>
            Core habits for progressive overload and metabolic discipline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {/* 1. Weigh-in */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">Morning weigh-in</span>
            </div>
            {weighInSaved ? (
              <Badge variant="success" className="text-xs">Logged</Badge>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="kg"
                  value={weighInInput}
                  onChange={(e) => setWeighInInput(e.target.value)}
                  className="w-16 h-8 text-xs px-2 rounded-lg border border-input bg-card tabular-nums"
                />
                <Button size="sm" onClick={handleQuickWeighIn} className="h-8 px-2.5 text-xs font-bold">
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* 2. Workout */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{todayWorkout.name}</span>
            </div>
            <Link href="/workout">
              <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                {todayWorkout.isRest ? "Rest day" : "Scheduled"}
              </Badge>
            </Link>
          </div>

          {/* 3. Protein */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="font-semibold">Hit {plan?.nutrition.proteinGrams || 140}g Protein</span>
            </div>
            <Link href="/food">
              <Badge variant="gold" className="text-xs cursor-pointer">
                0 / {plan?.nutrition.proteinGrams || 140}g
              </Badge>
            </Link>
          </div>

          {/* 4. Sleep */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">Sleep hours</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold tabular-nums">
              <span>{sleepHours} hrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rotating Daily Coach Tip */}
      <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-foreground">Daily Coach Observation</div>
          <p className="text-muted-foreground leading-relaxed">
            {dailyTip}
          </p>
        </div>
      </div>
    </div>
  );
}
