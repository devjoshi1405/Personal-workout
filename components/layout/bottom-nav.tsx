"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Today",
    href: "/today",
    icon: CalendarDays,
  },
  {
    name: "Workout",
    href: "/workout",
    icon: Dumbbell,
  },
  {
    name: "Food",
    href: "/food",
    icon: UtensilsCrossed,
  },
  {
    name: "Progress",
    href: "/progress",
    icon: TrendingUp,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1 safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/today" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-xs font-medium transition-all select-none",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
