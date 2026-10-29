"use client";

import * as React from "react";
import { AlertTriangle, Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface InjuryArea {
  id: string;
  name: string;
  description: string;
  recommendation: string;
}

const INJURY_AREAS: InjuryArea[] = [
  {
    id: "shoulders",
    name: "Shoulder / Rotator Cuff",
    description: "Anterior delt strain or shoulder pinch during pressing",
    recommendation: "Swaps wide bench press for Neutral-Grip DB Press and Floor Press (limits shoulder extension).",
  },
  {
    id: "lower_back",
    name: "Lower Back / Lumbar",
    description: "Lower back tightness during standing rows or squats",
    recommendation: "Swaps standing rows for Chest-Supported Incline/Flat Bench Rows (zero lumbar shear).",
  },
  {
    id: "knees",
    name: "Knee / Patellar Tendon",
    description: "Knee discomfort during deep quad-dominant squats",
    recommendation: "Swaps deep goblet squats for Sumo Squats & Glute Bridges (shifts load to posterior chain).",
  },
  {
    id: "wrists",
    name: "Wrist / Forearm",
    description: "Wrist extension strain from heavy pronation or supination",
    recommendation: "Swaps standard curls for Hammer Curls (neutral wrists protect carpals).",
  },
];

interface InjuryModalProps {
  activeInjuries: string[];
  onToggleInjury: (areaId: string) => void;
  onClose: () => void;
}

export function InjuryModal({ activeInjuries, onToggleInjury, onClose }: InjuryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Injury and soreness modifications"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <Card className="w-full max-w-lg border-border shadow-2xl bg-card max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Joint Soreness &amp; Injury Swaps</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Mark sore areas to automatically substitute safe dumbbell alternatives
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
          {INJURY_AREAS.map((area) => {
            const isActive = activeInjuries.includes(area.id);
            return (
              <div
                key={area.id}
                onClick={() => onToggleInjury(area.id)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  isActive
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border/70 hover:border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>{area.name}</span>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black">
                        Active Swap
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isActive ? "bg-amber-500 border-amber-500 text-white" : "border-border"
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                <p className="text-xs text-primary font-medium mt-1.5">{area.recommendation}</p>
              </div>
            );
          })}
        </CardContent>

        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end">
          <Button onClick={onClose} className="min-h-[44px] px-6 font-bold">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
