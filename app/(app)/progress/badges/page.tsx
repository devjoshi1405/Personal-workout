"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Sparkles, CheckCircle2, Lock, Flame, Dumbbell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALL_BADGE_DEFINITIONS, BadgeDefinition } from "@/lib/calc/badges";
import { fetchEarnedBadges } from "@/lib/db/progress-store";

export default function BadgesPage() {
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const keys = await fetchEarnedBadges();
    setEarnedKeys(keys);
  };

  const filteredBadges = ALL_BADGE_DEFINITIONS.filter((b) => {
    if (filter === "all") return true;
    if (filter === "earned") return earnedKeys.includes(b.key);
    if (filter === "locked") return !earnedKeys.includes(b.key);
    return b.category === filter;
  });

  const totalBadges = ALL_BADGE_DEFINITIONS.length;
  const earnedCount = ALL_BADGE_DEFINITIONS.filter((b) => earnedKeys.includes(b.key)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/progress">
            <Button variant="ghost" size="icon" aria-label="Back to progress">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Milestone Badges</span>
              <Sparkles className="w-6 h-6 text-gold animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Discipline and progressive overload achievements ({earnedCount}/{totalBadges} unlocked)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar Header */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">Discipline Level: {earnedCount >= 7 ? "Elite Master" : earnedCount >= 4 ? "Dedicated Lifter" : "Rising Contender"}</span>
            <span className="text-gold tabular-nums">{earnedCount} of {totalBadges} Badges</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 rounded-full"
              style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border">
        {[
          { key: "all", label: "All" },
          { key: "earned", label: "Earned" },
          { key: "locked", label: "Locked" },
          { key: "workout", label: "Workout" },
          { key: "nutrition", label: "Nutrition" },
          { key: "streak", label: "Streaks" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              filter === t.key
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredBadges.map((badge) => {
          const isEarned = earnedKeys.includes(badge.key);

          return (
            <Card
              key={badge.key}
              className={`border transition-all ${
                isEarned
                  ? "border-gold/40 bg-gold/5 shadow-sm"
                  : "border-border/60 bg-card/60 opacity-70"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isEarned
                      ? "bg-gold text-slate-950 font-black shadow-gold/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isEarned ? (
                    <Award className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      {badge.name}
                    </span>
                    {isEarned ? (
                      <Badge className="bg-gold text-slate-950 hover:bg-gold border-none text-[10px] font-black uppercase tracking-wider">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground capitalize">
                    <span>Category: {badge.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
