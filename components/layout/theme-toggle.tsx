"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "../theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className="inline-flex items-center rounded-xl bg-muted p-1 border border-border"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Light theme"
        className={cn(
          "min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors",
          theme === "light"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        aria-label="System theme"
        className={cn(
          "min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors",
          theme === "system"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Laptop className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
        className={cn(
          "min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors",
          theme === "dark"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
