"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Award,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const SIDEBAR_ITEMS = [
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Workout", href: "/workout", icon: Dumbbell },
  { name: "Food & Protein", href: "/food", icon: UtensilsCrossed },
  { name: "Progress & Coach", href: "/progress", icon: TrendingUp },
  { name: "Weekly Summary", href: "/summary/weekly", icon: Award },
  { name: "Settings & Goals", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0 p-5 justify-between">
      <div className="space-y-6">
        {/* Brand */}
        <Link href="/today" className="flex items-center gap-3 px-2 py-1 select-none">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5 text-foreground">
              <span>Bench & Dal</span>
              <span className="w-2 h-2 rounded-full bg-gold" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Dumbbell + Vegetarian Coach
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/today" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all select-none min-h-[44px]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info & Theme toggle */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <span>Consistency wins. Visible progress takes 6-8 weeks of solid sets.</span>
        </div>
      </div>
    </aside>
  );
}
