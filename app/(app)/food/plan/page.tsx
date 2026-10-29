"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Utensils, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  Clock,
  Flame,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MealOption {
  name: string;
  items: string[];
  protein: number;
  calories: number;
  prepTime: string;
  notes: string;
}

interface MealBlock {
  meal: "Breakfast" | "Lunch" | "Snack" | "Dinner";
  percentage: number;
  targetKcalApprox: number;
  targetProteinApprox: number;
  options: MealOption[];
}

const VEGETARIAN_MEAL_PLAN: MealBlock[] = [
  {
    meal: "Breakfast",
    percentage: 25,
    targetKcalApprox: 500,
    targetProteinApprox: 32,
    options: [
      {
        name: "Paneer Bhurji & Multigrain Toast",
        items: [
          "150g Low-fat Paneer (crumbled)",
          "1 medium onion & tomato sautéed with green chili, turmeric & jeera",
          "2 slices 100% whole wheat or multigrain toast",
          "1 cup green tea or black coffee",
        ],
        protein: 34,
        calories: 490,
        prepTime: "12 mins",
        notes: "High biological value vegetarian protein with slow-burning complex carbs.",
      },
      {
        name: "High-Protein Moong Dal Chilla & Greek Dahi",
        items: [
          "1 cup soaked yellow moong dal paste with ajwain & hing",
          "50g grated paneer stuffed inside chillas",
          "100g low-fat hung curd (dahi) with roasted jeera powder",
          "Mint & coriander chutney",
        ],
        protein: 32,
        calories: 470,
        prepTime: "15 mins",
        notes: "Moong dal is easily digestible and easy on the stomach before morning workouts.",
      },
      {
        name: "Pro-Oats Power Bowl",
        items: [
          "60g Rolled Oats cooked in 200ml skim milk",
          "1 scoop Whey Protein (unflavored or chocolate)",
          "1 tbsp Chia seeds (soaked)",
          "10 chopped almonds",
        ],
        protein: 36,
        calories: 510,
        prepTime: "5 mins",
        notes: "Fastest morning breakfast for busy days. Combines whey with oats and healthy fats.",
      },
    ],
  },
  {
    meal: "Lunch",
    percentage: 30,
    targetKcalApprox: 620,
    targetProteinApprox: 42,
    options: [
      {
        name: "Soya Chunks Curry & Brown Rice",
        items: [
          "50g Soya Chunks (boiled & squeezed dry, cooked in rich onion-tomato masala)",
          "1 cup cooked brown basmati rice or 2 whole wheat rotis",
          "1 bowl Yellow Arhar / Toor Dal (150ml)",
          "Large cucumber and carrot salad with fresh lemon juice",
        ],
        protein: 44,
        calories: 590,
        prepTime: "25 mins",
        notes: "Soya chunks provide unmatched 52% pure plant protein density.",
      },
      {
        name: "Palak Paneer & Kala Chana Bowl",
        items: [
          "150g Low-fat Paneer cubes in spiced spinach purée",
          "1 bowl boiled Kala Chana (black chickpeas) tempered with mustard seeds",
          "2 Phulkas (dry rotis, minimal oil)",
          "100g homemade dahi",
        ],
        protein: 41,
        calories: 630,
        prepTime: "20 mins",
        notes: "Rich in iron from spinach and fiber from whole black chana.",
      },
    ],
  },
  {
    meal: "Snack",
    percentage: 15,
    targetKcalApprox: 310,
    targetProteinApprox: 24,
    options: [
      {
        name: "Roasted Chana & Salted Peanuts",
        items: [
          "50g Bhuna Chana (roasted black chickpea with skin)",
          "15g Roasted peanuts",
          "1 cup Indian chai with skim milk (no added sugar)",
        ],
        protein: 16,
        calories: 280,
        prepTime: "1 min",
        notes: "Pantry staple. Perfect crunchy gym bag snack.",
      },
      {
        name: "Sprouted Moong Chaat with Tofu",
        items: [
          "1 bowl boiled sprouted green moong",
          "75g cubed firm tofu or paneer",
          "Diced cucumber, onion, tomato, chaat masala, rock salt & lime",
        ],
        protein: 22,
        calories: 270,
        prepTime: "5 mins",
        notes: "Sprouting increases bio-availability of micronutrients and zinc.",
      },
      {
        name: "Fast Whey Shake",
        items: [
          "1 scoop (30g) Whey protein in 250ml chilled water",
          "1 medium banana (for post-workout glycogen replenishment)",
        ],
        protein: 26,
        calories: 230,
        prepTime: "1 min",
        notes: "Quickest pre or post-workout protein delivery with zero prep.",
      },
    ],
  },
  {
    meal: "Dinner",
    percentage: 30,
    targetKcalApprox: 620,
    targetProteinApprox: 42,
    options: [
      {
        name: "Tofu & Mixed Veggie Sauté with Dal Khichdi",
        items: [
          "150g High-protein firm tofu cubed and seared with garlic & peppers",
          "1 bowl Moong Dal & Quinoa/Rice Khichdi (light & easy to digest)",
          "1 bowl mixed vegetable raita",
        ],
        protein: 38,
        calories: 580,
        prepTime: "20 mins",
        notes: "Light on digestion for improved REM sleep quality and nocturnal recovery.",
      },
      {
        name: "Paneer & Soya Tikka Feast",
        items: [
          "100g Low-fat Paneer + 30g Soya granules/chunks marinated in spiced dahi & grilled on flat pan",
          "2 soft phulkas",
          "1 bowl thick tadka masoor dal (red lentils)",
          "Sliced onions with fresh green mint chutney",
        ],
        protein: 45,
        calories: 640,
        prepTime: "25 mins",
        notes: "Restaurant-flavor profile with pristine macro composition.",
      },
    ],
  },
];

const EGGETARIAN_MEAL_PLAN: MealBlock[] = [
  {
    meal: "Breakfast",
    percentage: 25,
    targetKcalApprox: 520,
    targetProteinApprox: 36,
    options: [
      {
        name: "Spicy Indian Egg Bhurji & Toast",
        items: [
          "3 Whole Eggs + 2 Egg Whites scrambled with onions, green chilies, tomatoes, cilantro",
          "2 slices whole wheat toast with light butter",
          "1 cup black coffee or masala chai with skim milk",
        ],
        protein: 36,
        calories: 490,
        prepTime: "10 mins",
        notes: "Complete amino acid profile with bio-available choline for nervous system health.",
      },
      {
        name: "Boiled Eggs, Avocado & Roasted Chana",
        items: [
          "4 Hard-boiled eggs (2 whole + 2 whites) sprinkled with black pepper & rock salt",
          "40g roasted chana",
          "1 slice multi-grain toast with avocado / olive oil",
        ],
        protein: 34,
        calories: 480,
        prepTime: "12 mins",
        notes: "Can be batch-boiled in advance for the entire week.",
      },
    ],
  },
  {
    meal: "Lunch",
    percentage: 30,
    targetKcalApprox: 620,
    targetProteinApprox: 42,
    options: [
      {
        name: "Dhaba-Style Egg Curry & Rice",
        items: [
          "3 Hard-boiled eggs simmered in spiced onion-tomato-ginger gravy",
          "1.5 cups cooked basmati rice or 2 rotis",
          "1 bowl thick Yellow Dal (150ml)",
          "Sliced cucumber and red onion salad",
        ],
        protein: 38,
        calories: 610,
        prepTime: "25 mins",
        notes: "Classic Indian comfort food packed with complete protein and minerals.",
      },
      {
        name: "Egg & Soya High-Protein Pulao",
        items: [
          "Rice cooked with 30g soya chunks, 2 hard-boiled eggs chopped, peas, and whole spices (cloves, cardamom)",
          "1 bowl thick dahi raita (150g)",
        ],
        protein: 43,
        calories: 620,
        prepTime: "20 mins",
        notes: "Combines plant and egg proteins for maximum muscle protein synthesis.",
      },
    ],
  },
  {
    meal: "Snack",
    percentage: 15,
    targetKcalApprox: 310,
    targetProteinApprox: 24,
    options: [
      {
        name: "Masala French Toast (Savory)",
        items: [
          "2 Whole eggs whisked with green chili, coriander, turmeric & salt",
          "2 slices whole wheat bread coated and pan-seared",
        ],
        protein: 20,
        calories: 290,
        prepTime: "8 mins",
        notes: "Savory Indian twist on French toast with zero sugar.",
      },
      {
        name: "Boiled Egg Chaat",
        items: [
          "3 Boiled eggs (sliced) tossed with chaat masala, onions, coriander, lemon juice",
          "25g roasted chana on the side",
        ],
        protein: 22,
        calories: 270,
        prepTime: "5 mins",
        notes: "Satisfies street food cravings with pure lean protein.",
      },
    ],
  },
  {
    meal: "Dinner",
    percentage: 30,
    targetKcalApprox: 620,
    targetProteinApprox: 42,
    options: [
      {
        name: "Egg Omelette Roll with Paneer",
        items: [
          "2-Egg omelette wrapped inside a thin whole wheat roti",
          "Stuffed with 75g grated low-fat paneer, shredded cabbage & mint dip",
          "1 bowl mixed vegetable dal",
        ],
        protein: 42,
        calories: 610,
        prepTime: "15 mins",
        notes: "Kolkata-style roll reinvented as a clean fitness powerhouse.",
      },
      {
        name: "Egg & Paneer Curry with Phulkas",
        items: [
          "2 Boiled eggs + 75g paneer cubes cooked in homestyle tomato gravy",
          "2 dry phulkas",
          "Kachumber salad (cucumber, tomato, onion with lemon)",
        ],
        protein: 40,
        calories: 590,
        prepTime: "20 mins",
        notes: "Steady overnight amino acid release from casein (paneer) and albumin (egg).",
      },
    ],
  },
];

export default function MealPlanPage() {
  const [diet, setDiet] = useState<"veg" | "egg">("veg");
  const mealPlan = diet === "veg" ? VEGETARIAN_MEAL_PLAN : EGGETARIAN_MEAL_PLAN;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/food">
          <Button variant="ghost" size="icon" aria-label="Back to food">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Structured Meal Plans
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Science-backed 25 / 30 / 15 / 30 Indian macro distribution templates
          </p>
        </div>
      </div>

      {/* Diet Switcher */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-muted/60 border border-border">
        <button
          onClick={() => setDiet("veg")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            diet === "veg"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🌱 Pure Vegetarian
        </button>
        <button
          onClick={() => setDiet("egg")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            diet === "egg"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🥚 Eggetarian
        </button>
      </div>

      {/* Philosophy Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold text-foreground">
              Built Specifically for Indian Kitchens
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Never rely on expensive imported ingredients or plain boiled lentils. These recipes make standard Indian staples (paneer, soya, dal, dahi, chana{diet === "egg" ? ", and eggs" : ""}) hit your 140g+ daily target while staying within your daily calorie cap.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meal Blocks */}
      <div className="space-y-6">
        {mealPlan.map((block) => (
          <div key={block.meal} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-black text-foreground">{block.meal}</h2>
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {block.percentage}% of Daily Target
                </Badge>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Target: ~{block.targetKcalApprox} kcal • ~{block.targetProteinApprox}g protein
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {block.options.map((opt, idx) => (
                <Card key={idx} className="border-border hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {opt.name}
                      </CardTitle>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none shrink-0 text-xs font-bold">
                        {opt.protein}g protein
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-3 text-xs pt-1">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {opt.calories} kcal
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {opt.prepTime}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {opt.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground italic">
                      💡 {opt.notes}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Supplement Guide Section */}
      <div className="pt-6 border-t border-border space-y-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span>Supplement Strategy for Indian Lifters</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Evidence-based additions to support dumbbell progression and vegetarian recovery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Creatine Monohydrate</CardTitle>
                <Badge variant="outline" className="text-xs">3–5g Daily</Badge>
              </div>
              <CardDescription className="text-xs">
                Essential for vegetarians who consume zero dietary creatine from meat.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Takes 2-3 weeks to saturate muscle phosphocreatine stores. Increases dumbbell pressing strength by 5-10% and hydrates muscle cells.
              </p>
              <div className="font-semibold text-foreground">
                Protocol: 3g to 5g with water or post-workout shake at any consistent time of day.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Whey Protein</CardTitle>
                <Badge variant="outline" className="text-xs">Optional Convenience</Badge>
              </div>
              <CardDescription className="text-xs">
                Filtered dairy protein, 100% vegetarian friendly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                A single scoop yields 24-27g protein with minimal carbs and fat. Excellent for busy office days or when dining out limits paneer/soya access.
              </p>
              <div className="font-semibold text-foreground">
                Protocol: 1 scoop in cold water or mixed into morning oats as needed.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Vitamin B12 &amp; D3</CardTitle>
                <Badge variant="outline" className="text-xs">Health Baseline</Badge>
              </div>
              <CardDescription className="text-xs">
                Crucial micronutrients for energy, mood, and testosterone synthesis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Over 70% of urban Indians are deficient in Vitamin D3 and B12. Deficiency triggers chronic fatigue, joint soreness, and poor workout recovery.
              </p>
              <div className="font-semibold text-foreground">
                Check blood levels annually; supplement with physician guidance.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Medical &amp; Dietary Disclaimer:</strong> This meal plan and supplement guidance is for general athletic conditioning and educational purposes only. Always consult with a registered physician or healthcare professional before beginning any new supplement regimen or radically altering caloric intake, especially if you have underlying metabolic conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
