"use client";

import * as React from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Flame,
  Calendar,
  X,
  Heart,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  loadTodayFoodLogs,
  logFoodItem,
  deleteFoodLog,
  calculateDailyMacros,
  searchFoods,
  LoggedFoodItem,
  DailyMacroTotals,
  SEEDED_INDIAN_FOODS,
  calculateFlexibleDayDistribution,
} from "@/lib/db/food-store";
import { loadUserProfile } from "@/lib/db/profile-store";
import { suggestProteinCatchUp, CatchUpSuggestion, FoodCandidate } from "@/lib/calc/catchup";
import { MealType, DietType } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FoodPage() {
  const [todayStr, setTodayStr] = React.useState("");
  const [userDiet, setUserDiet] = React.useState<DietType>("veg");
  const [targetProtein, setTargetProtein] = React.useState(140);
  const [targetCalories, setTargetCalories] = React.useState(2150);
  const [logs, setLogs] = React.useState<LoggedFoodItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Quick-Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedMeal, setSelectedMeal] = React.useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredFoods, setFilteredFoods] = React.useState<FoodCandidate[]>([]);

  // Flexible / Festival Day state
  const [isFlexibleDay, setIsFlexibleDay] = React.useState(false);
  const [surplusCalories, setSurplusCalories] = React.useState(500);

  // Load user biometrics and today's logs on mount
  React.useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);

    loadUserProfile().then((u) => {
      if (u.profile) {
        setUserDiet(u.profile.diet);
      }
      if (u.plan) {
        setTargetProtein(u.plan.nutrition.proteinGrams);
        setTargetCalories(u.plan.dailyCalories);
      }

      loadTodayFoodLogs(today).then((foodLogs) => {
        setLogs(foodLogs);
        setLoading(false);
      });
    });
  }, []);

  // Update search results
  React.useEffect(() => {
    const results = searchFoods(searchQuery, userDiet);
    setFilteredFoods(results);
  }, [searchQuery, userDiet]);

  const currentMacros: DailyMacroTotals = React.useMemo(() => {
    return calculateDailyMacros(logs);
  }, [logs]);

  const proteinGap = Math.max(0, targetProtein - currentMacros.proteinGrams);

  // Protein Catch-up suggestions
  const catchUpSuggestions: CatchUpSuggestion[] = React.useMemo(() => {
    if (proteinGap <= 2) return [];
    return suggestProteinCatchUp(SEEDED_INDIAN_FOODS, proteinGap, userDiet, 3);
  }, [proteinGap, userDiet]);

  // Handle adding food
  const handleLogFood = async (food: FoodCandidate, meal: MealType, quantity: number = 1.0) => {
    const newEntry = await logFoodItem({
      date: todayStr,
      meal,
      food,
      quantity,
    });
    setLogs((prev) => [...prev, newEntry]);
    setIsAddModalOpen(false);
    setSearchQuery("");
  };

  // Handle deleting food
  const handleDeleteFood = async (id: string) => {
    await deleteFoodLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const openAddModal = (meal: MealType) => {
    setSelectedMeal(meal);
    setIsAddModalOpen(true);
  };

  const flexibleInfo = calculateFlexibleDayDistribution({
    regularDailyCalories: targetCalories,
    flexibleDaySurplusCalories: surplusCalories,
    daysRemainingInWeek: 4,
  });

  const MEALS: { type: MealType; name: string; pct: string; calorieTarget: number; proteinTarget: number }[] = [
    { type: "breakfast", name: "Breakfast", pct: "25%", calorieTarget: Math.round(targetCalories * 0.25), proteinTarget: Math.round(targetProtein * 0.25) },
    { type: "lunch", name: "Lunch", pct: "30%", calorieTarget: Math.round(targetCalories * 0.30), proteinTarget: Math.round(targetProtein * 0.30) },
    { type: "snack", name: "Snack", pct: "15%", calorieTarget: Math.round(targetCalories * 0.15), proteinTarget: Math.round(targetProtein * 0.15) },
    { type: "dinner", name: "Dinner", pct: "30%", calorieTarget: Math.round(targetCalories * 0.30), proteinTarget: Math.round(targetProtein * 0.30) },
  ];

  const proteinPercent = Math.min(100, Math.round((currentMacros.proteinGrams / targetProtein) * 100));
  const caloriesPercent = Math.min(100, Math.round((currentMacros.calories / targetCalories) * 100));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Food &amp; Protein Tracker</span>
            <span className="w-2 h-2 rounded-full bg-gold" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {userDiet === "egg" ? "Vegetarian + Egg Indian staples" : "100% Pure Vegetarian Indian database"} • Zero meat or fish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/food/plan">
            <Button variant="outline" size="sm" className="min-h-[44px] font-semibold text-xs flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Meal Plans</span>
            </Button>
          </Link>
          <Link href="/food/grocery">
            <Button variant="outline" size="sm" className="min-h-[44px] font-semibold text-xs flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span>Grocery</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Protein Highlight Hero Card (Gold highlight strictly for protein) */}
      <Card className="border-gold/40 bg-gold-subtle/30 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Daily Protein Target ({proteinPercent}%)</span>
            </span>
            <Badge variant="gold" className="text-xs">
              {targetProtein}g Goal
            </Badge>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <CardTitle className="text-3xl sm:text-4xl font-black text-gold-foreground tabular-nums">
              {currentMacros.proteinGrams.toFixed(1)}
            </CardTitle>
            <span className="text-sm font-semibold text-muted-foreground">/ {targetProtein} g</span>
          </div>

          <CardDescription className="text-gold-foreground/90 text-xs">
            {proteinGap > 0
              ? `${proteinGap.toFixed(1)} g remaining today. Check the catch-up recommendations below.`
              : "Daily protein target completed! Hypertrophy threshold satisfied."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="h-3 w-full rounded-full bg-gold/20 overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground tabular-nums pt-1">
            <span>Consumed: {currentMacros.proteinGrams}g</span>
            <span className="font-bold text-foreground">Gap: {proteinGap.toFixed(1)}g</span>
            <span>Target: {targetProtein}g</span>
          </div>
        </CardContent>
      </Card>

      {/* Protein Catch-up Engine Card */}
      {catchUpSuggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-xs font-bold uppercase">
                Protein Catch-Up Coach
              </Badge>
              <span className="text-xs text-muted-foreground font-semibold">
                Highest Protein per Calorie
              </span>
            </div>
            <CardTitle className="text-base font-bold flex items-center gap-2 pt-1">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Close your {proteinGap.toFixed(1)}g gap with whole foods</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Tap any food to instantly add it to your evening snack or dinner:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {catchUpSuggestions.map((item) => (
              <div
                key={item.food.id}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground text-sm">{item.food.name}</div>
                  <div className="text-muted-foreground">
                    {item.servingsText} •{" "}
                    <span className="text-gold-foreground font-bold">+{item.proteinProvidedGrams}g protein</span> •{" "}
                    +{item.caloriesAdded} kcal
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLogFood(item.food, "dinner", item.suggestedQuantity)}
                  className="min-h-[40px] px-3 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Calories & Macro Distribution */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-center">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Calories</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {currentMacros.calories}
            </div>
            <span className="text-[10px] text-muted-foreground">/ {targetCalories} kcal</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-center">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Carbs</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {currentMacros.carbGrams}g
            </div>
            <span className="text-[10px] text-muted-foreground">Fuel</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-center">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Fats (25%)</span>
            <div className="text-xl font-black text-foreground tabular-nums">
              {currentMacros.fatGrams}g
            </div>
            <span className="text-[10px] text-muted-foreground">Lipids</span>
          </CardContent>
        </Card>
      </div>

      {/* Flexible / Festival Day Banner */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Festival / Flexible Meal Mode</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Eating out or celebrating a festival? Spread the surplus over the remaining days of the week.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFlexibleDay((prev) => !prev)}
            className={`min-h-[44px] px-4 rounded-xl font-bold text-xs border transition-colors ${
              isFlexibleDay
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {isFlexibleDay ? "Flexible Day Active (+500 kcal)" : "Enable Flexible Day"}
          </button>
        </CardContent>
      </Card>

      {/* Meals Breakdown (Breakfast, Lunch, Snack, Dinner) */}
      <div className="space-y-4">
        {MEALS.map((meal) => {
          const mealLogs = logs.filter((l) => l.meal === meal.type);
          const mealCalories = mealLogs.reduce((acc, curr) => acc + curr.calories, 0);
          const mealProtein = mealLogs.reduce((acc, curr) => acc + curr.protein_g, 0);

          return (
            <Card key={meal.type} className="border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/40 bg-card/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span>{meal.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {meal.pct}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs tabular-nums">
                    Logged: {mealCalories} kcal • {mealProtein.toFixed(1)}g protein
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAddModal(meal.type)}
                  className="min-h-[40px] px-3 font-bold text-xs flex items-center gap-1 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Food</span>
                </Button>
              </CardHeader>

              <CardContent className="p-4 pt-3 space-y-2">
                {mealLogs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Nothing logged for {meal.name.toLowerCase()} yet. Tap &ldquo;Add Food&rdquo; to log items.
                  </div>
                ) : (
                  mealLogs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                        <div className="text-muted-foreground tabular-nums">
                          {item.quantity}x • {item.calories} kcal •{" "}
                          <span className="font-bold text-gold-foreground">
                            {item.protein_g}g protein
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFood(item.id)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* QUICK ADD FOOD MODAL */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Food item"
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <Card className="w-full max-w-lg border-border shadow-2xl bg-card max-h-[85vh] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <span>Add to {selectedMeal.toUpperCase()}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Indian vegetarian &amp; eggetarian foods
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <div className="p-4 border-b border-border/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search paneer, soya, dal, curd, oats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px]"
                  autoFocus
                />
              </div>
            </div>

            <CardContent className="p-4 space-y-2 overflow-y-auto flex-1">
              {filteredFoods.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No foods match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleLogFood(food, selectedMeal)}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer select-none"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span>{food.name}</span>
                        {food.optional && (
                          <Badge variant="outline" className="text-[10px]">
                            Optional
                          </Badge>
                        )}
                        {food.diet === "egg" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Egg
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        Serving: {food.serving} • {food.calories} kcal •{" "}
                        <span className="font-bold text-gold-foreground">
                          {food.protein_g}g protein
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="min-h-[40px] px-3 font-bold text-xs flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log</span>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
