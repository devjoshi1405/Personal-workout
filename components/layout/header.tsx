"use client";

import Link from "next/link";
import { Dumbbell, Flame } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
      <Link href="/today" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
          <span>Bench & Dal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gold-subtle text-gold-foreground border border-gold/30 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums">
          <Flame className="w-3.5 h-3.5 fill-gold text-gold" />
          <span>0d streak</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
