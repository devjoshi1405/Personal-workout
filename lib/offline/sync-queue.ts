import { get, set, del } from "idb-keyval";
import { createClient } from "@/lib/supabase/client";

const QUEUE_KEY = "bench_and_dal_offline_queue";

export type OfflineActionType =
  | "WORKOUT_SESSION"
  | "SET_LOG"
  | "FOOD_LOG"
  | "WEIGHT_ENTRY"
  | "DAILY_HABIT";

export interface OfflineQueuedAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  timestamp: string;
  retryCount: number;
}

export async function queueOfflineAction(
  type: OfflineActionType,
  payload: any
): Promise<void> {
  const action: OfflineQueuedAction = {
    id: "offline_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7),
    type,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const existing = (await get<OfflineQueuedAction[]>(QUEUE_KEY)) || [];
    existing.push(action);
    await set(QUEUE_KEY, existing);
  } catch (err) {
    // If IndexedDB fails, fallback to localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(QUEUE_KEY);
        const list: OfflineQueuedAction[] = raw ? JSON.parse(raw) : [];
        list.push(action);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
      } catch {}
    }
  }
}

export async function getQueuedActions(): Promise<OfflineQueuedAction[]> {
  try {
    const actions = await get<OfflineQueuedAction[]>(QUEUE_KEY);
    if (actions && actions.length > 0) return actions;
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }

  return [];
}

export async function clearQueuedActions(): Promise<void> {
  try {
    await del(QUEUE_KEY);
  } catch {}
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch {}
  }
}

/**
 * Flushes all queued actions to Supabase when internet is restored.
 */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueuedActions();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder-project")) {
    // In mock mode, simply clear queue
    await clearQueuedActions();
    return { synced: queue.length, failed: 0 };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { synced: 0, failed: queue.length };
  }

  let synced = 0;
  let failed = 0;
  const remainingActions: OfflineQueuedAction[] = [];

  for (const item of queue) {
    try {
      if (item.type === "WORKOUT_SESSION") {
        await supabase.from("workout_sessions").insert({
          ...item.payload,
          user_id: user.id,
        });
      } else if (item.type === "SET_LOG") {
        await supabase.from("set_logs").insert({
          ...item.payload,
          user_id: user.id,
        });
      } else if (item.type === "FOOD_LOG") {
        await supabase.from("food_logs").insert({
          ...item.payload,
          user_id: user.id,
        });
      } else if (item.type === "WEIGHT_ENTRY") {
        await supabase.from("weight_entries").upsert({
          ...item.payload,
          user_id: user.id,
        }, { onConflict: "user_id,date" });
      } else if (item.type === "DAILY_HABIT") {
        await supabase.from("daily_habits").upsert({
          ...item.payload,
          user_id: user.id,
        }, { onConflict: "user_id,date" });
      }
      synced++;
    } catch {
      failed++;
      item.retryCount++;
      if (item.retryCount < 5) {
        remainingActions.push(item);
      }
    }
  }

  try {
    await set(QUEUE_KEY, remainingActions);
  } catch {}

  return { synced, failed };
}
