"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Camera,
  Ruler,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Scale,
  ArrowRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  fetchWeightHistory,
  logWeightEntry,
  computeWeightChartSeries,
  evaluateUserCalorieCoach,
  recordCalorieAdjustment,
  fetchCalorieAdjustments,
} from "@/lib/db/progress-store";
import { WeightEntry, CalorieAdjustment } from "@/lib/db/types";
import { CalorieAdjustmentProposal } from "@/lib/calc/adjust";

export default function ProgressPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [range, setRange] = useState<"30D" | "90D" | "ALL">("30D");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [inputWeight, setInputWeight] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [coachProposal, setCoachProposal] = useState<CalorieAdjustmentProposal | null>(null);
  const [recentAdjustment, setRecentAdjustment] = useState<CalorieAdjustment | null>(null);
  const [baseCalories, setBaseCalories] = useState(2150);
  const [targetWeight, setTargetWeight] = useState(70.0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize dates safely in useEffect for Next.js 16 SSR
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInputDate(today);

    // Load initial profile data from storage if available
    try {
      const savedProfile = localStorage.getItem("bench_and_dal_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.target_weight_kg) setTargetWeight(p.target_weight_kg);
        if (p.daily_calories) setBaseCalories(p.daily_calories);
      }
    } catch {}

    loadData();
  }, []);

  const loadData = async () => {
    const history = await fetchWeightHistory();
    setWeights(history);

    const adjustments = await fetchCalorieAdjustments();
    const latestAdj = adjustments.length > 0 ? adjustments[0] : null;
    setRecentAdjustment(latestAdj);

    // Evaluate calorie coach
    const proposal = evaluateUserCalorieCoach(history, "lose", 0.5, latestAdj);
    setCoachProposal(proposal);
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputWeight);
    if (!val || val < 35 || val > 250) {
      alert("Please enter a valid weight between 35 kg and 250 kg.");
      return;
    }

    await logWeightEntry(val, inputDate);
    setInputWeight("");
    setIsLogOpen(false);
    setStatusMessage("Weight logged successfully!");
    setTimeout(() => setStatusMessage(null), 3000);
    await loadData();
  };

  const handleAcceptAdjustment = async () => {
    if (!coachProposal || coachProposal.proposedDeltaKcal === 0) return;

    await recordCalorieAdjustment(coachProposal.proposedDeltaKcal, coachProposal.reason);
    setBaseCalories((prev) => prev + coachProposal.proposedDeltaKcal);
    setStatusMessage(`Calorie target adjusted by ${coachProposal.proposedDeltaKcal > 0 ? "+" : ""}${coachProposal.proposedDeltaKcal} kcal!`);
    setTimeout(() => setStatusMessage(null), 4000);
    await loadData();
  };

  // Filter series by selected range
  const chartSeries = computeWeightChartSeries(weights, targetWeight);
  const filteredSeries = chartSeries.filter((pt) => {
    if (range === "ALL") return true;
    const daysLimit = range === "30D" ? 30 : 90;
    const now = new Date();
    const ptDate = new Date(pt.date);
    const diff = (now.getTime() - ptDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= daysLimit;
  });

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight_kg : 75.2;
  const startWeight = weights.length > 0 ? weights[0].weight_kg : 76.5;
  const netChange = Math.round((latestWeight - startWeight) * 10) / 10;
  const latestAvg = chartSeries.length > 0 ? chartSeries[chartSeries.length - 1].rollingAvg : latestWeight;
  const toGoal = Math.round((latestWeight - targetWeight) * 10) / 10;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            <span>Progress &amp; Calorie Coach</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            7-day rolling weight smoothing, automated adjustments &amp; body metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsLogOpen(true)}
            size="sm"
            className="font-bold flex items-center gap-1.5 h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Log Weight</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link href="/progress/measurements" className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-xs h-10 gap-2 border-border">
            <Ruler className="w-4 h-4 text-primary" />
            <span>Tape Metrics</span>
          </Button>
        </Link>
        <Link href="/progress/photos" className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-xs h-10 gap-2 border-border">
            <Camera className="w-4 h-4 text-primary" />
            <span>Photo Vault</span>
          </Button>
        </Link>
        <Link href="/progress/badges" className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-xs h-10 gap-2 border-border">
            <Award className="w-4 h-4 text-gold" />
            <span>Milestones</span>
          </Button>
        </Link>
        <Link href="/summary/weekly" className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-xs h-10 gap-2 border-border">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Weekly Review</span>
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Current Weight</span>
          <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {latestWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
        </Card>
        <Card className="border-border p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">7-Day Trailing Avg</span>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums">
            {latestAvg || latestWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
        </Card>
        <Card className="border-border p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Net Change</span>
          <div className={`text-xl sm:text-2xl font-black tabular-nums ${netChange <= 0 ? "text-green-600" : "text-amber-500"}`}>
            {netChange > 0 ? `+${netChange}` : netChange} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
        </Card>
        <Card className="border-border p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Distance to Goal</span>
          <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {toGoal > 0 ? `${toGoal} kg to go` : "Target Achieved!"}
          </div>
        </Card>
      </div>

      {/* Calorie Coach Active Banner */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-bold uppercase tracking-wider">
              Calorie Coach Status
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              Target: <strong className="text-foreground">{baseCalories} kcal</strong> / day
            </span>
          </div>

          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 pt-1">
            <Sparkles className="w-5 h-5 text-gold shrink-0" />
            <span>
              {coachProposal?.shouldAdjust
                ? `Proposal: Adjust target by ${coachProposal.proposedDeltaKcal > 0 ? "+" : ""}${coachProposal.proposedDeltaKcal} kcal/day`
                : coachProposal?.isPlateauWarning
                ? "Plateau Detected: Holding Calorie Baseline Steady"
                : coachProposal?.cooldownActive
                ? "10-Day Adjustment Cooldown Active"
                : "Pace on Track • Holding Steady"}
            </span>
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            {coachProposal?.reason ||
              "The Calorie Coach compares your 7-day trailing average weight with your planned rate. Adjustments are restricted to a 10-day cooldown and clamped to +/-500 kcal."}
          </CardDescription>
        </CardHeader>

        {coachProposal?.shouldAdjust && (
          <CardContent className="pt-0 pb-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleAcceptAdjustment}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-4"
            >
              Accept ({baseCalories} → {baseCalories + coachProposal.proposedDeltaKcal} kcal)
            </Button>
            <Button
              onClick={() => setCoachProposal(null)}
              variant="outline"
              size="sm"
              className="text-xs font-semibold h-9"
            >
              Dismiss for Now
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Weight History Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Weight History</CardTitle>
              <CardDescription className="text-xs">
                Raw weigh-ins (light blue) vs 7-day rolling average (deep blue) &amp; target line
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 self-start sm:self-auto">
              {(["30D", "90D", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    range === r
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 sm:h-72 w-full">
            {filteredSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as (typeof filteredSeries)[0];
                        return (
                          <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <div className="font-bold text-foreground">{data.date}</div>
                            <div className="text-sky-400 font-semibold">
                              Weigh-in: <span className="tabular-nums">{data.weight} kg</span>
                            </div>
                            {data.rollingAvg && (
                              <div className="text-primary font-bold">
                                7-Day Avg: <span className="tabular-nums">{data.rollingAvg} kg</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: `Goal (${targetWeight}kg)`, fill: "#10b981", fontSize: 10 }}
                  />
                  {/* Raw weight line */}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: "#38bdf8" }}
                    activeDot={{ r: 5 }}
                    name="Daily Weigh-In"
                  />
                  {/* Rolling 7-day average line */}
                  <Line
                    type="monotone"
                    dataKey="rollingAvg"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={false}
                    name="7-Day Rolling Avg"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No weigh-in data for the selected range. Tap "Log Weight" above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Weight Dialog Modal */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <span>Log Morning Weigh-in</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Weigh yourself after waking up and using the washroom, before eating or drinking water.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveWeight}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Date</label>
                  <Input
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    required
                    className="h-11 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Body Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 74.8"
                    value={inputWeight}
                    onChange={(e) => setInputWeight(e.target.value)}
                    required
                    autoFocus
                    className="h-11 text-base font-bold tabular-nums"
                  />
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsLogOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs font-bold px-4">
                  Save Weigh-in
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
