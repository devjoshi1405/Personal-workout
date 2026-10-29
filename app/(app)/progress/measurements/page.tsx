"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Ruler, Plus, Calendar, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchMeasurements, logMeasurement } from "@/lib/db/progress-store";
import { Measurement } from "@/lib/db/types";

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    loadData();
  }, []);

  const loadData = async () => {
    const list = await fetchMeasurements();
    setMeasurements(list);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await logMeasurement({
      date,
      waist_cm: waist ? parseFloat(waist) : null,
      chest_cm: chest ? parseFloat(chest) : null,
      arm_cm: arm ? parseFloat(arm) : null,
      thigh_cm: thigh ? parseFloat(thigh) : null,
    });

    setIsModalOpen(false);
    setWaist("");
    setChest("");
    setArm("");
    setThigh("");
    setFeedback("Measurement saved successfully!");
    setTimeout(() => setFeedback(null), 3000);
    await loadData();
  };

  const latest = measurements.length > 0 ? measurements[0] : null;
  const baseline = measurements.length > 1 ? measurements[measurements.length - 1] : latest;

  const getDelta = (curr?: number | null, base?: number | null) => {
    if (!curr || !base || curr === base) return null;
    const diff = Math.round((curr - base) * 10) / 10;
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/progress">
            <Button variant="ghost" size="icon" aria-label="Back to progress">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Body Measurements
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bi-weekly circumference tracking for true fat loss &amp; muscle growth
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="font-bold flex items-center gap-1.5 h-10 px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Log Entry</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Measurement Landmarks Info */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            <span>Standard Measurement Landmarks</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Measure first thing in the morning relaxed (do not suck stomach in):
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="font-bold text-foreground block">Waist</span>
            <span className="text-muted-foreground text-[11px]">Level with belly button / narrowest point</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="font-bold text-foreground block">Chest</span>
            <span className="text-muted-foreground text-[11px]">Across nipple line, arms at sides</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="font-bold text-foreground block">Arms</span>
            <span className="text-muted-foreground text-[11px]">Flexed bicep at peak circumference</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="font-bold text-foreground block">Thighs</span>
            <span className="text-muted-foreground text-[11px]">Midway between hip joint and kneecap</span>
          </div>
        </CardContent>
      </Card>

      {/* Latest Metrics vs Baseline */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Waist</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {latest.waist_cm ? `${latest.waist_cm} cm` : "—"}
            </div>
            {getDelta(latest.waist_cm, baseline?.waist_cm) && (
              <span className="text-[11px] font-bold text-green-600 block">
                {getDelta(latest.waist_cm, baseline?.waist_cm)} cm from start
              </span>
            )}
          </Card>

          <Card className="border-border p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Chest</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {latest.chest_cm ? `${latest.chest_cm} cm` : "—"}
            </div>
            {getDelta(latest.chest_cm, baseline?.chest_cm) && (
              <span className="text-[11px] font-bold text-primary block">
                {getDelta(latest.chest_cm, baseline?.chest_cm)} cm from start
              </span>
            )}
          </Card>

          <Card className="border-border p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Arms</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {latest.arm_cm ? `${latest.arm_cm} cm` : "—"}
            </div>
            {getDelta(latest.arm_cm, baseline?.arm_cm) && (
              <span className="text-[11px] font-bold text-primary block">
                {getDelta(latest.arm_cm, baseline?.arm_cm)} cm from start
              </span>
            )}
          </Card>

          <Card className="border-border p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Thighs</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {latest.thigh_cm ? `${latest.thigh_cm} cm` : "—"}
            </div>
            {getDelta(latest.thigh_cm, baseline?.thigh_cm) && (
              <span className="text-[11px] font-bold text-primary block">
                {getDelta(latest.thigh_cm, baseline?.thigh_cm)} cm from start
              </span>
            )}
          </Card>
        </div>
      )}

      {/* History Log */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground">Logged Measurement History</h2>
        {measurements.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
            No measurements recorded yet. Take a soft measuring tape and log your baseline!
          </div>
        ) : (
          <div className="space-y-2">
            {measurements.map((m) => (
              <Card key={m.id} className="border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{m.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {m.waist_cm && (
                      <span className="bg-muted px-2.5 py-1 rounded-lg">
                        Waist: <strong className="text-foreground">{m.waist_cm} cm</strong>
                      </span>
                    )}
                    {m.chest_cm && (
                      <span className="bg-muted px-2.5 py-1 rounded-lg">
                        Chest: <strong className="text-foreground">{m.chest_cm} cm</strong>
                      </span>
                    )}
                    {m.arm_cm && (
                      <span className="bg-muted px-2.5 py-1 rounded-lg">
                        Arm: <strong className="text-foreground">{m.arm_cm} cm</strong>
                      </span>
                    )}
                    {m.thigh_cm && (
                      <span className="bg-muted px-2.5 py-1 rounded-lg">
                        Thigh: <strong className="text-foreground">{m.thigh_cm} cm</strong>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                <span>Log Circumference</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Enter values in centimeters (cm). Leave blank if not measured today.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Waist (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 84.5"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="h-10 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Chest (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 98.0"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="h-10 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Arms (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 34.5"
                      value={arm}
                      onChange={(e) => setArm(e.target.value)}
                      className="h-10 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Thighs (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 57.0"
                      value={thigh}
                      onChange={(e) => setThigh(e.target.value)}
                      className="h-10 text-xs tabular-nums"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs font-bold px-4">
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
