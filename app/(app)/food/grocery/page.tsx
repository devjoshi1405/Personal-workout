"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle2, 
  Plus, 
  RotateCcw, 
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface GroceryItemState {
  id: string;
  name: string;
  quantity: string;
  category: "Protein Staples" | "Dals & Grains" | "Healthy Fats & Nuts" | "Fresh Produce" | "Custom";
  checked: boolean;
}

const DEFAULT_GROCERY_ITEMS: GroceryItemState[] = [
  // Protein Staples
  { id: "1", name: "Soya Chunks / Granules (Nutrela)", quantity: "500g", category: "Protein Staples", checked: false },
  { id: "2", name: "Low-Fat Paneer (Fresh/Vacuum)", quantity: "1 kg", category: "Protein Staples", checked: false },
  { id: "3", name: "Firm Tofu (Soy Paneer)", quantity: "400g", category: "Protein Staples", checked: false },
  { id: "4", name: "Greek Yogurt / Hung Dahi", quantity: "400g", category: "Protein Staples", checked: false },
  { id: "5", name: "Eggs (Grade A, Fresh)", quantity: "2-3 Dozen", category: "Protein Staples", checked: false },

  // Dals & Grains
  { id: "6", name: "Yellow Moong Dal (Split)", quantity: "1 kg", category: "Dals & Grains", checked: false },
  { id: "7", name: "Kala Chana (Black Chickpeas)", quantity: "500g", category: "Dals & Grains", checked: false },
  { id: "8", name: "Rolled Oats", quantity: "1 kg", category: "Dals & Grains", checked: false },
  { id: "9", name: "Whole Wheat Chakki Atta", quantity: "5 kg", category: "Dals & Grains", checked: false },
  { id: "10", name: "Besan (Gram Flour)", quantity: "500g", category: "Dals & Grains", checked: false },
  { id: "11", name: "Brown / Basmati Rice", quantity: "2 kg", category: "Dals & Grains", checked: false },

  // Healthy Fats & Nuts
  { id: "12", name: "Bhuna Roasted Chana (Gym Snack)", quantity: "500g", category: "Healthy Fats & Nuts", checked: false },
  { id: "13", name: "Raw Peanuts (Groundnuts)", quantity: "500g", category: "Healthy Fats & Nuts", checked: false },
  { id: "14", name: "Chia Seeds & Flax Seeds", quantity: "250g", category: "Healthy Fats & Nuts", checked: false },
  { id: "15", name: "Raw Almonds", quantity: "250g", category: "Healthy Fats & Nuts", checked: false },

  // Fresh Produce
  { id: "16", name: "Fresh Palak (Spinach)", quantity: "2 bunches", category: "Fresh Produce", checked: false },
  { id: "17", name: "Cucumbers & Carrots", quantity: "1.5 kg", category: "Fresh Produce", checked: false },
  { id: "18", name: "Tomatoes & Red Onions", quantity: "2 kg each", category: "Fresh Produce", checked: false },
  { id: "19", name: "Ginger, Garlic & Green Chilies", quantity: "250g", category: "Fresh Produce", checked: false },
  { id: "20", name: "Fresh Lemons", quantity: "8-10 pcs", category: "Fresh Produce", checked: false },
];

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItemState[]>(DEFAULT_GROCERY_ITEMS);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bench_and_dal_grocery");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveItems = (newItems: GroceryItemState[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("bench_and_dal_grocery", JSON.stringify(newItems));
    } catch {
      // Silent error handling for storage limits
    }
  };

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveItems(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: GroceryItemState = {
      id: "c_" + Date.now().toString(),
      name: customName.trim(),
      quantity: customQty.trim() || "1 pack",
      category: "Custom",
      checked: false,
    };

    saveItems([newItem, ...items]);
    setCustomName("");
    setCustomQty("");
  };

  const handleCheckAll = (check: boolean) => {
    const updated = items.map((i) => ({ ...i, checked: check }));
    saveItems(updated);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset grocery list back to standard Indian weekly staples?")) {
      saveItems(DEFAULT_GROCERY_ITEMS);
    }
  };

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  const categories: Array<GroceryItemState["category"]> = [
    "Protein Staples",
    "Dals & Grains",
    "Healthy Fats & Nuts",
    "Fresh Produce",
    "Custom",
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/food">
            <Button variant="ghost" size="icon" aria-label="Back to food">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Weekly Grocery List
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              High-protein Indian pantry &amp; fridge staples checklist
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Defaults</span>
        </Button>
      </div>

      {/* Progress & Quick Actions */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm text-foreground">
                Cart Progress: {packedItems} of {totalItems} items packed
              </span>
            </div>
            <Badge
              className={`font-black text-xs ${
                progressPercent === 100
                  ? "bg-green-600 text-white"
                  : "bg-primary/10 text-primary border-none"
              }`}
            >
              {progressPercent}%
            </Badge>
          </div>

          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCheckAll(true)}
                className="font-semibold text-primary hover:underline"
              >
                Check All
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                onClick={() => handleCheckAll(false)}
                className="font-semibold text-muted-foreground hover:text-foreground"
              >
                Uncheck All
              </button>
            </div>
            <span className="text-muted-foreground italic flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" />
              Swipe or tap anywhere on the row to toggle
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Custom Item */}
      <form onSubmit={handleAddCustom} className="flex gap-2">
        <Input
          placeholder="Add custom item (e.g. Cinnamon, Makhana)..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="flex-1 text-sm h-11"
        />
        <Input
          placeholder="Qty (e.g. 250g)"
          value={customQty}
          onChange={(e) => setCustomQty(e.target.value)}
          className="w-28 text-sm h-11 hidden sm:block"
        />
        <Button type="submit" size="sm" className="h-11 px-4 font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </Button>
      </form>

      {/* Grocery Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = items.filter((i) => i.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
                {category} ({categoryItems.filter((i) => i.checked).length}/{categoryItems.length})
              </h2>

              <div className="space-y-1.5">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[50px] select-none ${
                      item.checked
                        ? "bg-muted/30 border-border/40 text-muted-foreground opacity-60"
                        : "bg-card border-border hover:border-primary/40 text-foreground shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                          item.checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {item.checked && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="text-sm">
                        <span className={`font-semibold ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {item.quantity}
                      </Badge>
                      {item.category === "Custom" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
