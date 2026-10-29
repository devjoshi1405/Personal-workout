"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Shield,
  Download,
  Upload,
  Trash2,
  Moon,
  Info,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  User,
  Dumbbell,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { loadUserProfile, saveUserProfile, FullUserData } from "@/lib/db/profile-store";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userData, setUserData] = React.useState<FullUserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<number | string>(26);
  const [heightCm, setHeightCm] = React.useState<number | string>(175);
  const [goalWeightKg, setGoalWeightKg] = React.useState<number | string>(72);
  const [targetDate, setTargetDate] = React.useState("");
  const [diet, setDiet] = React.useState<"veg" | "egg">("veg");
  const [dumbbellStep, setDumbbellStep] = React.useState(2.0);
  const [activityFactor, setActivityFactor] = React.useState("1.375");

  // Load existing profile
  React.useEffect(() => {
    loadUserProfile().then((res) => {
      setUserData(res);
      if (res.profile) {
        setName(res.profile.name || "");
        setAge(res.profile.age ?? 26);
        setHeightCm(res.profile.height_cm ?? 175);
        setGoalWeightKg(res.profile.goal_weight_kg ?? 72);
        setTargetDate(res.profile.target_date || "");
        setDiet(res.profile.diet || "veg");
        setDumbbellStep(res.profile.dumbbell_step_kg ?? 2.0);
        setActivityFactor(res.profile.activity_factor ? res.profile.activity_factor.toString() : "1.375");
      }
      setLoading(false);
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const parsedGoalWeight = parseFloat(String(goalWeightKg)) || 72;
      const parsedAge = parseInt(String(age), 10) || 26;
      const parsedHeight = parseInt(String(heightCm), 10) || 175;

      const currentWeight = userData?.weightEntries?.length
        ? userData.weightEntries[userData.weightEntries.length - 1].weight_kg
        : parsedGoalWeight + 5;

      await saveUserProfile(
        {
          user_id: userData?.profile?.user_id || "demo-user",
          name,
          sex: userData?.profile?.sex || "male",
          age: parsedAge,
          height_cm: parsedHeight,
          activity_factor: Number(activityFactor) || 1.375,
          diet,
          goal_weight_kg: parsedGoalWeight,
          target_date: targetDate,
          dumbbell_step_kg: Number(dumbbellStep) || 2.0,
          start_date: userData?.profile?.start_date || new Date().toISOString().split("T")[0],
          calorie_adjustment: userData?.profile?.calorie_adjustment || 0,
          theme: "system",
          timezone: "Asia/Kolkata",
        },
        currentWeight
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const exportData = {
      app: "Bench & Dal",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      userData,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bench-and-dal-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV of weights
  const handleExportCSV = () => {
    if (!userData?.weightEntries || userData.weightEntries.length === 0) {
      alert("No weight records to export.");
      return;
    }
    const headers = ["date", "weight_kg"];
    const rows = userData.weightEntries.map((w) => `${w.date},${w.weight_kg}`);
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bench-and-dal-weights-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.userData?.profile) {
          localStorage.setItem("bench_and_dal_user_profile", JSON.stringify(parsed.userData.profile));
          if (parsed.userData.weightEntries) {
            localStorage.setItem("bench_and_dal_weight_entries", JSON.stringify(parsed.userData.weightEntries));
          }
          alert("Backup imported successfully! Refreshing...");
          window.location.reload();
        } else {
          alert("Invalid backup file format.");
        }
      } catch {
        alert("Failed to parse backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? All workout history and progress photos will be permanently deleted."
    );
    if (!confirmDelete) return;

    try {
      localStorage.clear();
      await supabase.auth.signOut();
      router.push("/signup");
      router.refresh();
    } catch (err) {
      console.error("Account delete error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Settings &amp; Preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your targets, dumbbell increments, dietary flags, and data backups
        </p>
      </div>

      {/* Appearance & Theme */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            <span>Theme &amp; Display</span>
          </CardTitle>
          <CardDescription>
            Choose Light mode, Dark mode, or follow your operating system
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm font-semibold">Active Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Profile & Fitness Goals Form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Profile &amp; Fitness Targets</span>
          </CardTitle>
          <CardDescription>
            Adjusting targets recalculates BMR, macros, and progressive overload jumps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {saveSuccess && (
              <div className="p-3 text-sm rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile and calorie targets updated successfully!</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="settings-name" className="text-xs font-bold uppercase tracking-wide">
                Your Name
              </label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="settings-age" className="text-xs font-bold uppercase tracking-wide">
                  Age (years)
                </label>
                <Input
                  id="settings-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="min-h-[44px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-height" className="text-xs font-bold uppercase tracking-wide">
                  Height (cm)
                </label>
                <Input
                  id="settings-height"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="settings-goal-weight" className="text-xs font-bold uppercase tracking-wide">
                  Target Weight (kg)
                </label>
                <Input
                  id="settings-goal-weight"
                  type="number"
                  step="0.1"
                  value={goalWeightKg}
                  onChange={(e) => setGoalWeightKg(e.target.value)}
                  className="min-h-[44px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-target-date" className="text-xs font-bold uppercase tracking-wide">
                  Target Date
                </label>
                <Input
                  id="settings-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Diet & Dumbbell Jump Step */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide">
                  Diet Type
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as "veg" | "egg")}
                  className="w-full min-h-[44px] rounded-xl border border-input bg-card px-3 text-sm font-semibold"
                >
                  <option value="veg">Pure Vegetarian (No eggs)</option>
                  <option value="egg">Eggetarian (Includes eggs)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide">
                  Smallest DB Jump
                </label>
                <select
                  value={dumbbellStep}
                  onChange={(e) => setDumbbellStep(parseFloat(e.target.value))}
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
              disabled={saving}
              className="w-full min-h-[44px] font-bold flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Push Notification Reminders */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span>Habit &amp; Workout Reminders</span>
          </CardTitle>
          <CardDescription>
            Configure daily push notifications for morning weigh-in and workout time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
            <div>
              <div className="font-bold text-sm text-foreground">Web Push Notifications</div>
              <div className="text-xs text-muted-foreground">Receive reminders on your phone or desktop</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (typeof window !== "undefined" && "Notification" in window) {
                  const perm = await Notification.requestPermission();
                  if (perm === "granted") {
                    alert("Notifications enabled! You will receive daily reminders.");
                    try {
                      await fetch("/api/push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "subscribe", subscription: { endpoint: "local" } }),
                      });
                    } catch {}
                  } else {
                    alert("Notification permission denied or dismissed.");
                  }
                } else {
                  alert("Notifications are not supported in this browser.");
                }
              }}
              className="text-xs font-bold min-h-[44px]"
            >
              Enable Notifications
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
              <span className="font-bold text-foreground">Morning Weigh-in</span>
              <p className="text-muted-foreground">Every day at 7:00 AM after waking up</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
              <span className="font-bold text-foreground">Workout Session</span>
              <p className="text-muted-foreground">Training days at 6:30 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Backup */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <span>Data Export &amp; Backup</span>
          </CardTitle>
          <CardDescription>
            Export complete JSON and CSV logs, or restore your backup anytime
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportJSON}
              className="min-h-[44px] font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export All (JSON)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="min-h-[44px] font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Weights (CSV)</span>
            </Button>
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1">
              Import JSON Backup
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:text-xs file:font-bold file:bg-muted hover:file:bg-card cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <div className="p-4 rounded-2xl bg-muted/60 border border-border flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">Disclaimer:</strong> Bench &amp; Dal is an educational fitness and progressive overload tracker. It is not medical advice. Never drop calories below your calculated BMR. Consult a qualified physician before starting any intense training program.
        </p>
      </div>

      {/* Account Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="w-full sm:w-auto font-bold flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleDeleteAccount}
          className="w-full sm:w-auto text-destructive hover:bg-destructive/10 text-xs font-bold flex items-center gap-2 min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account &amp; All Data</span>
        </Button>
      </div>
    </div>
  );
}
