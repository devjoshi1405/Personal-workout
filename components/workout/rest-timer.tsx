"use client";

import * as React from "react";
import { Timer, Plus, SkipForward, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  onDismiss: () => void;
}

export function RestTimer({ initialSeconds, onComplete, onDismiss }: RestTimerProps) {
  // Timestamp-accurate end time (initialized in useEffect to prevent SSR prerender mismatch)
  const [targetEndTime, setTargetEndTime] = React.useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(initialSeconds);
  const [isFinished, setIsFinished] = React.useState(false);

  React.useEffect(() => {
    setTargetEndTime(Date.now() + initialSeconds * 1000);
  }, [initialSeconds]);

  React.useEffect(() => {
    if (targetEndTime === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetEndTime - now;
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setIsFinished(true);

        // Haptic vibration at zero if supported by device browser
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([250, 100, 250]);
          } catch {
            // vibration blocked or unsupported
          }
        }

        // Web Audio gentle double beep
        try {
          const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }
        } catch {
          // Audio blocked
        }

        if (onComplete) onComplete();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [targetEndTime, onComplete]);

  const addTime = (seconds: number) => {
    setTargetEndTime((prev) => prev + seconds * 1000);
    setIsFinished(false);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      role="region"
      aria-label="Rest Timer"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-card/95 backdrop-blur-md border-2 border-primary shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 text-foreground">
        {/* Timer display */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-colors ${
            isFinished ? "bg-emerald-500 text-white animate-pulse" : "bg-primary text-primary-foreground"
          }`}>
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isFinished ? "Rest Complete!" : "Rest Period"}
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-foreground">
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTime(15)}
            className="min-h-[44px] min-w-[44px] px-2.5 font-bold text-xs rounded-xl flex items-center gap-1"
            aria-label="Add 15 seconds"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>15s</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDismiss}
            className="min-h-[44px] min-w-[44px] px-3 font-bold text-xs rounded-xl flex items-center gap-1"
            aria-label="Skip rest timer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </Button>

          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-xl"
            aria-label="Close timer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
