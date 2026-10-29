import Link from "next/link";
import {
  Dumbbell,
  Salad,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="px-5 py-4 border-b border-border flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
            <Dumbbell className="w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tight flex items-center gap-1.5">
            <span>Bench & Dal</span>
            <span className="w-2 h-2 rounded-full bg-gold" />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-bold">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="font-bold">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-5 py-12 md:py-20 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flat Bench & Dumbbells Only • 100% Indian Veg/Egg</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
          Your personal coach for <br className="hidden sm:inline" />
          <span className="text-primary">dumbbell overload</span> &amp;{" "}
          <span className="text-gold">vegetarian fuel</span>.
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Not just a passive log. Bench &amp; Dal tells you exactly what weight to
          lift next set, auto-adjusts calories when your weight changes, and
          helps Indian vegetarians hit 2.0g/kg protein without meat.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto min-h-[52px] text-base font-black px-8 flex items-center justify-center gap-2">
              <span>Start Free Journey</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/today" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[52px] text-base font-bold px-8">
              Open Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full pt-12 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Progressive Overload</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every set calculates your next target based on dumbbell jump steps. If you max the rep range, it bumps your weight.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gold-subtle text-gold-foreground flex items-center justify-center">
              <Salad className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-lg font-bold">Indian Veg &amp; Egg Foods</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Paneer, soya chunks, dal, rajma, sprouts, sattu, and whey. Zero chicken or meat anywhere in the database.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Smart Calorie Coach</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compares 7-day rolling weight averages against your goal and safely adapts your calorie targets.
            </p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-muted/60 text-xs text-muted-foreground max-w-2xl mx-auto flex items-center justify-center gap-2 border border-border">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            Strict privacy: Your logs and progress photos remain strictly private. Not medical advice.
          </span>
        </div>
      </main>
    </div>
  );
}
